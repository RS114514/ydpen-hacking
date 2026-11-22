package
{
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.KeyboardEvent;
   import net.play5d.game.bvn.Debugger;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.game.bvn.interfaces.GameInterface;
   import net.play5d.game.bvn.ui.GameUI;
   import net.play5d.game.bvn.utils.GameLoger;
   import net.play5d.game.bvn.utils.URL;
   import net.play5d.game.bvn.win.GameInterfaceManager;
   import net.play5d.game.bvn.win.utils.Loger;
   import net.play5d.game.bvn.win.utils.UIAssetUtil;
   
   [SWF(width="800", height="600", backgroundColor="#000000", frameRate="30")]
   public class launch extends Sprite
   {
      
      private var _mainGame:MainGame;
      
      public function launch()
      {
         super();
         if(stage)
         {
            initlize();
         }
         else
         {
            addEventListener("addedToStage",initlize);
         }
      }
      
      private function initlize(param1:Event = null) : void
      {
         GameLoger.setLoger(new Loger());
         GameLoger.log("init...");
         removeEventListener("addedToStage",initlize);
         GameInterface.instance = new GameInterfaceManager();
         GameUI.BITMAP_UI = true;
         GameData.I.config.AI_level = 1;
         GameData.I.config.quality = "medium";
         GameData.I.config.keyInputMode = 0;
         URL.MARK = "bvn_winV3.3";
         buildGame();
         stage.addEventListener("keyDown",keyDownHandler);
      }
      
      private function buildGame() : void
      {
         GameLoger.log("buildGame");
         _mainGame = new MainGame();
         _mainGame.initlize(this,stage,initBackHandler,initFailHandler);
      }
      
      private function initBackHandler() : void
      {
         GameLoger.log("init ok");
         UIAssetUtil.I.initalize(_mainGame.goLogo);
      }
      
      private function initFailHandler(param1:String) : void
      {
         GameLoger.log("init fail");
      }
      
      private function keyDownHandler(param1:KeyboardEvent) : void
      {
         if(param1.keyCode == 27)
         {
            param1.preventDefault();
         }
         if(param1.keyCode == 122)
         {
            if(stage.displayState == "normal")
            {
               stage.displayState = "fullScreenInteractive";
            }
            else
            {
               stage.displayState = "normal";
            }
         }
      }
   }
}

