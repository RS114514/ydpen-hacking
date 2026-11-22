package net.play5d.game.bvn.win.utils
{
   import flash.display.Stage;
   import flash.events.Event;
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.GameRender;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.game.bvn.win.ctrls.LANClientCtrl;
   import net.play5d.game.bvn.win.ctrls.LANServerCtrl;
   
   public class LockFrameLogic
   {
      
      private static var _i:LockFrameLogic;
      
      private var _mode:int;
      
      private var _stage:Stage;
      
      private var _orgFps:int;
      
      private var _orgInputMode:int;
      
      public function LockFrameLogic()
      {
         super();
      }
      
      public static function get I() : LockFrameLogic
      {
         if(!_i)
         {
            _i = new LockFrameLogic();
         }
         return _i;
      }
      
      public function initServer() : void
      {
         _mode = 1;
         init(MainGame.I.stage);
      }
      
      public function initClient() : void
      {
         _mode = 2;
         init(MainGame.I.stage);
      }
      
      private function init(param1:Stage) : void
      {
         _stage = param1;
         param1.addEventListener("enterFrame",render);
         _orgFps = GameConfig.FPS_GAME;
         _orgInputMode = GameData.I.config.keyInputMode;
         GameConfig.setGameFps(30);
         GameData.I.config.keyInputMode = 1;
      }
      
      public function dispose() : void
      {
         if(_stage)
         {
            _stage.removeEventListener("enterFrame",render);
         }
         GameRender.isRender = true;
         GameConfig.setGameFps(_orgFps);
         GameData.I.config.keyInputMode = _orgInputMode;
      }
      
      private function render(param1:Event) : void
      {
         if(_mode == 1)
         {
            GameRender.isRender = LANServerCtrl.I.renderGame();
         }
         if(_mode == 2)
         {
            GameRender.isRender = LANClientCtrl.I.renderGame();
         }
      }
   }
}

