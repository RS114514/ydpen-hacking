package net.play5d.game.bvn.fighter
{
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import net.play5d.game.bvn.ctrl.GameLogic;
   import net.play5d.game.bvn.fighter.ctrler.FighterAttackerCtrler;
   import net.play5d.game.bvn.fighter.models.FighterHitModel;
   import net.play5d.game.bvn.fighter.models.HitVO;
   import net.play5d.game.bvn.fighter.utils.McAreaCacher;
   import net.play5d.game.bvn.interfaces.BaseGameSprite;
   import net.play5d.game.bvn.interfaces.IGameSprite;
   
   public class FighterAttacker extends BaseGameSprite
   {
      
      public var onRemove:Function;
      
      public var isAttacking:Boolean;
      
      private var _ctrler:FighterAttackerCtrler;
      
      private var _owner:IGameSprite;
      
      public var moveToTargetX:Boolean;
      
      public var moveToTargetY:Boolean;
      
      public var followTargetX:Boolean;
      
      public var followTargetY:Boolean;
      
      public var rangeX:Point;
      
      public var rangeY:Point;
      
      private var _startX:Number = 0;
      
      private var _startY:Number = 0;
      
      private var _hitAreaCache:McAreaCacher = new McAreaCacher("hit");
      
      private var _hitCheckAreaCache:McAreaCacher = new McAreaCacher("hit_check");
      
      private var _rectCache:Object = {};
      
      private var _mcOrgPoint:Point;
      
      private var _isRenderMainAnimate:Boolean = true;
      
      public function FighterAttacker(param1:MovieClip, param2:Object = null)
      {
         super(param1);
         _mcOrgPoint = new Point(param1.x,param1.y);
         _startX = _mcOrgPoint.x;
         _startY = _mcOrgPoint.y;
         _x = _startX;
         _y = _startY;
         _ctrler = new FighterAttackerCtrler(this);
         if(param1.setAttackerCtrler)
         {
            param1.setAttackerCtrler(_ctrler);
         }
         if(param2)
         {
            if(param2.x != undefined)
            {
               if(param2.x is Number)
               {
                  _startX = param2.x + _mcOrgPoint.x;
               }
               else
               {
                  moveToTargetX = param2.x.moveToTarget == true;
                  followTargetX = param2.x.followTarget == true;
                  if(param2.x.offset != undefined)
                  {
                     _startX = param2.x.offset;
                  }
                  if(param2.x.range != undefined && param2.x.range is Array)
                  {
                     rangeX = new Point(param2.x.range[0],param2.x.range[1]);
                  }
               }
            }
            if(param2.y != undefined)
            {
               if(param2.y is Number)
               {
                  _startY = param2.y + _mcOrgPoint.y;
               }
               else
               {
                  moveToTargetY = param2.y.moveToTarget == true;
                  followTargetY = param2.y.followTarget == true;
                  if(param2.y.offset != undefined)
                  {
                     _startY = param2.y.offset;
                  }
                  if(param2.y.range != undefined && param2.y.range is Array)
                  {
                     rangeY = new Point(param2.y.range[0],param2.y.range[1]);
                  }
               }
            }
            if(param2.applyG != undefined)
            {
               isApplyG = param2.applyG == true;
            }
         }
      }
      
      public function getOwner() : IGameSprite
      {
         return _owner;
      }
      
      public function get name() : String
      {
         return _mainMc.name;
      }
      
      public function getCtrler() : FighterAttackerCtrler
      {
         return _ctrler;
      }
      
      override public function destory(param1:Boolean = true) : void
      {
         if(_hitAreaCache)
         {
            _hitAreaCache.destory();
            _hitAreaCache = null;
         }
         if(_hitCheckAreaCache)
         {
            _hitCheckAreaCache.destory();
            _hitCheckAreaCache = null;
         }
         if(_ctrler)
         {
            _ctrler.destory();
            _ctrler = null;
         }
         _rectCache = null;
         _owner = null;
         _mcOrgPoint = null;
         super.destory(true);
      }
      
      public function setOwner(param1:IGameSprite) : void
      {
         _owner = param1;
         direct = param1.direct;
         if(_owner is FighterMain)
         {
            _ctrler.effect = (_owner as FighterMain).getCtrler().getEffectCtrl();
         }
         if(_owner is Assister)
         {
            _ctrler.effect = (_owner as Assister).getCtrler().effect;
         }
      }
      
      public function init() : void
      {
         var _loc6_:FighterMC = null;
         var _loc2_:Number = NaN;
         var _loc3_:Number = NaN;
         var _loc1_:Number = NaN;
         var _loc4_:Number = NaN;
         if(!_owner)
         {
            return;
         }
         if(direct > 0)
         {
            _x = _owner.x + _startX;
         }
         else
         {
            _x = _owner.x - _startX;
         }
         _y += _owner.y;
         if(_owner is FighterMain)
         {
            _loc6_ = (_owner as FighterMain).getMC();
            _x += _loc6_.x;
            _y += _loc6_.y;
         }
         if(!moveToTargetX && !moveToTargetY)
         {
            return;
         }
         var _loc5_:IGameSprite = getTarget();
         if(_loc5_)
         {
            if(moveToTargetX)
            {
               _loc2_ = _loc5_.x + _startX * direct;
               if(rangeX)
               {
                  if(direct > 0)
                  {
                     _loc3_ = _loc2_ - _owner.x;
                     if(_loc3_ < rangeX.x)
                     {
                        _loc2_ = _owner.x + rangeX.x;
                     }
                     if(_loc3_ > rangeX.y)
                     {
                        _loc2_ = _owner.x + rangeX.y;
                     }
                  }
                  else
                  {
                     _loc3_ = _owner.x - _loc2_;
                     if(_loc3_ < rangeX.x)
                     {
                        _loc2_ = _owner.x - rangeX.x;
                     }
                     if(_loc3_ > rangeX.y)
                     {
                        _loc2_ = _owner.x - rangeX.y;
                     }
                  }
               }
               _x = _loc2_;
            }
            if(moveToTargetY)
            {
               _loc1_ = _loc5_.y + _startY;
               if(rangeY)
               {
                  _loc4_ = _loc1_ - _owner.y;
                  if(_loc4_ < rangeY.x)
                  {
                     _loc1_ = _loc5_.y + rangeY.x;
                  }
                  if(_loc4_ > rangeY.y)
                  {
                     _loc1_ = _loc5_.y + rangeY.y;
                  }
               }
               _y = _loc1_;
            }
         }
         isAttacking = true;
      }
      
      override public function renderAnimate() : void
      {
         if(!_isRenderMainAnimate)
         {
            return;
         }
         super.renderAnimate();
         mc.nextFrame();
         findHitArea();
         if(mc.currentFrame == mc.totalFrames - 1)
         {
            removeSelf();
         }
      }
      
      override public function render() : void
      {
         super.render();
         _ctrler.render();
         renderFollowTarget();
      }
      
      public function stopFollowTarget() : void
      {
         followTargetX = false;
         followTargetY = false;
      }
      
      private function renderFollowTarget() : void
      {
         if(!followTargetX && !followTargetY)
         {
            return;
         }
         var _loc1_:IGameSprite = getTarget();
         if(!_loc1_)
         {
            return;
         }
         if(followTargetX)
         {
            _x = _loc1_.x + _startX * direct;
         }
         if(followTargetY)
         {
            _y = _loc1_.y + _startY;
         }
      }
      
      public function moveToTarget(param1:Number = NaN, param2:Number = NaN) : void
      {
         var _loc3_:IGameSprite = getTarget();
         if(!_loc3_)
         {
            return;
         }
         if(!isNaN(param1))
         {
            _x = _loc3_.x + param1 * direct;
         }
         if(!isNaN(param2))
         {
            _y = _loc3_.y + param2;
         }
      }
      
      public function stop() : void
      {
         _isRenderMainAnimate = false;
      }
      
      public function gotoAndPlay(param1:String) : void
      {
         _mainMc.gotoAndStop(param1);
         _isRenderMainAnimate = true;
      }
      
      public function gotoAndStop(param1:String) : void
      {
         _mainMc.gotoAndStop(param1);
         _isRenderMainAnimate = false;
      }
      
      public function getTargets() : Vector.<IGameSprite>
      {
         if(_owner is FighterMain)
         {
            return (_owner as FighterMain).getTargets();
         }
         if(_owner is Assister)
         {
            return (_owner as Assister).getTargets();
         }
         return null;
      }
      
      private function getTarget() : IGameSprite
      {
         if(_owner is FighterMain)
         {
            return (_owner as FighterMain).getCurrentTarget();
         }
         if(_owner is Assister)
         {
            return (_owner as Assister).getCurrentTarget();
         }
         return null;
      }
      
      public function removeSelf() : void
      {
         if(onRemove != null)
         {
            onRemove(this);
         }
      }
      
      override public function getCurrentHits() : Array
      {
         var _loc8_:int = 0;
         var _loc7_:Object = null;
         var _loc6_:HitVO = null;
         var _loc4_:* = null;
         var _loc2_:Rectangle = null;
         var _loc3_:String = null;
         if(!_hitAreaCache)
         {
            return null;
         }
         var _loc5_:Array = _hitAreaCache.getAreaByFrame(_mainMc.currentFrame) as Array;
         if(!_loc5_ || _loc5_.length < 1)
         {
            return null;
         }
         var _loc1_:Array = [];
         _loc8_;
         while(_loc8_ < _loc5_.length)
         {
            _loc7_ = _loc5_[_loc8_];
            _loc3_ = _loc7_.name;
            _loc6_ = _loc7_.hitVO;
            if(_loc6_)
            {
               _loc2_ = _loc7_.area;
               _loc6_.currentArea = getCurrentRect(_loc2_,"hit" + _loc8_);
               _loc1_.push(_loc6_);
            }
            _loc8_++;
         }
         return _loc1_;
      }
      
      public function getHitCheckRect(param1:String) : Rectangle
      {
         var _loc2_:Rectangle = getCheckHitRect(param1);
         if(_loc2_ == null)
         {
            return null;
         }
         return getCurrentRect(_loc2_,"hit_check");
      }
      
      public function getCheckHitRect(param1:String) : Rectangle
      {
         var _loc2_:DisplayObject = _mainMc.getChildByName(param1);
         if(!_loc2_)
         {
            return null;
         }
         var _loc4_:Object = _hitCheckAreaCache.getAreaByDisplay(_loc2_);
         if(_loc4_)
         {
            return _loc4_.area;
         }
         var _loc3_:Rectangle = _loc2_.getBounds(_mainMc);
         _hitCheckAreaCache.cacheAreaByDisplay(_loc2_,_loc3_);
         return _loc3_;
      }
      
      private function getCurrentRect(param1:Rectangle, param2:String = null) : Rectangle
      {
         var _loc3_:Rectangle = null;
         if(param2 == null)
         {
            _loc3_ = new Rectangle();
         }
         else if(_rectCache[param2])
         {
            _loc3_ = _rectCache[param2];
         }
         else
         {
            _loc3_ = new Rectangle();
            _rectCache[param2] = _loc3_;
         }
         _loc3_.x = param1.x * direct + _x;
         if(direct < 0)
         {
            _loc3_.x -= param1.width;
         }
         _loc3_.y = param1.y + _y;
         _loc3_.width = param1.width;
         _loc3_.height = param1.height;
         return _loc3_;
      }
      
      private function getHitModel() : FighterHitModel
      {
         if(_owner is FighterMain)
         {
            return (_owner as FighterMain).getCtrler().hitModel;
         }
         if(_owner is Assister)
         {
            return (_owner as Assister).getCtrler().hitModel;
         }
         throw new Error("不支持的owner类型!");
      }
      
      private function findHitArea() : void
      {
         var _loc9_:int = 0;
         var _loc2_:DisplayObject = null;
         var _loc6_:HitVO = null;
         var _loc7_:Object = null;
         var _loc4_:Rectangle = null;
         var _loc5_:Object = null;
         if(!_hitAreaCache)
         {
            return;
         }
         var _loc8_:FighterHitModel = getHitModel();
         if(!_loc8_)
         {
            return;
         }
         if(_hitAreaCache.areaFrameDefined(_mainMc.currentFrame))
         {
            return;
         }
         var _loc3_:Object = _hitAreaCache.getAreaByFrame(_mainMc.currentFrame);
         if(_loc3_ != null)
         {
            return;
         }
         var _loc1_:Array = [];
         while(_loc9_ < _mainMc.numChildren)
         {
            _loc2_ = _mainMc.getChildAt(_loc9_);
            _loc6_ = _loc8_.getHitVOByDisplayName(_loc2_.name);
            if(!(_loc2_ == null || _loc6_ == null))
            {
               _loc7_ = _hitAreaCache.getAreaByDisplay(_loc2_);
               if(_loc7_ == null)
               {
                  _loc4_ = _loc2_.getBounds(_mainMc);
                  _loc5_ = _hitAreaCache.cacheAreaByDisplay(_loc2_,_loc4_,{"hitVO":_loc6_});
                  _loc1_.push(_loc5_);
               }
               else
               {
                  _loc1_.push(_loc7_);
               }
            }
            _loc9_++;
         }
         if(_loc1_.length < 1)
         {
            _loc1_ = null;
         }
         _hitAreaCache.cacheAreaByFrame(_mainMc.currentFrame,_loc1_);
      }
      
      private function getOwnerFighter() : FighterMain
      {
         if(_owner is FighterMain)
         {
            return _owner as FighterMain;
         }
         if(_owner is Assister)
         {
            return (_owner as Assister).getOwner() as FighterMain;
         }
         return null;
      }
      
      override public function hit(param1:HitVO, param2:IGameSprite) : void
      {
         var _loc3_:Number = NaN;
         var _loc4_:FighterMain = getOwnerFighter();
         if(param2 && _loc4_)
         {
            _loc3_ = _owner is Assister ? 0.15 : 0.13;
            _loc4_.addQi(param1.power * _loc3_);
            GameLogic.hitTarget(param1,_loc4_,param2);
         }
      }
   }
}

