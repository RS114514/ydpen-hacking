package net.play5d.game.bvn.data
{
   import flash.display.BitmapData;
   import flash.display.MovieClip;
   import flash.geom.Matrix;
   import flash.geom.Rectangle;
   import net.play5d.game.bvn.ctrl.AssetManager;
   import net.play5d.kyo.utils.KyoUtils;
   
   public class EffectVO
   {
      
      public var className:String;
      
      public var shine:Object;
      
      public var shake:Object;
      
      public var freeze:int;
      
      public var sound:String;
      
      public var randRotate:Boolean;
      
      public var followDirect:Boolean;
      
      public var slowDown:Object;
      
      public var blendMode:String = "normal";
      
      public var bitmapDataCache:Vector.<BitmapDataCacheVO>;
      
      public var frameLabelCache:Object;
      
      public var specialEffectId:String;
      
      public var targetColorOffset:Array;
      
      public var isSpecial:Boolean = false;
      
      public var isBuff:Boolean = false;
      
      public var isSteelHit:Boolean = false;
      
      public function EffectVO(param1:String, param2:Object = null)
      {
         super();
         this.className = param1;
         if(param2)
         {
            KyoUtils.setValueByObject(this,param2);
         }
      }
      
      public function clone() : EffectVO
      {
         var _loc2_:Object = KyoUtils.itemToObject(this);
         delete _loc2_["className"];
         return new EffectVO(className,_loc2_);
      }
      
      public function cacheBitmapData() : void
      {
         var _loc1_:Rectangle = null;
         var _loc2_:BitmapDataCacheVO = null;
         var _loc6_:String = null;
         var _loc7_:BitmapData = null;
         var _loc5_:Number = NaN;
         var _loc4_:Number = NaN;
         bitmapDataCache = new Vector.<BitmapDataCacheVO>();
         frameLabelCache = {};
         var _loc3_:MovieClip = AssetManager.I.getEffect(className);
         _loc3_.gotoAndStop(1);
         while(_loc3_.currentFrame < _loc3_.totalFrames)
         {
            _loc6_ = _loc3_.currentFrameLabel;
            if(_loc6_)
            {
               frameLabelCache[_loc3_.currentFrame] = _loc6_;
            }
            if(_loc3_.width < 1 || _loc3_.height < 1)
            {
               bitmapDataCache.push(null);
               _loc3_.nextFrame();
            }
            else
            {
               _loc7_ = new BitmapData(_loc3_.width,_loc3_.height,true,0);
               _loc1_ = _loc3_.getBounds(_loc3_);
               _loc7_.draw(_loc3_,new Matrix(1,0,0,1,-_loc1_.x,-_loc1_.y));
               _loc5_ = _loc1_.x;
               _loc4_ = _loc1_.y;
               if(_loc2_ && _loc2_.offsetX == _loc5_ && _loc2_.offsetY == _loc4_ && _loc2_.bitmapData.compare(_loc7_) == 0)
               {
                  bitmapDataCache.push(_loc2_);
                  _loc3_.nextFrame();
               }
               else
               {
                  _loc2_ = new BitmapDataCacheVO();
                  _loc2_.bitmapData = _loc7_;
                  _loc2_.offsetX = _loc5_;
                  _loc2_.offsetY = _loc4_;
                  bitmapDataCache.push(_loc2_);
                  _loc3_.nextFrame();
               }
            }
         }
         _loc3_ = null;
         _loc1_ = null;
         _loc2_ = null;
      }
   }
}

