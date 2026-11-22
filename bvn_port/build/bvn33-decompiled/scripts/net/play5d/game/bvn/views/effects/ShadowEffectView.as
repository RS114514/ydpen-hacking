package net.play5d.game.bvn.views.effects
{
   import flash.display.Bitmap;
   import flash.display.DisplayObject;
   import flash.display.Sprite;
   import flash.geom.ColorTransform;
   import flash.geom.Rectangle;
   import net.play5d.kyo.utils.KyoUtils;
   
   public class ShadowEffectView
   {
      
      public var target:DisplayObject;
      
      public var r:int = 0;
      
      public var g:int = 0;
      
      public var b:int = 0;
      
      public var container:Sprite;
      
      private var _bps:Vector.<Bitmap> = new Vector.<Bitmap>();
      
      private var _alphaLose:Number = 0.1;
      
      private var _alphaStart:Number = 0.8;
      
      private var _addBpGap:int = 1;
      
      private var _addBpFrame:int = 0;
      
      public var stopShadow:Boolean;
      
      public var onRemove:Function;
      
      public function ShadowEffectView(param1:DisplayObject, param2:int = 0, param3:int = 0, param4:int = 0)
      {
         super();
         this.target = param1;
         this.r = param2;
         this.g = param3;
         this.b = param4;
         _addBpFrame = 0;
      }
      
      public function destory() : void
      {
         var _loc2_:int = 0;
         var _loc1_:Bitmap = null;
         target = null;
         while(_loc2_ < _bps.length)
         {
            _loc1_ = _bps[_loc2_];
            _loc1_.bitmapData.dispose();
            try
            {
               container.removeChild(_loc1_);
            }
            catch(error:Error)
            {
            }
            _loc2_++;
         }
         _bps = null;
      }
      
      public function render() : void
      {
         var _loc2_:int = 0;
         var _loc1_:Bitmap = null;
         if(stopShadow)
         {
            if(_bps.length <= 0)
            {
               removeSelf();
            }
         }
         else if(_addBpFrame++ > _addBpGap)
         {
            addShadowBp();
            _addBpFrame = 0;
         }
         while(_loc2_ < _bps.length)
         {
            _loc1_ = _bps[_loc2_];
            _loc1_.alpha -= _alphaLose;
            if(_loc1_.alpha <= 0)
            {
               removeBitmap(_loc1_);
            }
            _loc2_++;
         }
      }
      
      private function addShadowBp() : void
      {
         var _loc3_:ColorTransform = null;
         if(r != 0 || g != 0 || b != 0)
         {
            _loc3_ = new ColorTransform();
            _loc3_.redOffset = r;
            _loc3_.greenOffset = g;
            _loc3_.blueOffset = b;
         }
         var _loc2_:Rectangle = target.getBounds(target);
         var _loc1_:Bitmap = KyoUtils.drawDisplay(target,true,true,0,_loc3_);
         if(_loc1_ == null)
         {
            return;
         }
         _loc1_.alpha = _alphaStart;
         _loc1_.x = target.x + _loc2_.x * target.scaleX;
         _loc1_.y = target.y + _loc2_.y;
         _loc1_.scaleX = target.scaleX;
         _loc1_.scaleY = target.scaleY;
         container.addChildAt(_loc1_,0);
         _bps.push(_loc1_);
      }
      
      private function removeBitmap(param1:Bitmap) : void
      {
         var _loc2_:int = _bps.indexOf(param1);
         if(_loc2_ != -1)
         {
            _bps.splice(_loc2_,1);
         }
         try
         {
            container.removeChild(param1);
         }
         catch(e:Error)
         {
         }
         param1.bitmapData.dispose();
      }
      
      private function removeSelf() : void
      {
         if(onRemove != null)
         {
            onRemove(this);
         }
      }
   }
}

