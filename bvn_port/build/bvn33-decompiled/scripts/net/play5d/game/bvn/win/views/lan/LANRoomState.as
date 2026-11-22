package net.play5d.game.bvn.win.views.lan
{
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.TimerEvent;
   import flash.utils.Timer;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.AssetManager;
   import net.play5d.game.bvn.ctrl.SoundCtrl;
   import net.play5d.game.bvn.data.GameMode;
   import net.play5d.game.bvn.ui.GameUI;
   import net.play5d.game.bvn.win.ctrls.LANClientCtrl;
   import net.play5d.game.bvn.win.ctrls.LANServerCtrl;
   import net.play5d.game.bvn.win.data.HostVO;
   import net.play5d.game.bvn.win.data.LanGameModel;
   import net.play5d.game.bvn.win.utils.UIAssetUtil;
   import net.play5d.kyo.stage.Istage;
   import net.play5d.kyo.utils.KyoBtnUtils;
   import net.play5d.kyo.utils.KyoUtils;
   
   public class LANRoomState implements Istage
   {
      
      private var _ui:MovieClip;
      
      private var _txtChart:*;
      
      private var _host:HostVO;
      
      private var _isOwner:Boolean;
      
      private var _playerMap:Object = {};
      
      private var _startTimer:Timer;
      
      public function LANRoomState()
      {
         super();
      }
      
      public function get display() : DisplayObject
      {
         return _ui;
      }
      
      public function build() : void
      {
         _ui = UIAssetUtil.I.createDisplayObject("room_mc");
         _ui.input_chart.addEventListener("enter",submitChart);
         KyoBtnUtils.initBtn(_ui.btn_chart,submitChart);
         KyoBtnUtils.initBtn(_ui.btn_start,startGame);
         KyoBtnUtils.initBtn(_ui.btn_exit,exit);
         SoundCtrl.I.BGM(AssetManager.I.getSound("continue"));
      }
      
      public function setStartAble(param1:Boolean) : void
      {
         if(_ui.btn_start && _ui.btn_start.visible)
         {
            (_ui.btn_start as SimpleButton).mouseEnabled = param1;
            KyoUtils.grayMC(_ui.btn_start,param1);
         }
      }
      
      public function hostMode() : void
      {
         _isOwner = true;
         _host = LANServerCtrl.I.host;
         LANServerCtrl.I.setRoom(this);
         initUI();
      }
      
      public function clientMode(param1:HostVO) : void
      {
         LANClientCtrl.I.setRoom(this);
         addPlayer("self",LanGameModel.I.playerName);
         _isOwner = false;
         _host = param1;
         initUI();
      }
      
      private function initUI() : void
      {
         _ui.txt_name.text = _host.name;
         _ui.txt_mode.text = _host.getGameModeStr();
         _ui.txt_pass.text = _host.password ? "密码：" + _host.password : "";
         _ui.btn_start.visible = _isOwner;
         _ui.txt_start.visible = _isOwner;
         _txtChart = _ui.txt_chart;
         addOwner();
      }
      
      public function afterBuild() : void
      {
      }
      
      public function destory(param1:Function = null) : void
      {
         if(_startTimer)
         {
            _startTimer.removeEventListener("timer",startTimerHandler);
            _startTimer.removeEventListener("timerComplete",startTimerHandler);
            _startTimer.stop();
            _startTimer = null;
         }
         if(_isOwner)
         {
            if(!LANServerCtrl.I.active)
            {
               LANServerCtrl.I.stopServer();
            }
         }
         else if(!LANClientCtrl.I.active)
         {
            LANClientCtrl.I.dispose();
         }
         try
         {
            _ui.input_chart.removeEventListener("enter",submitChart);
            KyoBtnUtils.disposeBtn(_ui.btn_chart);
            KyoBtnUtils.disposeBtn(_ui.btn_start);
            KyoBtnUtils.disposeBtn(_ui.btn_exit);
         }
         catch(e:Error)
         {
         }
      }
      
      private function submitChart(... rest) : void
      {
         var _loc2_:String = _ui.input_chart.text;
         if(_loc2_ == "")
         {
            return;
         }
         _ui.input_chart.text = "";
         if(_isOwner)
         {
            LANServerCtrl.I.sendChart(_loc2_,LanGameModel.I.playerName);
         }
         else
         {
            LANClientCtrl.I.sendChart(_loc2_);
         }
      }
      
      private function startGame() : void
      {
         if(_isOwner)
         {
            SoundCtrl.I.sndConfrim();
            LANServerCtrl.I.sendStart();
         }
      }
      
      public function startGameTimer() : void
      {
         if(_startTimer)
         {
            return;
         }
         _startTimer = new Timer(1000,5);
         _startTimer.addEventListener("timer",startTimerHandler);
         _startTimer.addEventListener("timerComplete",startTimerHandler);
         _startTimer.start();
      }
      
      private function startTimerHandler(param1:TimerEvent) : void
      {
         if(param1.type == "timer")
         {
            pushChart(_startTimer.repeatCount - _startTimer.currentCount + 1 + "秒后开始游戏",null);
         }
         if(param1.type == "timerComplete")
         {
            if(_isOwner)
            {
               LANServerCtrl.I.gameStart();
            }
            else
            {
               LANClientCtrl.I.gameStart();
            }
            switch(_host.gameMode - 1)
            {
               case 0:
                  GameMode.currentMode = 11;
                  break;
               case 1:
                  GameMode.currentMode = 21;
            }
            MainGame.I.goSelect();
         }
      }
      
      private function exit() : void
      {
         var _loc1_:LANGameState = new LANGameState();
         MainGame.stageCtrl.goStage(_loc1_);
         if(!_isOwner)
         {
            _loc1_.showHostList();
         }
      }
      
      private function addOwner() : void
      {
         var _loc1_:MovieClip = UIAssetUtil.I.createDisplayObject("player_item_mc");
         _loc1_.txt.text = _host.ownerName;
         _loc1_.type.gotoAndStop(1);
         _loc1_.btn_out.visible = false;
         var _loc2_:Sprite = _ui.ct_player;
         _loc2_.addChild(_loc1_);
      }
      
      public function addPlayer(param1:String, param2:String) : void
      {
         if(_playerMap[param1])
         {
            trace("player:" + param1 + "已存在！");
            return;
         }
         var _loc3_:LANRoomPlayerItem = new LANRoomPlayerItem(param1,param2);
         _loc3_.enableOut();
         _playerMap[param1] = _loc3_;
         var _loc4_:Sprite = _ui.ct_player;
         _loc3_.ui.y = 60;
         _loc4_.addChild(_loc3_.ui);
      }
      
      public function removePlayer(param1:String) : void
      {
         var _loc2_:LANRoomPlayerItem = _playerMap[param1];
         if(_loc2_)
         {
            try
            {
               _ui.ct_player.removeChild(_loc2_.ui);
            }
            catch(e:Error)
            {
            }
            _loc2_.destory();
         }
         delete _playerMap[param1];
      }
      
      public function pushChart(param1:String, param2:String = null) : void
      {
         var _loc3_:String = param2 ? param2 + " : " + param1 : param1;
         _txtChart.appendText(_loc3_ + "\n");
      }
      
      public function exitRoom(param1:String = null) : void
      {
         exit();
         if(param1)
         {
            GameUI.alert("EXIT",param1);
         }
      }
      
      public function lockStart() : void
      {
         if(_ui.btn_start && _ui.btn_start.visible)
         {
            (_ui.btn_start as SimpleButton).mouseEnabled = false;
            KyoUtils.grayMC(_ui.btn_start);
         }
         if(_ui.btn_exit && _ui.btn_exit.visible)
         {
            (_ui.btn_exit as SimpleButton).mouseEnabled = false;
            KyoUtils.grayMC(_ui.btn_exit);
         }
      }
   }
}

