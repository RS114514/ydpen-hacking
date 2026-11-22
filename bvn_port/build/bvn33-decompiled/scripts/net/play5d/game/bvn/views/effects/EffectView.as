package net.play5d.game.bvn.views.effects
{
   import flash.display.Bitmap;
   import flash.geom.Point;
   import net.play5d.game.bvn.ctrl.EffectCtrl;
   import net.play5d.game.bvn.ctrl.SoundCtrl;
   import net.play5d.game.bvn.data.BitmapDataCacheVO;
   import net.play5d.game.bvn.data.EffectVO;
   import net.play5d.game.bvn.interfaces.IGameSprite;
   import net.play5d.kyo.utils.KyoMath;
   
   public class EffectView
   {
      
      public var display:Bitmap;
      
      public var autoRemove:Boolean = true;
      
      public var loopPlay:Boolean = false;
      
      public var holdFrame:int = -1;
      
      public var isActive:Boolean = true;
      
      protected var _target:IGameSprite;
      
      private var _onRemoveFuncs:Array;
      
      private var _isDestoryed:Boolean;
      
      protected var _data:EffectVO;
      
      private var _bitmapDatas:Vector.<BitmapDataCacheVO>;
      
      private var _frameLabels:Object;
      
      private var _orgX:Number = 0;
      
      private var _orgY:Number = 0;
      
      private var _curFrame:int;
      
      private var _rotation:int;
      
      private var _direct:int;
      
      public function EffectView(param1:EffectVO)
      {
         super();
         _data = param1;
         display = new Bitmap();
         display.blendMode = param1.blendMode;
         display.smoothing = EffectCtrl.EFFECT_SMOOTHING;
         _bitmapDatas = param1.bitmapDataCache;
         _frameLabels = param1.frameLabelCache;
      }
      
      public function setTarget(param1:IGameSprite) : void
      {
         _target = param1;
      }
      
      public function setPos(param1:Number, param2:Number) : void
      {
         _orgX = param1;
         _orgY = param2;
      }
      
      public function start(param1:Number = 0, param2:Number = 0, param3:int = 1) : void
      {
         _orgX = param1;
         _orgY = param2;
         _direct = _rotation != 0 ? 1 : param3;
         display.scaleX = _direct;
         _curFrame = 0;
         if(_data.randRotate)
         {
            randRotate();
         }
         if(_data.sound)
         {
            SoundCtrl.I.playEffectSound(_data.sound);
         }
         renderDisplay();
         isActive = true;
      }
      
      public function destory() : void
      {
         _isDestoryed = true;
         if(isActive)
         {
            removeSelf();
         }
         display = null;
      }
      
      public function gotoAndPlay(param1:Object) : void
      {
         if(param1 is int)
         {
            _curFrame = int(param1);
         }
         if(param1 is String)
         {
            for(var _loc2_:String in _frameLabels)
            {
               if(_frameLabels[_loc2_] == param1)
               {
                  _curFrame = int(_loc2_);
               }
            }
         }
      }
      
      private function randRotate() : void
      {
         _rotation = Math.random() * 360;
         display.rotation = _rotation;
         display.scaleX = 1;
      }
      
      public function render() : void
      {
      }
      
      public function renderAnimate() : void
      {
         if(_isDestoryed)
         {
            return;
         }
         var _loc1_:Boolean = false;
         if(loopPlay)
         {
            if(_curFrame == _bitmapDatas.length - 1)
            {
               _curFrame = 0;
            }
         }
         else if(autoRemove)
         {
            if(_curFrame == _bitmapDatas.length - 1)
            {
               if(holdFrame == -1)
               {
                  removeSelf();
                  _loc1_ = true;
               }
               else
               {
                  _curFrame = 0;
               }
            }
            if(holdFrame != -1)
            {
               if(holdFrame-- <= 0)
               {
                  removeSelf();
                  _loc1_ = true;
               }
            }
         }
         if(!_loc1_)
         {
            renderFrameLabel();
            renderDisplay();
            _curFrame = _curFrame + 1;
         }
      }
      
      private function renderDisplay() : void
      {
         var _loc1_:Number = NaN;
         var _loc2_:Point = null;
         var _loc3_:BitmapDataCacheVO = _bitmapDatas[_curFrame];
         if(_loc3_ == null)
         {
            display.bitmapData = null;
         }
         else
         {
            display.bitmapData = _loc3_.bitmapData;
            if(_rotation != 0)
            {
               _loc1_ = KyoMath.asRadians(_rotation);
               _loc2_ = KyoMath.getPointByRadians(new Point(_loc3_.offsetX,_loc3_.offsetY),_loc1_);
               display.x = _orgX + _loc2_.x;
               display.y = _orgY + _loc2_.y;
            }
            else
            {
               display.x = _orgX + _loc3_.offsetX * _direct;
               display.y = _orgY + _loc3_.offsetY;
            }
         }
      }
      
      private function renderFrameLabel() : void
      {
         var _loc1_:String = _frameLabels[_curFrame];
         var _loc2_:String = _loc1_;
         if("loop" === _loc2_)
         {
            gotoAndPlay(1);
         }
      }
      
      public function remove() : void
      {
         removeSelf();
      }
      
      public function addRemoveBack(param1:Function) : void
      {
         if(!_onRemoveFuncs)
         {
            _onRemoveFuncs = [];
         }
         if(_onRemoveFuncs.indexOf(param1) != -1)
         {
            return;
         }
         _onRemoveFuncs.push(param1);
      }
      
      private function removeSelf() : void
      {
         isActive = false;
         for each(var _loc1_:Function in _onRemoveFuncs)
         {
            _loc1_(this);
         }
         _onRemoveFuncs = null;
         if(display && display.parent)
         {
            display.parent.removeChild(display);
         }
      }
   }
}

