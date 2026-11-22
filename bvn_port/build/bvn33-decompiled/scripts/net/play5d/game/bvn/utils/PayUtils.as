package net.play5d.game.bvn.utils
{
   import flash.display.Bitmap;
   import flash.display.DisplayObject;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.geom.Rectangle;
   import net.play5d.game.bvn.GameConfig;
   
   public class PayUtils
   {
      
      private static var _orgRect:Rectangle;
      
      public function PayUtils()
      {
         super();
      }
      
      public static function getPaySp(param1:Bitmap) : Sprite
      {
         var _loc2_:Sprite = new Sprite();
         _loc2_.buttonMode = true;
         _loc2_.addChild(param1);
         _loc2_.addEventListener("mouseUp",payMouseHandler,false,0,true);
         return _loc2_;
      }
      
      private static function payMouseHandler(param1:MouseEvent) : void
      {
         param1.stopImmediatePropagation();
         param1.stopPropagation();
         var _loc3_:Sprite = param1.currentTarget as Sprite;
         if(!_loc3_)
         {
            return;
         }
         var _loc2_:DisplayObject = _loc3_.getChildAt(0);
         if(_orgRect && _loc3_.width != _orgRect.width)
         {
            _loc3_.graphics.clear();
            if(_loc2_)
            {
               _loc2_.scaleX = _loc2_.scaleY = 1;
               _loc2_.x = 0;
               _loc2_.y = 0;
            }
            _loc3_.x = _orgRect.x;
            _loc3_.y = _orgRect.y;
            _loc3_.width = _orgRect.width;
            _loc3_.height = _orgRect.height;
            _orgRect = null;
            return;
         }
         _orgRect = new Rectangle(_loc3_.x,_loc3_.y,_loc3_.width,_loc3_.height);
         _loc3_.graphics.beginFill(0,0.7);
         _loc3_.graphics.drawRect(0,0,GameConfig.GAME_SIZE.x,GameConfig.GAME_SIZE.y + 20);
         _loc3_.graphics.endFill();
         _loc3_.parent.addChild(_loc3_);
         _loc3_.x = 0;
         _loc3_.y = 0;
         _loc3_.width = GameConfig.GAME_SIZE.x;
         _loc3_.height = GameConfig.GAME_SIZE.y;
         if(_loc2_)
         {
            _loc2_.scaleX = _loc2_.scaleY = 0.8;
            _loc2_.x = (GameConfig.GAME_SIZE.x - _loc2_.width) / 2;
            _loc2_.y = (GameConfig.GAME_SIZE.y - _loc2_.height) / 2;
         }
      }
   }
}

