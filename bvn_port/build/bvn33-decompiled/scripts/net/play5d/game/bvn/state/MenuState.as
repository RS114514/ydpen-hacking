package net.play5d.game.bvn.state
{
   import flash.display.DisplayObject;
   import flash.display.Sprite;
   import flash.text.TextField;
   import flash.utils.setTimeout;
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.AssetManager;
   import net.play5d.game.bvn.ctrl.GameRender;
   import net.play5d.game.bvn.ctrl.SoundCtrl;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.game.bvn.input.GameInputer;
   import net.play5d.game.bvn.interfaces.GameInterface;
   import net.play5d.game.bvn.ui.GameUI;
   import net.play5d.game.bvn.ui.MenuBtnGroup;
   import net.play5d.game.bvn.ui.UIUtils;
   import net.play5d.game.bvn.utils.ResUtils;
   import net.play5d.kyo.stage.Istage;
   
   public class MenuState extends Sprite implements Istage
   {
      
      private var _ui:stg_title;
      
      private var _btnGroup:MenuBtnGroup;
      
      private var _versionTxt:TextField;
      
      public function MenuState()
      {
         super();
      }
      
      public function get display() : DisplayObject
      {
         return _ui;
      }
      
      public function build() : void
      {
         _ui = ResUtils.I.createDisplayObject(ResUtils.I.title,ResUtils.TITLE);
         _ui.gotoAndStop(1);
         GameInterface.instance.initTitleUI(_ui);
         GameInputer.enabled = false;
         SoundCtrl.I.BGM(AssetManager.I.getSound("op"));
      }
      
      public function afterBuild() : void
      {
         _ui.gotoAndPlay(2);
         setTimeout(function():void
         {
            _ui.buttonMode = true;
            _ui.useHandCursor = true;
            if(GameConfig.TOUCH_MODE)
            {
               _ui.addEventListener("touchTap",showBtns);
            }
            else
            {
               _ui.addEventListener("click",showBtns);
            }
            GameRender.add(render);
            GameInputer.focus();
            GameInputer.enabled = true;
         },500);
         _versionTxt = new TextField();
         UIUtils.formatText(_versionTxt,{
            "color":0,
            "size":18
         });
         _versionTxt.text = "V3.3";
         _versionTxt.autoSize = "left";
         _versionTxt.x = GameConfig.GAME_SIZE.x - _versionTxt.width - 15;
         _versionTxt.y = GameConfig.GAME_SIZE.y - _versionTxt.height - 10;
         _ui.addChild(_versionTxt);
         if(GameData.I.isFristRun && MainGame.UPDATE_INFO)
         {
            GameData.I.isFristRun = false;
            GameUI.alert("UPDATE",MainGame.UPDATE_INFO);
         }
      }
      
      private function render() : void
      {
         if(GameInputer.anyKey(1))
         {
            showBtns();
         }
      }
      
      private function showBtns(... rest) : void
      {
         var ct:Sprite;
         var params:Array = rest;
         _ui.removeEventListener("click",showBtns);
         _ui.removeEventListener("touchTap",showBtns);
         GameRender.remove(render);
         _ui.buttonMode = false;
         _ui.useHandCursor = false;
         _ui.gotoAndPlay("menu");
         SoundCtrl.I.playSwcSound(snd_menu5);
         _btnGroup = new MenuBtnGroup();
         _btnGroup.enabled = false;
         _btnGroup.x = 470;
         _btnGroup.y = 100;
         ct = _ui.getChildByName("btnct") as Sprite;
         if(ct)
         {
            ct.addChild(_btnGroup);
         }
         else
         {
            _ui.addChild(_btnGroup);
         }
         _btnGroup.build();
         _btnGroup.fadIn(0.2,0.04);
         setTimeout(function():void
         {
            _btnGroup.enabled = true;
         },400);
      }
      
      public function destory(param1:Function = null) : void
      {
         if(_btnGroup)
         {
            try
            {
               _btnGroup.parent.removeChild(_btnGroup);
            }
            catch(e:Error)
            {
            }
            _btnGroup.destory();
            _btnGroup = null;
         }
         GameInputer.enabled = false;
      }
   }
}

