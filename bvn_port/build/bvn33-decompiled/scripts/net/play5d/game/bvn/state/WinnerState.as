package net.play5d.game.bvn.state
{
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.events.DataEvent;
   import flash.events.Event;
   import flash.events.KeyboardEvent;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.AssetManager;
   import net.play5d.game.bvn.ctrl.GameRender;
   import net.play5d.game.bvn.ctrl.SoundCtrl;
   import net.play5d.game.bvn.ctrl.StateCtrl;
   import net.play5d.game.bvn.data.FighterModel;
   import net.play5d.game.bvn.data.FighterVO;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.game.bvn.data.MessionModel;
   import net.play5d.game.bvn.input.GameInputer;
   import net.play5d.game.bvn.interfaces.GameInterface;
   import net.play5d.game.bvn.ui.GameUI;
   import net.play5d.game.bvn.utils.ResUtils;
   import net.play5d.kyo.display.bitmap.BitmapFontText;
   import net.play5d.kyo.stage.Istage;
   
   public class WinnerState implements Istage
   {
      
      private var _ui:MovieClip;
      
      private var _scoreText:BitmapFontText;
      
      private var _winnerFaces:Array;
      
      private var _winSay:String;
      
      private var _bgmDelay:int;
      
      public function WinnerState()
      {
         super();
      }
      
      public function get display() : DisplayObject
      {
         return _ui;
      }
      
      private function buildData() : void
      {
         var _loc6_:int = 0;
         var _loc1_:int = 0;
         var _loc5_:int = 0;
         var _loc4_:FighterVO = FighterModel.I.getFighter(GameData.I.winnerId);
         var _loc3_:Vector.<FighterVO> = new Vector.<FighterVO>();
         var _loc2_:Array = GameData.I.p1Select.getSelectFighters();
         while(_loc6_ < _loc2_.length)
         {
            _loc3_.push(FighterModel.I.getFighter(_loc2_[_loc6_]));
            _loc6_++;
         }
         _winSay = _loc4_.getRandSay();
         if(_loc3_.length == 1)
         {
            _winnerFaces = [AssetManager.I.getFighterFaceWin(_loc3_[0])];
         }
         else
         {
            _winnerFaces = [];
            _loc1_ = _loc3_.indexOf(_loc4_);
            _winnerFaces.push(AssetManager.I.getFighterFaceWin(_loc3_[_loc1_]));
            _loc3_.splice(_loc1_,1);
            while(_loc5_ < _loc3_.length)
            {
               _winnerFaces.push(AssetManager.I.getFighterFaceWin(_loc3_[_loc5_]));
               _loc5_++;
            }
         }
      }
      
      private function initText() : void
      {
         var txtCompleteHandler:* = function(param1:Event):void
         {
            txtmc.removeEventListener("complete",txtCompleteHandler);
            var _loc3_:TextField = new TextField();
            _loc3_.x = 33;
            _loc3_.width = 548;
            _loc3_.height = 66;
            _loc3_.multiline = true;
            _loc3_.wordWrap = true;
            _loc3_.mouseEnabled = false;
            var _loc2_:TextFormat = new TextFormat();
            _loc2_.font = "SimHei";
            _loc2_.color = 0;
            _loc2_.size = 18;
            _loc2_.align = "center";
            _loc2_.leading = 5;
            _loc3_.defaultTextFormat = _loc2_;
            setText(_loc3_,_winSay);
            txtmc.addChild(_loc3_);
         };
         var txtmc:MovieClip = _ui.getChildByName("txtmc") as MovieClip;
         if(txtmc)
         {
            txtmc.addEventListener("complete",txtCompleteHandler);
         }
      }
      
      private function testFighterSays(param1:TextField) : void
      {
         var k:String;
         var i:FighterVO;
         var j:String;
         var txt:TextField = param1;
         var keyHandler:* = function(param1:KeyboardEvent):void
         {
            switch(int(param1.keyCode) - 37)
            {
               case 0:
                  sayIndex = sayIndex - 1;
                  if(sayIndex < 0)
                  {
                     sayIndex = 0;
                  }
                  break;
               case 2:
                  sayIndex = sayIndex + 1;
                  if(sayIndex > says.length - 1)
                  {
                     sayIndex = says.length - 1;
                  }
                  break;
               default:
                  return;
            }
            setText(txt,says[sayIndex].say);
            trace(says[sayIndex].id);
         };
         var winner:FighterVO = FighterModel.I.getFighter(GameData.I.winnerId);
         var sayIndex:int = 0;
         var says:Array = [];
         for each(k in winner.says)
         {
            says.push({
               "id":winner.id,
               "say":k
            });
         }
         for each(i in FighterModel.I.getAllFighters())
         {
            for each(j in i.says)
            {
               says.push({
                  "id":i.id,
                  "say":j
               });
            }
         }
         MainGame.I.stage.addEventListener("keyDown",keyHandler);
      }
      
      private function setText(param1:TextField, param2:String) : void
      {
         param1.text = param2.split("|").join("\n");
         param1.height = param1.textHeight + 5;
         param1.y = 10 + (90 - param1.height) / 2;
      }
      
      public function build() : void
      {
         buildData();
         _scoreText = new BitmapFontText(AssetManager.I.getFont("font1"));
         _scoreText.text = "SCORE " + GameData.I.score;
         _scoreText.x = -_scoreText.width / 2;
         _scoreText.y = -_scoreText.height / 2;
         _ui = ResUtils.I.createDisplayObject(ResUtils.I.loading,ResUtils.WINNER);
         _ui.addEventListener("complete",onUIPlayComplete);
         _ui.scoremc.addChild(_scoreText);
         if(_winnerFaces[0])
         {
            _ui.f0.addChildAt(_winnerFaces[0],0);
         }
         else
         {
            _ui.f0.visible = false;
         }
         if(_winnerFaces[1])
         {
            _ui.f1.addChildAt(_winnerFaces[1],0);
         }
         else
         {
            _ui.f1.visible = false;
         }
         if(_winnerFaces[2])
         {
            _ui.f2.addChildAt(_winnerFaces[2],0);
         }
         else
         {
            _ui.f2.visible = false;
         }
         SoundCtrl.I.BGM(null);
         SoundCtrl.I.playAssetSound("win");
         GameInputer.enabled = false;
         initText();
         _bgmDelay = setTimeout(function():void
         {
            SoundCtrl.I.BGM(AssetManager.I.getSound("winloop"));
         },6500);
      }
      
      private function onUIPlayComplete(param1:Event) : void
      {
         _ui.removeEventListener("complete",onUIPlayComplete);
         MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["winner_show"])));
         var _loc2_:MovieClip = _ui.getChildByName("btns") as MovieClip;
         _loc2_.btn_more.addEventListener("click",btnHandler);
         _loc2_.btn_cont.addEventListener("click",btnHandler);
         _loc2_.btn_exit.addEventListener("click",btnHandler);
         _loc2_.btn_more.addEventListener("mouseOver",btnHandler);
         _loc2_.btn_cont.addEventListener("mouseOver",btnHandler);
         _loc2_.btn_exit.addEventListener("mouseOver",btnHandler);
         GameRender.add(render);
         GameInputer.enabled = true;
      }
      
      private function render() : void
      {
         if(GameInputer.select("MENU"))
         {
            goNext();
         }
      }
      
      private function btnHandler(param1:MouseEvent) : void
      {
         if(param1.type == "mouseOver")
         {
            SoundCtrl.I.sndSelect();
            return;
         }
         var _loc2_:MovieClip = _ui.getChildByName("btns") as MovieClip;
         switch(param1.currentTarget)
         {
            case _loc2_.btn_more:
               GameInterface.instance.moreGames();
               break;
            case _loc2_.btn_cont:
               goNext();
               break;
            case _loc2_.btn_exit:
               GameUI.confrim("BACK TITLE?","返回到主菜单？",MainGame.I.goMenu);
         }
         SoundCtrl.I.sndConfrim();
      }
      
      private function goNext() : void
      {
         GameInputer.enabled = false;
         StateCtrl.I.transIn(function():void
         {
            MessionModel.I.messionComplete();
            MainGame.I.loadGame();
         });
      }
      
      public function afterBuild() : void
      {
      }
      
      public function destory(param1:Function = null) : void
      {
         GameRender.remove(render);
         GameInputer.enabled = false;
         clearTimeout(_bgmDelay);
         MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["winner_end"])));
         if(_ui)
         {
            _ui.gotoAndStop("destory");
            _ui = null;
         }
      }
   }
}

