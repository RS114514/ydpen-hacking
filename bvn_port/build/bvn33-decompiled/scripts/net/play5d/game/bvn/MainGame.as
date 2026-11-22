package net.play5d.game.bvn
{
   import flash.display.Sprite;
   import flash.display.Stage;
   import flash.events.DataEvent;
   import flash.geom.Rectangle;
   import net.play5d.game.bvn.ctrl.GameRender;
   import net.play5d.game.bvn.ctrl.game_ctrls.GameCtrl;
   import net.play5d.game.bvn.data.EffectModel;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.game.bvn.input.GameInputer;
   import net.play5d.game.bvn.interfaces.GameInterface;
   import net.play5d.game.bvn.state.CongratulateState;
   import net.play5d.game.bvn.state.CreditsState;
   import net.play5d.game.bvn.state.GameLoadingState;
   import net.play5d.game.bvn.state.GameOverState;
   import net.play5d.game.bvn.state.GameState;
   import net.play5d.game.bvn.state.HowToPlayState;
   import net.play5d.game.bvn.state.LoadingState;
   import net.play5d.game.bvn.state.LogoState;
   import net.play5d.game.bvn.state.MenuState;
   import net.play5d.game.bvn.state.SelectFighterStage;
   import net.play5d.game.bvn.state.SettingState;
   import net.play5d.game.bvn.state.WinnerState;
   import net.play5d.game.bvn.utils.GameLoger;
   import net.play5d.game.bvn.utils.ResUtils;
   import net.play5d.kyo.stage.KyoStageCtrl;
   
   public class MainGame
   {
      
      public static const VERSION:String = "V3.3";
      
      public static const VERSION_DATE:String = "2019.3.32";
      
      public static var UPDATE_INFO:String;
      
      public static var stageCtrl:KyoStageCtrl;
      
      public static var I:MainGame;
      
      private var _rootSprite:Sprite;
      
      private var _stage:Stage;
      
      private var _fps:Number = 60;
      
      public function MainGame()
      {
         super();
         I = this;
      }
      
      public function get root() : Sprite
      {
         return _rootSprite;
      }
      
      public function get stage() : Stage
      {
         return _stage;
      }
      
      public function initlize(param1:Sprite, param2:Stage, param3:Function = null, param4:Function = null) : void
      {
         var root:Sprite = param1;
         var stage:Stage = param2;
         var initBack:Function = param3;
         var initFail:Function = param4;
         var resInitBack:* = function():void
         {
            GameLoger.log("res init ok");
            _rootSprite = root;
            _stage = stage;
            GameLoger.log("init game render");
            GameRender.initlize(stage);
            GameLoger.log("init game inputer");
            GameInputer.initlize(_stage);
            GameLoger.log("init game data");
            GameData.I.loadData();
            GameLoger.log("init config");
            GameData.I.config.applyConfig();
            GameLoger.log("init inputer config");
            GameInputer.updateConfig();
            GameLoger.log("init scroll");
            root.scrollRect = new Rectangle(0,0,GameConfig.GAME_SIZE.x,GameConfig.GAME_SIZE.y);
            GameLoger.log("init stagectrl");
            stageCtrl = new KyoStageCtrl(_rootSprite);
            GameLoger.log("init loading");
            var _loc1_:GameLoadingState = new GameLoadingState();
            stageCtrl.goStage(_loc1_);
            _loc1_.loadGame(loadGameBack,initFail);
         };
         var loadGameBack:* = function():void
         {
            EffectModel.I.initlize();
            if(initBack != null)
            {
               initBack();
            }
         };
         ResUtils.I.initalize(resInitBack,initFail);
      }
      
      private function resetDefault() : void
      {
         GameCtrl.I.autoEndRoundAble = true;
         GameCtrl.I.autoStartAble = true;
         SelectFighterStage.AUTO_FINISH = true;
         LoadingState.AUTO_START_GAME = true;
      }
      
      public function getFPS() : Number
      {
         return _fps;
      }
      
      public function setFPS(param1:Number) : void
      {
         _fps = param1;
         _stage.frameRate = param1;
      }
      
      public function goLogo() : void
      {
         stageCtrl.goStage(new LogoState());
         setFPS(30);
      }
      
      public function goMenu() : void
      {
         MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["go_menu_stage"])));
         resetDefault();
         stageCtrl.goStage(new MenuState());
         setFPS(30);
      }
      
      public function goHowToPlay() : void
      {
         stageCtrl.goStage(new HowToPlayState());
         setFPS(30);
      }
      
      public function goSelect() : void
      {
         stageCtrl.goStage(new SelectFighterStage());
         setFPS(30);
      }
      
      public function loadGame() : void
      {
         var _loc1_:LoadingState = new LoadingState();
         stageCtrl.goStage(_loc1_,true);
         setFPS(30);
      }
      
      public function goGame() : void
      {
         var _loc1_:GameState = new GameState();
         stageCtrl.goStage(_loc1_);
         GameCtrl.I.startGame();
         setFPS(GameConfig.FPS_GAME);
      }
      
      public function goOption() : void
      {
         stageCtrl.goStage(new SettingState());
         setFPS(30);
      }
      
      public function goContinue() : void
      {
         var _loc1_:GameOverState = new GameOverState();
         _loc1_.showContinue();
         stageCtrl.goStage(_loc1_);
         setFPS(30);
      }
      
      public function goGameOver() : void
      {
         var _loc1_:GameOverState = new GameOverState();
         _loc1_.showGameOver();
         stageCtrl.goStage(_loc1_);
         setFPS(30);
      }
      
      public function goWinner() : void
      {
         var _loc1_:WinnerState = new WinnerState();
         stageCtrl.goStage(_loc1_);
         setFPS(30);
      }
      
      public function goCredits() : void
      {
         stageCtrl.goStage(new CreditsState());
         setFPS(30);
      }
      
      public function moreGames() : void
      {
         GameInterface.instance.moreGames();
      }
      
      public function goCongratulations() : void
      {
         stageCtrl.goStage(new CongratulateState());
         setFPS(30);
      }
      
      public function submitScore() : void
      {
         GameInterface.instance.submitScore(GameData.I.score);
      }
      
      public function showRank() : void
      {
         GameInterface.instance.showRank();
      }
   }
}

