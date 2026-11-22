package net.play5d.game.bvn.win.ctrls
{
   import flash.net.Socket;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.game_ctrls.GameCtrl;
   import net.play5d.game.bvn.data.GameRunDataVO;
   import net.play5d.game.bvn.events.GameEvent;
   import net.play5d.game.bvn.fighter.FighterMain;
   import net.play5d.game.bvn.interfaces.GameInterface;
   import net.play5d.game.bvn.state.GameState;
   import net.play5d.game.bvn.ui.GameUI;
   import net.play5d.game.bvn.win.data.ClientVO;
   import net.play5d.game.bvn.win.data.HostVO;
   import net.play5d.game.bvn.win.input.InputManager;
   import net.play5d.game.bvn.win.sockets.SocketServer;
   import net.play5d.game.bvn.win.sockets.events.SocketEvent;
   import net.play5d.game.bvn.win.sockets.udp.UDPDataVO;
   import net.play5d.game.bvn.win.sockets.udp.UDPSocket;
   import net.play5d.game.bvn.win.utils.JsonUtils;
   import net.play5d.game.bvn.win.utils.LANUtils;
   import net.play5d.game.bvn.win.utils.LockFrameLogic;
   import net.play5d.game.bvn.win.utils.SocketMsgFactory;
   import net.play5d.game.bvn.win.views.lan.LANGameState;
   import net.play5d.game.bvn.win.views.lan.LANRoomState;
   
   public class LANServerCtrl
   {
      
      private static var _i:LANServerCtrl;
      
      public var active:Boolean;
      
      public var onPlayerJoinSuccess:Function;
      
      private var _room:LANRoomState;
      
      private var _clientK:int;
      
      private var _serverK:int;
      
      private var _clients:Vector.<ClientVO> = new Vector.<ClientVO>();
      
      private var _udpClientMap:Object = {};
      
      private var _host:HostVO;
      
      private var _renderFrame:uint;
      
      private var _renderFrameClient:uint;
      
      private var _renderNextFrame:uint;
      
      private var _renderSyncFrame:int;
      
      private var _sendUpdateFrame:int;
      
      private var _selectLogic:SelectFighterServerLogic;
      
      private var _connGameLogic:LockFrameServerLogic;
      
      private var _udpSocket:UDPSocket;
      
      private var _kickTimeoutInt:int;
      
      public function LANServerCtrl()
      {
         super();
      }
      
      public static function get I() : LANServerCtrl
      {
         if(!_i)
         {
            _i = new LANServerCtrl();
         }
         return _i;
      }
      
      public function get host() : HostVO
      {
         return _host;
      }
      
      public function setRoom(param1:LANRoomState) : void
      {
         _room = param1;
         _room.setStartAble(false);
      }
      
      public function startServer(param1:HostVO) : void
      {
         _host = param1;
         SocketServer.I.bind(17511);
         SocketServer.I.addEventListener("SocketEvent_CLIENT_CONNECT",socketHandler);
         SocketServer.I.addEventListener("SocketEvent_CLIENT_DIS_CONNECT",socketHandler);
         SocketServer.I.addEventListener("SocketEvent_RECEIVE_DATA",tcpDataHandler);
         _udpSocket = new UDPSocket();
         _udpSocket.listen(17477);
         _udpSocket.addDataHandler(udpDataHandler);
      }
      
      public function stopServer() : void
      {
         _host = null;
         SocketServer.I.close();
         SocketServer.I.removeEventListener("SocketEvent_CLIENT_CONNECT",socketHandler);
         SocketServer.I.removeEventListener("SocketEvent_CLIENT_DIS_CONNECT",socketHandler);
         SocketServer.I.removeEventListener("SocketEvent_RECEIVE_DATA",tcpDataHandler);
         if(_udpSocket)
         {
            _udpSocket.unListen();
            _udpSocket.removeDataHandler(udpDataHandler);
            _udpSocket = null;
         }
         if(_selectLogic)
         {
            _selectLogic.dispose();
            _selectLogic = null;
         }
         if(_connGameLogic)
         {
            _connGameLogic.dispose();
            _connGameLogic = null;
         }
         _clients = new Vector.<ClientVO>();
         _room = null;
         _host = null;
      }
      
      private function socketHandler(param1:SocketEvent) : void
      {
         var _loc2_:int = 0;
         trace(param1);
         switch(param1.type)
         {
            case "SocketEvent_CLIENT_CONNECT":
               break;
            case "SocketEvent_CLIENT_DIS_CONNECT":
               if(active)
               {
                  gameEnd();
                  GameUI.alert("PLAYER EXIT","玩家退出房间");
               }
               while(_loc2_ < _clients.length)
               {
                  if(_clients[_loc2_].socket == param1.clientSocket)
                  {
                     if(_room)
                     {
                        _room.removePlayer(_clients[_loc2_].ip);
                        _room.pushChart(_clients[_loc2_].name + "退出房间");
                        _room.setStartAble(false);
                     }
                     _clients.splice(_loc2_,1);
                  }
                  _loc2_++;
               }
         }
      }
      
      private function udpDataHandler(param1:UDPDataVO) : void
      {
         if(param1.getDataObject() && param1.getDataObject().type == "FIND_HOST")
         {
            if(!active)
            {
               _udpSocket.send(param1.fromIP,param1.fromPort,SocketMsgFactory.createFindHostBackMsg());
            }
            return;
         }
         if(_connGameLogic && _connGameLogic.receiveInput(param1.getDataByteArray()))
         {
            _udpClientMap[param1.fromIP + ":" + param1.fromPort] = param1.fromIP;
            return;
         }
      }
      
      private function tcpDataHandler(param1:SocketEvent) : void
      {
         var _loc3_:Object = param1.getDataObject();
         if(!_loc3_)
         {
            return;
         }
         if(_selectLogic && _selectLogic.receiveSelect(_loc3_))
         {
            return;
         }
         var _loc2_:Object = JsonUtils.str2json(_loc3_);
         if(_loc2_)
         {
            receiveJson(_loc2_,param1.clientSocket);
         }
      }
      
      private function receiveJson(param1:Object, param2:Socket) : void
      {
         var _loc3_:ClientVO = null;
         switch(param1.type)
         {
            case "JOIN":
               receiveJoin(param1,param2);
               break;
            case "JOIN_IN":
               if(_room)
               {
                  _room.setStartAble(true);
                  sendChart(param1.name + "进入房间");
               }
               break;
            case "CHART":
               _loc3_ = findClient(param2);
               if(_room)
               {
                  _room.pushChart(param1.msg,_loc3_.name);
               }
               sendClientsChart(param1.msg,_loc3_.name);
         }
      }
      
      private function receiveJoin(param1:Object, param2:Socket) : void
      {
         if(_clients.length > 0)
         {
            SocketServer.I.sendJson(param2,SocketMsgFactory.createJoinFailMsg("人数已满"));
            return;
         }
         var _loc3_:ClientVO = new ClientVO();
         _loc3_.ip = param2.remoteAddress;
         _loc3_.name = param1.name;
         _loc3_.socket = param2;
         _clients.push(_loc3_);
         if(_room)
         {
            _room.addPlayer(_loc3_.ip,_loc3_.name);
            sendChart(_loc3_.name + "正在进入房间...");
            _room.setStartAble(false);
         }
         SocketServer.I.sendJson(_loc3_.socket,SocketMsgFactory.createJoinSuccMsg());
         if(onPlayerJoinSuccess != null)
         {
            onPlayerJoinSuccess();
            onPlayerJoinSuccess = null;
         }
      }
      
      private function findClient(param1:Socket) : ClientVO
      {
         for each(var _loc2_:ClientVO in _clients)
         {
            if(_loc2_.socket == param1)
            {
               return _loc2_;
            }
         }
         return null;
      }
      
      public function sendChart(param1:String, param2:String = null) : void
      {
         sendClientsChart(param1,param2);
         if(_room)
         {
            _room.pushChart(param1,param2);
         }
      }
      
      private function sendClientsChart(param1:String, param2:String) : void
      {
         var _loc3_:Object = SocketMsgFactory.createChart(param1,param2);
         for each(var _loc4_:ClientVO in _clients)
         {
            SocketServer.I.sendJson(_loc4_.socket,_loc3_);
         }
      }
      
      public function sendStart() : void
      {
         var _loc1_:Object = SocketMsgFactory.createStartGame();
         for each(var _loc2_:ClientVO in _clients)
         {
            SocketServer.I.sendJson(_loc2_.socket,_loc1_);
         }
         if(_room)
         {
            _room.startGameTimer();
            _room.lockStart();
         }
      }
      
      public function kickOut(param1:String) : void
      {
         var client:ClientVO;
         var i:int;
         var id:String = param1;
         var kickTimeout:* = function():void
         {
            _kickTimeoutInt = 0;
            if(client && client.socket.connected)
            {
               client.socket.close();
            }
         };
         while(i < _clients.length)
         {
            if(_clients[i].id == id)
            {
               client = _clients[i];
               SocketServer.I.sendJson(client.socket,SocketMsgFactory.createKickOutMsg("你已被踢出房间"));
               if(_kickTimeoutInt == 0)
               {
                  _kickTimeoutInt = setTimeout(kickTimeout,3000);
               }
               else
               {
                  clearTimeout(_kickTimeoutInt);
                  kickTimeout();
               }
               return;
            }
            i = i + 1;
         }
      }
      
      public function gameStart() : void
      {
         active = true;
         GameInterface.instance.updateInputConfig();
         LockFrameLogic.I.initServer();
         _renderFrame = 1;
         LANUtils.updateParams();
         _room = null;
         _selectLogic = new SelectFighterServerLogic();
         _selectLogic.init();
         _connGameLogic = new LockFrameServerLogic();
         LanGameMenuCtrl.I.init();
         initSyncEvent();
      }
      
      public function gameEnd() : void
      {
         active = false;
         GameInterface.instance.updateInputConfig();
         LockFrameLogic.I.dispose();
         if(_selectLogic)
         {
            _selectLogic.dispose();
            _selectLogic = null;
         }
         if(_connGameLogic)
         {
            _connGameLogic.dispose();
            _connGameLogic = null;
         }
         disposeSyncEvent();
         var _loc1_:LANRoomState = new LANRoomState();
         MainGame.stageCtrl.goStage(_loc1_);
         _loc1_.hostMode();
         LanGameMenuCtrl.I.dispose();
      }
      
      public function gameQuit() : void
      {
         active = false;
         GameInterface.instance.updateInputConfig();
         LockFrameLogic.I.dispose();
         disposeSyncEvent();
         LanGameMenuCtrl.I.dispose();
         stopServer();
         MainGame.stageCtrl.goStage(new LANGameState());
      }
      
      private function initSyncEvent() : void
      {
         GameEvent.addEventListener("ROUND_END",onGameRoundEnd);
         GameEvent.addEventListener("GAME_START",onGameStart);
         GameEvent.addEventListener("GAME_END",onGameEnd);
         GameEvent.addEventListener("ROUND_START",onRoundStart);
      }
      
      private function disposeSyncEvent() : void
      {
         GameEvent.removeEventListener("ROUND_END",onGameRoundEnd);
         GameEvent.removeEventListener("GAME_START",onGameStart);
         GameEvent.removeEventListener("GAME_END",onGameEnd);
         GameEvent.removeEventListener("ROUND_START",onRoundStart);
      }
      
      public function renderGame() : Boolean
      {
         if(MainGame.stageCtrl.currentStage is GameState)
         {
            return _connGameLogic.render();
         }
         InputManager.I.socket_input_p1.freeRender();
         return true;
      }
      
      private function onGameStart(param1:GameEvent) : void
      {
         _connGameLogic.enabled = true;
         _connGameLogic.reset();
         var _loc2_:Array = ["SYNC",3];
         sendTCP(_loc2_);
      }
      
      private function onGameEnd(param1:GameEvent) : void
      {
         _connGameLogic.enabled = false;
         _connGameLogic.reset();
         var _loc2_:Array = ["SYNC",4];
         sendTCP(_loc2_);
      }
      
      private function onRoundStart(param1:GameEvent) : void
      {
         _connGameLogic.enabled = true;
      }
      
      private function onGameRoundEnd(param1:GameEvent) : void
      {
         var _loc3_:GameRunDataVO = GameCtrl.I.gameRunData;
         var _loc4_:FighterMain = _loc3_.p1FighterGroup.currentFighter;
         var _loc2_:FighterMain = _loc3_.p2FighterGroup.currentFighter;
         var _loc5_:Array = ["SYNC",7,_loc3_.round,_loc3_.isTimerOver,_loc3_.isDrawGame,_loc4_.hp << 0,_loc2_.hp << 0];
         sendTCP(_loc5_);
         _connGameLogic.enabled = false;
         _connGameLogic.reset();
      }
      
      public function sendTCP(param1:Object) : void
      {
         for each(var _loc2_:ClientVO in _clients)
         {
            SocketServer.I.send(_loc2_.socket,param1);
         }
      }
      
      public function sendUDP(param1:Object) : void
      {
         for each(var _loc2_:String in _udpClientMap)
         {
            _udpSocket.send(_loc2_,17478,param1);
         }
      }
   }
}

