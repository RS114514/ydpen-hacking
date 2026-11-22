package net.play5d.game.bvn.ui
{
   import flash.display.DisplayObject;
   import flash.events.DataEvent;
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.game.bvn.data.GameRunFighterGroup;
   import net.play5d.game.bvn.ui.dialog.AlertUI;
   import net.play5d.game.bvn.ui.dialog.ConfrimUI;
   import net.play5d.game.bvn.ui.fight.FightUI;
   
   public class GameUI
   {
      
      public static var I:GameUI;
      
      public static var BITMAP_UI:Boolean = true;
      
      public static var SHOW_CN_TEXT:Boolean = true;
      
      private static var _confrimUI:ConfrimUI;
      
      private static var _alertUI:AlertUI;
      
      private var _ui:IGameUI;
      
      private var _renderAnimateGap:int;
      
      private var _renderAnimateFrame:int = 0;
      
      public function GameUI()
      {
         super();
         I = this;
         _renderAnimateGap = Math.ceil(GameConfig.FPS_GAME / 30) - 1;
      }
      
      public static function showingDialog() : Boolean
      {
         return _confrimUI != null || _alertUI != null;
      }
      
      public static function confrim(param1:String = null, param2:String = null, param3:Function = null, param4:Function = null) : void
      {
         var enMsg:String = param1;
         var cnMsg:String = param2;
         var yes:Function = param3;
         var no:Function = param4;
         var yesClose:* = function():void
         {
            if(yes != null)
            {
               yes();
            }
            closeConfrim();
            MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["close_confrim",true])));
         };
         var noClose:* = function():void
         {
            if(no != null)
            {
               no();
            }
            closeConfrim();
            MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["close_confrim",false])));
         };
         closeConfrim();
         _confrimUI = new ConfrimUI();
         _confrimUI.setMsg(enMsg,cnMsg);
         _confrimUI.yesBack = yesClose;
         _confrimUI.noBack = noClose;
         MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["show_confrim"])));
         MainGame.I.root.addChild(_confrimUI);
      }
      
      public static function alert(param1:String = null, param2:String = null, param3:Function = null) : void
      {
         var enMsg:String = param1;
         var cnMsg:String = param2;
         var close:Function = param3;
         var closeBack:* = function():void
         {
            if(close != null)
            {
               close();
            }
            closeAlert();
            MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["close_alert"])));
         };
         closeAlert();
         _alertUI = new AlertUI();
         _alertUI.setMsg(enMsg,cnMsg);
         _alertUI.closeBack = closeBack;
         MainGame.I.root.addChild(_alertUI);
         MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["show_alert"])));
      }
      
      public static function closeAlert() : void
      {
         if(_alertUI)
         {
            try
            {
               MainGame.I.root.removeChild(_alertUI);
            }
            catch(e:Error)
            {
            }
            _alertUI.destory();
            _alertUI = null;
         }
      }
      
      public static function closeConfrim() : void
      {
         if(_confrimUI)
         {
            try
            {
               MainGame.I.root.removeChild(_confrimUI);
            }
            catch(e:Error)
            {
            }
            _confrimUI.destory();
            _confrimUI = null;
         }
      }
      
      public function getUI() : IGameUI
      {
         return _ui;
      }
      
      public function getUIDisplay() : DisplayObject
      {
         return _ui.getUI();
      }
      
      public function initFight(param1:GameRunFighterGroup, param2:GameRunFighterGroup) : void
      {
         var _loc3_:Number = GameData.I.config.soundVolume;
         if(_ui)
         {
            if(_ui is FightUI == false)
            {
               _ui.destory();
               _ui = new FightUI();
               _ui.setVolume(_loc3_);
            }
         }
         else
         {
            _ui = new FightUI();
            _ui.setVolume(_loc3_);
         }
         (_ui as FightUI).initlize(param1,param2);
      }
      
      public function render() : void
      {
         if(!_ui)
         {
            return;
         }
         _ui.render();
         if(isRenderAnimate())
         {
            renderAnimate();
         }
      }
      
      private function renderAnimate() : void
      {
         if(_ui)
         {
            _ui.renderAnimate();
         }
      }
      
      private function isRenderAnimate() : Boolean
      {
         if(_renderAnimateGap > 0)
         {
            if(_renderAnimateFrame++ >= _renderAnimateGap)
            {
               _renderAnimateFrame = 0;
               return true;
            }
            return false;
         }
         return true;
      }
      
      public function fadIn() : void
      {
         var _loc1_:Number = NaN;
         if(_ui)
         {
            _loc1_ = GameData.I.config.soundVolume;
            _ui.fadIn();
            _ui.setVolume(_loc1_);
         }
      }
      
      public function fadOut() : void
      {
         if(_ui)
         {
            _ui.fadIn();
         }
      }
      
      public function destory() : void
      {
         if(_ui)
         {
            _ui.destory();
         }
      }
   }
}

