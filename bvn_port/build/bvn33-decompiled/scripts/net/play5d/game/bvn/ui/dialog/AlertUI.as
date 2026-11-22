package net.play5d.game.bvn.ui.dialog
{
   import com.greensock.TweenLite;
   import flash.display.Sprite;
   import flash.text.TextField;
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.ctrl.AssetManager;
   import net.play5d.game.bvn.events.SetBtnEvent;
   import net.play5d.game.bvn.ui.GameUI;
   import net.play5d.game.bvn.ui.SetBtnGroup;
   import net.play5d.game.bvn.ui.UIUtils;
   import net.play5d.kyo.display.bitmap.BitmapFontText;
   import net.play5d.kyo.display.shapes.Box;
   
   public class AlertUI extends Sprite
   {
      
      private var _enTxt:BitmapFontText;
      
      private var _cnTxt:TextField;
      
      private var _btnGroup:SetBtnGroup;
      
      public var closeBack:Function;
      
      public function AlertUI()
      {
         super();
         build();
      }
      
      public function destory() : void
      {
         if(_enTxt)
         {
            _enTxt.dispose();
            _enTxt = null;
         }
         if(_btnGroup)
         {
            _btnGroup.removeEventListener("SELECT",selectHandler);
            _btnGroup.destory();
            _btnGroup = null;
         }
      }
      
      private function build() : void
      {
         var _loc1_:Sprite = new Sprite();
         _loc1_.graphics.beginFill(0,0.3);
         _loc1_.graphics.drawRect(0,0,GameConfig.GAME_SIZE.x,GameConfig.GAME_SIZE.y);
         _loc1_.graphics.endFill();
         addChild(_loc1_);
         var _loc2_:Box = new Box(GameConfig.GAME_SIZE.x,400,0,0.8);
         _loc2_.y = (GameConfig.GAME_SIZE.y - _loc2_.height) / 2;
         addChild(_loc2_);
         _enTxt = new BitmapFontText(AssetManager.I.getFont("font1"));
         _enTxt.y = 18;
         _loc2_.addChild(_enTxt);
         if(GameUI.SHOW_CN_TEXT)
         {
            _cnTxt = new TextField();
            UIUtils.formatText(_cnTxt,{
               "align":"center",
               "color":16777215,
               "size":20,
               "leading":10
            });
            _cnTxt.y = _enTxt.y + _enTxt.height + 80;
            _cnTxt.width = GameConfig.GAME_SIZE.x;
            _cnTxt.height = 300;
            _cnTxt.mouseEnabled = false;
            _loc2_.addChild(_cnTxt);
         }
         _btnGroup = new SetBtnGroup();
         _btnGroup.startX = _btnGroup.startY = 0;
         _btnGroup.direct = 0;
         _btnGroup.gap = 200;
         _btnGroup.setBtnData([{
            "label":"OK",
            "cn":"知道了"
         }],1);
         _btnGroup.addEventListener("SELECT",selectHandler);
         _btnGroup.x = (GameConfig.GAME_SIZE.x - _btnGroup.width) / 2 + 30;
         _btnGroup.y = _loc2_.height - 80;
         _loc2_.addChild(_btnGroup);
         var _loc3_:Number = _loc2_.y;
         _loc2_.y = GameConfig.GAME_SIZE.y;
         TweenLite.to(_loc2_,0.2,{"y":_loc3_});
      }
      
      private function selectHandler(param1:SetBtnEvent) : void
      {
         var _loc2_:String = param1.selectedLabel;
         if("OK" === _loc2_)
         {
            if(closeBack != null)
            {
               closeBack();
            }
         }
      }
      
      public function setMsg(param1:String = null, param2:String = null) : void
      {
         _enTxt.text = param1 ? param1 : "";
         _enTxt.x = (GameConfig.GAME_SIZE.x - _enTxt.width) / 2;
         _cnTxt.text = param2 ? param2 : "";
      }
   }
}

