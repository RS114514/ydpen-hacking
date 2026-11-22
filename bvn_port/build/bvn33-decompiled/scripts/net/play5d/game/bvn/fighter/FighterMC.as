package net.play5d.game.bvn.fighter
{
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.geom.Rectangle;
   import net.play5d.game.bvn.fighter.ctrler.FighterMcCtrler;
   import net.play5d.game.bvn.fighter.events.FighterEventDispatcher;
   import net.play5d.game.bvn.fighter.models.FighterHitModel;
   import net.play5d.game.bvn.fighter.models.HitVO;
   import net.play5d.game.bvn.fighter.utils.McAreaCacher;
   import net.play5d.game.bvn.utils.MCUtils;
   
   public class FighterMC
   {
      
      private var _mcCtrler:FighterMcCtrler;
      
      private var _fighter:FighterMain;
      
      private var _fighterDisplay:DisplayObject;
      
      private var _renderMainAnimate:Boolean = false;
      
      private var _renderMainAnimateFrame:int = 0;
      
      private var _curFrameName:String;
      
      private var _curMainFrameCount:int;
      
      private var _curFrameCount:int;
      
      private var _mc:MovieClip;
      
      private var _undefinedFrames:Array = [];
      
      private var _hurtFlyFrame:int = 0;
      
      private var _hurtDownFrame:int;
      
      private var _hurtFlyState:int;
      
      private var _hurtYMin:Number = 0;
      
      private var _isHeavyDownAttack:Boolean;
      
      private var _bodyAreaCache:McAreaCacher = new McAreaCacher("body");
      
      private var _hitAreaCache:McAreaCacher = new McAreaCacher("hit");
      
      private var _hitCheckAreaCache:McAreaCacher = new McAreaCacher("hit_check");
      
      private var _hitRangeInited:Boolean;
      
      private var _hitRangeObj:Object;
      
      private var _goFrameDelay:Object = null;
      
      private var _hitx:Number = 0;
      
      private var _hity:Number = 0;
      
      public function FighterMC()
      {
         super();
      }
      
      public function get currentFrameName() : String
      {
         return _curFrameName;
      }
      
      public function getCurrentFrame() : int
      {
         return _mc.currentFrame;
      }
      
      public function getCurrentFrameCount() : int
      {
         return _curFrameCount;
      }
      
      public function get x() : Number
      {
         return _mc.x;
      }
      
      public function set x(param1:Number) : void
      {
         _mc.x = x;
      }
      
      public function get y() : Number
      {
         return _mc.y;
      }
      
      public function set y(param1:Number) : void
      {
         _mc.y = param1;
      }
      
      public function initlize(param1:MovieClip, param2:FighterMain, param3:FighterMcCtrler) : void
      {
         _mc = param1;
         _fighter = param2;
         _fighterDisplay = param2.getDisplay();
         _mcCtrler = param3;
         param3.setMc(this);
      }
      
      public function destory() : void
      {
         if(_bodyAreaCache)
         {
            _bodyAreaCache.destory();
            _bodyAreaCache = null;
         }
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
         _fighter = null;
         _fighterDisplay = null;
         _undefinedFrames = null;
      }
      
      public function getChildByName(param1:String) : DisplayObject
      {
         return _mc.getChildByName(param1);
      }
      
      public function renderAnimate() : void
      {
         if(_renderMainAnimate)
         {
            if(_renderMainAnimateFrame > 0)
            {
               if(--_renderMainAnimateFrame <= 0)
               {
                  _renderMainAnimate = false;
               }
               _curMainFrameCount = _curMainFrameCount + 1;
            }
            _mc.nextFrame();
         }
         renderChildren();
         findBodyArea();
         findHitArea();
         if(_hurtFlyState != 0)
         {
            renderHurtFly();
         }
         _curFrameCount = _curFrameCount + 1;
         if(_goFrameDelay)
         {
            if(_goFrameDelay.delay-- <= 0)
            {
               if(_goFrameDelay.call != undefined)
               {
                  _goFrameDelay.call();
               }
               else
               {
                  goFrame(_goFrameDelay.name,_goFrameDelay.isPlay,_goFrameDelay.playFrame,null);
               }
               _goFrameDelay = null;
            }
         }
      }
      
      private function renderChildren() : void
      {
         var _loc5_:int = 0;
         var _loc1_:MovieClip = null;
         var _loc3_:String = null;
         var _loc4_:int = 0;
         var _loc2_:int = _mc.numChildren;
         _loc5_ = 0;
         while(_loc5_ < _loc2_)
         {
            _loc1_ = _mc.getChildAt(_loc5_) as MovieClip;
            if(_loc1_)
            {
               _loc3_ = _loc1_.name;
               if(!(_loc3_ == "AImain" || _loc3_ == "bdmn" || _loc3_.indexOf("atm") != -1))
               {
                  _loc4_ = _loc1_.totalFrames;
                  if(_loc4_ >= 2)
                  {
                     var _loc6_:String = _loc1_.currentFrameLabel;
                     if("stop" !== _loc6_)
                     {
                        if(_loc1_.currentFrame == _loc4_)
                        {
                           _loc1_.gotoAndStop(1);
                        }
                        else
                        {
                           _loc1_.nextFrame();
                        }
                     }
                  }
               }
            }
            _loc5_++;
         }
      }
      
      public function goFrame(param1:String, param2:Boolean = true, param3:int = 0, param4:Object = null) : void
      {
         _curFrameName = param1;
         _curMainFrameCount = 0;
         _curFrameCount = 0;
         _renderMainAnimate = param2;
         if(_renderMainAnimate)
         {
            _renderMainAnimateFrame = param3;
         }
         else
         {
            _renderMainAnimateFrame = 0;
         }
         if(param4 && (param4.name || param4.call) && int(param4.delay) > 0)
         {
            param4.isPlay = param4.isPlay != undefined ? param4.isPlay : true;
            param4.playFrame = param4.playFrame != undefined ? param4.playFrame : 0;
            _goFrameDelay = param4;
         }
         else
         {
            _goFrameDelay = null;
         }
         _mc.gotoAndStop(param1);
         renderChildren();
      }
      
      public function stopRenderMainAnimate() : void
      {
         _renderMainAnimate = false;
      }
      
      public function resumeRenderMainAnimate() : void
      {
         _renderMainAnimate = true;
      }
      
      public function checkFrame(param1:String) : Boolean
      {
         if(_undefinedFrames.indexOf(param1) != -1)
         {
            return false;
         }
         if(MCUtils.hasFrameLabel(_mc,param1))
         {
            return true;
         }
         _undefinedFrames.push(param1);
         trace("未找到帧：" + param1);
         return false;
      }
      
      public function getCurrentHitSprite() : Array
      {
         var _loc3_:int = 0;
         var _loc1_:DisplayObject = null;
         var _loc2_:Array = [];
         while(_loc3_ < _mc.numChildren)
         {
            _loc1_ = _mc.getChildAt(_loc3_);
            if(_loc1_ && _loc1_.name.indexOf("atm") != -1)
            {
               _loc2_.push(_loc1_);
            }
            _loc3_++;
         }
         return _loc2_;
      }
      
      public function getCurrentBodyArea() : Rectangle
      {
         var _loc1_:Object = _bodyAreaCache.getAreaByFrame(_mc.currentFrame);
         if(_loc1_)
         {
            return _loc1_.area;
         }
         return null;
      }
      
      public function getCurrentHitArea() : Array
      {
         return _hitAreaCache.getAreaByFrame(_mc.currentFrame) as Array;
      }
      
      public function getCheckHitRect(param1:String) : Rectangle
      {
         var _loc2_:DisplayObject = _mc.getChildByName(param1);
         if(!_loc2_)
         {
            return null;
         }
         var _loc4_:Object = _hitCheckAreaCache.getAreaByDisplay(_loc2_);
         if(_loc4_)
         {
            return _loc4_.area;
         }
         var _loc3_:Rectangle = _loc2_.getBounds(_fighterDisplay);
         _hitCheckAreaCache.cacheAreaByDisplay(_loc2_,_loc3_);
         return _loc3_;
      }
      
      private function findBodyArea() : void
      {
         var _loc2_:Rectangle = null;
         if(!_bodyAreaCache)
         {
            return;
         }
         if(_bodyAreaCache.areaFrameDefined(_mc.currentFrame))
         {
            return;
         }
         var _loc1_:Object = _bodyAreaCache.getAreaByFrame(_mc.currentFrame);
         if(_loc1_ != null)
         {
            return;
         }
         var _loc3_:DisplayObject = _mc.getChildByName("bdmn");
         if(_loc3_)
         {
            _loc1_ = _bodyAreaCache.getAreaByDisplay(_loc3_);
            if(_loc1_ == null)
            {
               _loc2_ = _loc3_.getBounds(_fighterDisplay);
               _loc1_ = _bodyAreaCache.cacheAreaByDisplay(_loc3_,_loc2_);
            }
         }
         _bodyAreaCache.cacheAreaByFrame(_mc.currentFrame,_loc1_);
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
         if(_hitAreaCache.areaFrameDefined(_mc.currentFrame))
         {
            return;
         }
         var _loc3_:Object = _hitAreaCache.getAreaByFrame(_mc.currentFrame);
         if(_loc3_ != null)
         {
            return;
         }
         var _loc8_:FighterHitModel = _fighter.getCtrler().hitModel;
         var _loc1_:Array = [];
         while(_loc9_ < _mc.numChildren)
         {
            _loc2_ = _mc.getChildAt(_loc9_);
            _loc6_ = _loc8_.getHitVOByDisplayName(_loc2_.name);
            if(!(_loc2_ == null || _loc6_ == null))
            {
               _loc7_ = _hitAreaCache.getAreaByDisplay(_loc2_);
               if(_loc7_ == null)
               {
                  _loc4_ = _loc2_.getBounds(_fighterDisplay);
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
         _hitAreaCache.cacheAreaByFrame(_mc.currentFrame,_loc1_);
      }
      
      public function playHurtFly(param1:Number, param2:Number, param3:Boolean = true) : void
      {
         if(param1 != 0)
         {
            _fighter.direct = param1 > 0 ? -1 : 1;
         }
         if(param3)
         {
            goFrame("被打",false,0,{
               "name":"击飞",
               "delay":1,
               "isPlay":false
            });
         }
         else
         {
            goFrame("击飞",false);
         }
         if(param2 > 5)
         {
            _hurtFlyFrame = 0;
            _isHeavyDownAttack = true;
         }
         else
         {
            _isHeavyDownAttack = false;
            _hurtFlyFrame = 15;
         }
         _fighter.setVelocity(param1,param2);
         _fighter.setDamping(0,0.5);
         _hurtFlyState = 1;
         _hurtYMin = _fighter.y;
         _hitx = param1;
         _hity = param2;
      }
      
      public function playHurtDown() : void
      {
         goFrame("击飞_弹",false,0,{
            "call":playHurtDown2,
            "delay":2
         });
         _mcCtrler.effectCtrler.shake(0,2);
         _mcCtrler.effectCtrler.hitFloor(1);
         _fighter.setDamping(2);
      }
      
      private function playHurtDown2() : void
      {
         goFrame("击飞_倒",false);
         _hurtDownFrame = 15;
         _hurtFlyState = 4;
         _mcCtrler.touchFloor();
         _fighter.actionState = 23;
         FighterEventDispatcher.dispatchEvent(_fighter,"HURT_DOWN");
      }
      
      public function stopHurtFly() : void
      {
         _hurtFlyState = 0;
      }
      
      private function renderHurtFly() : void
      {
         var _loc1_:Number = NaN;
         var _loc2_:Number = NaN;
         _loc1_ = NaN;
         _loc2_ = NaN;
         switch(_hurtFlyState - 1)
         {
            case 0:
               if(--_hurtFlyFrame <= 0 && !_fighter.isInAir)
               {
                  goFrame("击飞_落");
                  _hurtFlyState = 2;
               }
               if(_hurtYMin > _fighter.y)
               {
                  _hurtYMin = _fighter.y;
               }
               break;
            case 1:
               if(_curFrameCount < 2)
               {
                  return;
               }
               if(_isHeavyDownAttack)
               {
                  _hurtDownFrame = 30;
                  goFrame("击飞_倒",false);
                  _fighter.actionState = 23;
                  FighterEventDispatcher.dispatchEvent(_fighter,"HURT_DOWN");
                  _fighter.setDamping(4);
                  _hurtFlyState = 4;
                  _loc1_ = _fighter.y - _hurtYMin;
                  _loc2_ = _loc1_ / 25 * (1 + _hity * 0.1);
                  if(_loc2_ < 2)
                  {
                     _loc2_ = 2;
                  }
                  if(_loc2_ > 5)
                  {
                     _loc2_ = 5;
                  }
                  _mcCtrler.effectCtrler.shake(0,_loc2_);
                  _mcCtrler.effectCtrler.hitFloor(2);
               }
               else
               {
                  goFrame("击飞_弹",false);
                  _loc1_ = _fighter.y - _hurtYMin;
                  _loc2_ = _loc1_ / 25;
                  if(_loc2_ < 3)
                  {
                     _loc2_ = 3;
                  }
                  if(_loc2_ > 8)
                  {
                     _loc2_ = 8;
                  }
                  _fighter.setVecY(-_loc2_);
                  _hurtFlyState = 3;
                  _fighter.actionState = 24;
                  if(_loc2_ < 0.5)
                  {
                     _loc2_ = 0.5;
                  }
                  if(_loc2_ > 3)
                  {
                     _loc2_ = 3;
                  }
                  _mcCtrler.effectCtrler.shake(0,_loc2_);
                  _mcCtrler.effectCtrler.hitFloor(0);
               }
               break;
            case 2:
               if(_curFrameCount < 2)
               {
                  return;
               }
               if(_fighter.isInAir)
               {
                  return;
               }
               goFrame("击飞_倒",false);
               _fighter.setDamping(2);
               _hurtDownFrame = 15;
               _hurtFlyState = 4;
               _mcCtrler.effectCtrler.shake(0,1);
               _mcCtrler.effectCtrler.hitFloor(1);
               _fighter.actionState = 23;
               FighterEventDispatcher.dispatchEvent(_fighter,"HURT_DOWN");
               break;
            case 3:
               if(!_fighter.isAlive)
               {
                  _hurtFlyState = 0;
                  _fighter.actionState = 30;
                  return;
               }
               if(--_hurtDownFrame <= 0)
               {
                  goFrame("击飞_起",true);
                  _hurtFlyState = 0;
               }
         }
      }
      
      public function getHitRange(param1:String) : Rectangle
      {
         if(!_hitRangeInited)
         {
            initHitRange();
            _hitRangeInited = true;
         }
         return _hitRangeObj[param1];
      }
      
      private function initHitRange() : void
      {
         var _loc1_:DisplayObject = null;
         var _loc2_:MovieClip = _mc.getChildByName("AImain") as MovieClip;
         _loc2_.gotoAndStop(2);
         _hitRangeObj = {};
         for each(var _loc3_:String in FighterHitRange.getALL())
         {
            _loc1_ = _loc2_.getChildByName(_loc3_);
            if(_loc1_)
            {
               _hitRangeObj[_loc3_] = _loc1_.getBounds(_fighterDisplay);
            }
         }
         _loc2_.gotoAndStop(1);
         _loc2_.visible = false;
      }
   }
}

