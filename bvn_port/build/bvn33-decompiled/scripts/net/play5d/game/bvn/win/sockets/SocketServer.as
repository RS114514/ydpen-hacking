package net.play5d.game.bvn.win.sockets
{
   import flash.events.Event;
   import flash.events.EventDispatcher;
   import flash.events.ProgressEvent;
   import flash.events.ServerSocketConnectEvent;
   import flash.net.ServerSocket;
   import flash.net.Socket;
   import flash.utils.ByteArray;
   import net.play5d.game.bvn.win.sockets.events.SocketEvent;
   
   public class SocketServer extends EventDispatcher
   {
      
      private static var _i:SocketServer;
      
      public var connected:Boolean;
      
      private var _serverSocket:ServerSocket;
      
      private var _clients:Vector.<Socket>;
      
      private var _packetBuffer:PacketBuffer;
      
      public function SocketServer()
      {
         super();
      }
      
      public static function get I() : SocketServer
      {
         if(!_i)
         {
            _i = new SocketServer();
         }
         return _i;
      }
      
      public function get port() : int
      {
         return _serverSocket.localPort;
      }
      
      public function bind(param1:int) : void
      {
         close();
         _serverSocket = new ServerSocket();
         _serverSocket.addEventListener("connect",onClientConnect);
         _serverSocket.addEventListener("close",onClose);
         _clients = new Vector.<Socket>();
         _packetBuffer = new PacketBuffer();
         try
         {
            _serverSocket.bind(param1);
            _serverSocket.listen();
            log("SERVER SOCKET正在监听端口:" + _serverSocket.localPort);
         }
         catch(e:Error)
         {
            log("监听失败，请尝试另一个端口");
         }
         connected = _serverSocket.bound;
      }
      
      public function get clients() : Vector.<Socket>
      {
         return _clients;
      }
      
      public function close() : void
      {
         if(_clients)
         {
            for each(var _loc1_:Socket in _clients)
            {
               if(_loc1_.connected)
               {
                  _loc1_.close();
               }
            }
            _clients = null;
         }
         if(_serverSocket)
         {
            _serverSocket.close();
            _serverSocket = null;
         }
         connected = false;
      }
      
      public function getClientByIP(param1:String) : Socket
      {
         for each(var _loc2_:Socket in _clients)
         {
            if(_loc2_.remoteAddress == param1)
            {
               return _loc2_;
            }
         }
         return null;
      }
      
      private function onClientConnect(param1:ServerSocketConnectEvent) : void
      {
         var _loc3_:Socket = param1.socket;
         _loc3_.addEventListener("socketData",onClientSocketData);
         _clients.push(_loc3_);
         _loc3_.addEventListener("close",onCloseClient);
         log("Connection from " + _loc3_.localAddress + ":" + _loc3_.localPort);
         connected = true;
         var _loc2_:SocketEvent = new SocketEvent("SocketEvent_CLIENT_CONNECT");
         _loc2_.clientSocket = _loc3_;
         dispatchEvent(_loc2_);
      }
      
      private function onClose(param1:Event) : void
      {
         _serverSocket.removeEventListener("connect",onClientConnect);
         _serverSocket.removeEventListener("close",onClose);
         dispatchEvent(new SocketEvent("SocketEvent_CLOSE"));
         connected = false;
         log("Connection Closed ");
      }
      
      private function onCloseClient(param1:Event) : void
      {
         var _loc5_:int = 0;
         var _loc2_:Socket = null;
         var _loc3_:SocketEvent = null;
         var _loc4_:Socket = param1.target as Socket;
         _loc5_ = 0;
         while(_loc5_ < _clients.length)
         {
            _loc2_ = _clients[_loc5_];
            if(_loc2_.remoteAddress == _loc4_.remoteAddress && _loc2_.remotePort == _loc4_.remotePort)
            {
               _clients.splice(_loc5_,1);
               log(param1.target.remoteAddress + ":" + param1.target.remotePort + "断开");
               _loc3_ = new SocketEvent("SocketEvent_CLIENT_DIS_CONNECT");
               _loc3_.clientSocket = _loc2_;
               dispatchEvent(_loc3_);
            }
            _loc5_++;
         }
      }
      
      private function onClientSocketData(param1:ProgressEvent) : void
      {
         var _loc6_:SocketEvent = null;
         var _loc2_:ByteArray = new ByteArray();
         var _loc3_:Socket = param1.currentTarget as Socket;
         _loc3_.readBytes(_loc2_,0,_loc3_.bytesAvailable);
         PacketUtils.uncompress(_loc2_);
         _packetBuffer.push(_loc2_);
         var _loc5_:Array = _packetBuffer.getPackets();
         for each(var _loc4_:ByteArray in _loc5_)
         {
            _loc6_ = new SocketEvent("SocketEvent_RECEIVE_DATA");
            _loc6_.data = _loc4_;
            _loc6_.clientSocket = _loc3_;
            dispatchEvent(_loc6_);
            log("Received from Client" + _loc3_.remoteAddress + ":" + _loc3_.remotePort + "-- " + _loc4_);
         }
      }
      
      public function sendAll(param1:Object) : void
      {
         var _loc3_:int = 0;
         var _loc2_:Socket = null;
         try
         {
            if(_clients.length == 0)
            {
               log("没有连接");
               return;
            }
            _loc3_ = 0;
            while(_loc3_ < _clients.length)
            {
               _loc2_ = _clients[_loc3_] as Socket;
               send(_loc2_,param1);
               _loc3_++;
            }
         }
         catch(error:Error)
         {
            log(error.message);
         }
      }
      
      public function send(param1:Socket, param2:Object) : void
      {
         var _loc3_:ByteArray = null;
         if(param1 == null)
         {
            return;
         }
         if(param2 is ByteArray)
         {
            _loc3_ = PacketUtils.addByteArrayHead(param2 as ByteArray);
         }
         else
         {
            _loc3_ = PacketUtils.createByteArrayWithHead(param2);
         }
         PacketUtils.compress(_loc3_);
         param1.objectEncoding = 3;
         param1.writeBytes(_loc3_,0,_loc3_.bytesAvailable);
         param1.flush();
      }
      
      public function sendJson(param1:*, param2:Object) : void
      {
         var _loc3_:String = JSON.stringify(param2);
         send(param1,_loc3_);
      }
      
      public function sendByIP(param1:String, param2:ByteArray) : void
      {
         var _loc3_:Socket = getClientByIP(param1);
         send(_loc3_,param2);
      }
      
      public function log(param1:String) : void
      {
      }
   }
}

