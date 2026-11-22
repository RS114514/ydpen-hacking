package net.play5d.game.bvn.ctrl
{
   import flash.display.DisplayObject;
   import flash.display.Sprite;
   import flash.filters.BitmapFilter;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import flash.utils.Dictionary;
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.ctrl.game_ctrls.GameCtrl;
   import net.play5d.game.bvn.data.EffectModel;
   import net.play5d.game.bvn.data.EffectVO;
   import net.play5d.game.bvn.fighter.Assister;
   import net.play5d.game.bvn.fighter.FighterMain;
   import net.play5d.game.bvn.fighter.models.HitVO;
   import net.play5d.game.bvn.fighter.vos.FighterBuffVO;
   import net.play5d.game.bvn.interfaces.BaseGameSprite;
   import net.play5d.game.bvn.interfaces.IGameSprite;
   import net.play5d.game.bvn.state.GameState;
   import net.play5d.game.bvn.utils.EffectManager;
   import net.play5d.game.bvn.views.effects.BitmapFilterView;
   import net.play5d.game.bvn.views.effects.BlackBackView;
   import net.play5d.game.bvn.views.effects.BuffEffectView;
   import net.play5d.game.bvn.views.effects.EffectView;
   import net.play5d.game.bvn.views.effects.ShadowEffectView;
   import net.play5d.game.bvn.views.effects.ShineEffectView;
   import net.play5d.game.bvn.views.effects.SpecialEffectView;
   
   public class EffectCtrl
   {
      
      public static var EFFECT_SMOOTHING:Boolean = true;
      
      public static var SHADOW_ENABLED:Boolean = true;
      
      public static var SHAKE_ENABLED:Boolean = true;
      
      private static var _i:EffectCtrl;
      
      public var shineMaxCount:int = 3;
      
      private var _gameStage:GameState;
      
      private var _effectLayer:Sprite;
      
      private var _manager:EffectManager;
      
      public var freezeEnabled:Boolean = true;
      
      private var _freezeFrame:int = 0;
      
      private var _effects:Vector.<EffectView>;
      
      private var _justRenderAnimateTargets:Vector.<BaseGameSprite>;
      
      private var _justRenderTargets:Vector.<BaseGameSprite>;
      
      private var _shineEffects:Vector.<ShineEffectView>;
      
      private var _shadowEffects:Dictionary;
      
      private var _filterEffects:Vector.<BitmapFilterView> = new Vector.<BitmapFilterView>();
      
      private var _blackBack:BlackBackView;
      
      private var _shakeHoldX:int = 0;
      
      private var _shakeHoldY:int = 0;
      
      private var _shakePowX:int = 0;
      
      private var _shakePowY:int = 0;
      
      private var _shakeXDirect:int = 1;
      
      private var _shakeYDirect:int = 1;
      
      private var _shakeFrameX:int = 0;
      
      private var _shakeFrameY:int = 0;
      
      private var _shakeLoseX:int = 0;
      
      private var _shakeLoseY:int = 0;
      
      private var _renderAnimateGap:int = 0;
      
      private var _renderAnimateFrame:int = 0;
      
      private var _renderAnimate:Boolean = true;
      
      private var _slowDownFrame:int;
      
      private var _replaceSkillFrame:int;
      
      private var _replaceSkillFrameHold:int;
      
      private var _replaceSkillPos:Point;
      
      private var _explodeSkillFrame:int;
      
      private var _explodeEffectPos:Point;
      
      private var _onFreezeOver:Vector.<Function> = null;
      
      public function EffectCtrl()
      {
         super();
      }
      
      public static function get I() : EffectCtrl
      {
         if(!_i)
         {
            _i = new EffectCtrl();
         }
         return _i;
      }
      
      public function destory() : void
      {
         if(_manager)
         {
            _manager.destory();
            _manager = null;
         }
         if(_blackBack)
         {
            _blackBack.destory();
            _blackBack = null;
         }
         _effects = null;
         _justRenderAnimateTargets = null;
         _justRenderTargets = null;
         _shineEffects = null;
         _shadowEffects = null;
         _gameStage = null;
         _effectLayer = null;
      }
      
      public function initlize(param1:GameState, param2:Sprite) : void
      {
         _manager = new EffectManager();
         _gameStage = param1;
         _effectLayer = param2;
         _effects = new Vector.<EffectView>();
         _justRenderAnimateTargets = new Vector.<BaseGameSprite>();
         _justRenderTargets = new Vector.<BaseGameSprite>();
         _shineEffects = new Vector.<ShineEffectView>();
         _shadowEffects = new Dictionary();
         _blackBack = new BlackBackView();
         _renderAnimateGap = Math.ceil(GameConfig.FPS_GAME / 30) - 1;
      }
      
      public function render() : void
      {
         var _loc2_:int = 0;
         if(freezeEnabled)
         {
            renderFreeze();
         }
         renderSlowDown();
         renderShine();
         _loc2_ = 0;
         while(_loc2_ < _effects.length)
         {
            _effects[_loc2_].render();
            _loc2_++;
         }
         if(isRenderAnimate())
         {
            renderAnimate();
         }
         if(_replaceSkillFrameHold > 0)
         {
            renderReplaceSkill();
         }
         if(_explodeSkillFrame > 0)
         {
            renderEnergyExplode();
         }
         if(_justRenderTargets.length > 0)
         {
            for each(var _loc1_:BaseGameSprite in _justRenderTargets)
            {
               _loc1_.render();
               GameLogic.fixGameSpritePosition(_loc1_);
            }
         }
      }
      
      private function renderShine() : void
      {
         var _loc1_:ShineEffectView = null;
         var _loc2_:int = 0;
         _loc2_ = 0;
         while(_loc2_ < _shineEffects.length)
         {
            _loc1_ = _shineEffects[_loc2_];
            _loc1_.render();
            _loc2_++;
         }
      }
      
      private function renderAnimate() : void
      {
         var _loc5_:* = null;
         var _loc3_:EffectView = null;
         var _loc4_:ShadowEffectView = null;
         var _loc1_:* = null;
         var _loc2_:BaseGameSprite = null;
         var _loc6_:int = 0;
         _loc6_ = 0;
         while(_loc6_ < _effects.length)
         {
            _loc3_ = _effects[_loc6_];
            _loc3_.renderAnimate();
            _loc6_++;
         }
         for each(_loc4_ in _shadowEffects)
         {
            _loc4_.render();
         }
         if(_justRenderAnimateTargets.length > 0)
         {
            for each(_loc2_ in _justRenderAnimateTargets)
            {
               _loc2_.renderAnimate();
            }
         }
         if(_blackBack)
         {
            _blackBack.renderAnimate();
         }
         renderShakeX();
         renderShakeY();
      }
      
      private function isRenderAnimate() : Boolean
      {
         if(_renderAnimateGap > 0)
         {
            if(_renderAnimateFrame++ >= _renderAnimateGap)
            {
               _renderAnimateFrame = 0;
               return true;
            }
            return false;
         }
         return true;
      }
      
      private function renderFreeze() : void
      {
         var _loc1_:int = 0;
         if(_freezeFrame > 0)
         {
            _freezeFrame = _freezeFrame - 1;
            if(_freezeFrame <= 0)
            {
               if(_onFreezeOver)
               {
                  while(_loc1_ < _onFreezeOver.length)
                  {
                     _onFreezeOver[_loc1_]();
                     _loc1_++;
                  }
                  _onFreezeOver = null;
               }
               GameCtrl.I.resume();
            }
         }
      }
      
      private function renderShakeX() : void
      {
         var _loc1_:Number = _shakeHoldX + _shakePowX;
         if(_loc1_ > 0)
         {
            _gameStage.x = _loc1_ * _shakeXDirect;
            if(_shakePowX > 0 && _shakeFrameX % 2 == 0)
            {
               _shakePowX -= _shakeLoseX;
               if(_shakePowX < _shakeLoseX)
               {
                  _shakePowX = 0;
                  _gameStage.x = 0;
                  _shakeFrameX = 0;
                  _shakeLoseX = 0;
                  return;
               }
            }
            _shakeFrameX = _shakeFrameX + 1;
            _shakeXDirect *= -1;
         }
      }
      
      private function renderShakeY() : void
      {
         var _loc1_:Number = _shakeHoldY + _shakePowY;
         if(_loc1_ > 0)
         {
            _gameStage.y = _loc1_ * _shakeYDirect;
            if(_shakePowY > 0 && _shakeFrameY % 2 == 0)
            {
               _shakePowY -= _shakeLoseY;
               if(_shakePowY < _shakeLoseY)
               {
                  _shakePowY = 0;
                  _gameStage.y = 0;
                  _shakeFrameY = 0;
                  _shakeLoseY = 0;
                  return;
               }
            }
            _shakeYDirect *= -1;
            _shakeFrameY = _shakeFrameY + 1;
         }
      }
      
      public function doHitEffect(param1:HitVO, param2:Rectangle, param3:IGameSprite = null) : void
      {
         var _loc6_:EffectVO = _manager.getEffectVOByHitVO(param1);
         if(!_loc6_)
         {
            return;
         }
         var _loc5_:Number = param2.x + param2.width / 2;
         var _loc7_:Number = param2.y + param2.height / 2;
         var _loc4_:int = 1;
         if(_loc6_.followDirect && param1.owner && param1.owner is IGameSprite)
         {
            _loc4_ = (param1.owner as IGameSprite).direct;
         }
         doEffectVO(_loc6_,_loc5_,_loc7_,_loc4_,param3);
      }
      
      public function doDefenseEffect(param1:HitVO, param2:Rectangle, param3:int, param4:IGameSprite = null) : void
      {
         var _loc7_:int = param1.hitType;
         switch(param3)
         {
            case 0:
               break;
            case 1:
               if(_loc7_ == 1)
               {
                  _loc7_ = 2;
               }
               if(_loc7_ == 6)
               {
                  _loc7_ = 3;
               }
         }
         var _loc8_:EffectVO = EffectModel.I.getDefenseEffect(_loc7_);
         if(!_loc8_)
         {
            return;
         }
         var _loc6_:Number = param2.x + param2.width / 2;
         var _loc9_:Number = param2.y + param2.height / 2;
         if(_loc8_.shake)
         {
            if(_loc8_.shake.pow != undefined && _loc8_.shake.pow != 0)
            {
               _loc8_.shake.x = 0;
               _loc8_.shake.y = _loc8_.shake.pow;
            }
         }
         var _loc5_:int = 1;
         if(_loc8_.followDirect && param1.owner && param1.owner is IGameSprite)
         {
            _loc5_ = (param1.owner as IGameSprite).direct;
         }
         doEffectVO(_loc8_,_loc6_,_loc9_,_loc5_,param4);
      }
      
      public function doSteelHitEffect(param1:HitVO, param2:Rectangle, param3:IGameSprite) : void
      {
         var _loc6_:EffectVO = null;
         switch(param1.hitType)
         {
            case 0:
               return;
            case 1:
            case 6:
               _loc6_ = EffectModel.I.getEffect("steel_hit_kan");
               break;
            case 2:
            case 3:
               _loc6_ = EffectModel.I.getEffect("steel_hit_qdj");
               break;
            default:
               _loc6_ = EffectModel.I.getEffect("steel_hit_mfdj");
         }
         if(!_loc6_)
         {
            return;
         }
         var _loc5_:Number = param2.x + param2.width / 2;
         var _loc7_:Number = param2.y + param2.height / 2;
         var _loc4_:int = 1;
         if(_loc6_.followDirect && param1.owner && param1.owner is IGameSprite)
         {
            _loc4_ = (param1.owner as IGameSprite).direct;
         }
         doEffectVO(_loc6_,_loc5_,_loc7_,_loc4_,param3);
      }
      
      public function doEffectById(param1:String, param2:Number, param3:Number, param4:int = 1, param5:IGameSprite = null) : void
      {
         var _loc6_:EffectVO = EffectModel.I.getEffect(param1);
         if(_loc6_)
         {
            doEffectVO(_loc6_,param2,param3,param4,param5);
         }
      }
      
      public function assisterEffect(param1:Assister) : void
      {
         var _loc2_:Boolean = param1.data.comicType == 1;
         if(_loc2_)
         {
            doEffectById("fz_naruto",param1.x,param1.y);
         }
         else
         {
            doEffectById("fz_bleach",param1.x,param1.y);
         }
      }
      
      public function doEffectVO(param1:EffectVO, param2:Number, param3:Number, param4:int = 1, param5:IGameSprite = null) : void
      {
         var _loc10_:Number = NaN;
         var _loc9_:Number = NaN;
         var _loc8_:Number = NaN;
         var _loc12_:uint = 0;
         var _loc13_:Number = NaN;
         var _loc11_:Number = NaN;
         var _loc7_:int = 0;
         var _loc6_:EffectView = addEffect(param1,param2,param3,param4);
         if(_loc6_)
         {
            _effectLayer.addChild(_loc6_.display);
         }
         if(param1.freeze > 0)
         {
            freeze(param1.freeze);
         }
         if(param1.shake)
         {
            _loc10_ = Number(param1.shake.time != undefined ? param1.shake.time : 0);
            _loc9_ = Number(param1.shake.x != undefined ? param1.shake.x : 0);
            _loc8_ = Number(param1.shake.y != undefined ? param1.shake.y : 0);
            shake(_loc9_,_loc8_,_loc10_);
         }
         if(param1.shine)
         {
            _loc12_ = uint(param1.shine.color != undefined ? param1.shine.color : 16777215);
            _loc13_ = Number(param1.shine.alpha != undefined ? param1.shine.alpha : 0.2);
            shine(_loc12_,_loc13_);
         }
         if(param1.slowDown)
         {
            _loc11_ = Number(param1.slowDown.rate != undefined ? param1.slowDown.rate : 1.5);
            _loc7_ = int(param1.slowDown.time != undefined ? param1.slowDown.time : 1000);
            slowDown(_loc11_,_loc7_);
         }
         if(param5)
         {
            _loc6_.setTarget(param5);
         }
         if(param1.specialEffectId && param5 && param5 is FighterMain)
         {
            doSpecialEffect(param1.specialEffectId,param5 as FighterMain);
         }
      }
      
      public function doSpecialEffect(param1:String, param2:FighterMain) : void
      {
         var _loc4_:EffectVO = EffectModel.I.getEffect(param1);
         var _loc3_:SpecialEffectView = addEffect(_loc4_,param2.x,param2.y,param2.direct) as SpecialEffectView;
         if(_loc3_)
         {
            _loc3_.setTarget(param2);
            _effectLayer.addChild(_loc3_.display);
         }
      }
      
      public function doBuffEffect(param1:String, param2:FighterMain, param3:FighterBuffVO) : void
      {
         var _loc5_:EffectVO = EffectModel.I.getEffect(param1);
         var _loc4_:BuffEffectView = addEffect(_loc5_,param2.x,param2.y,param2.direct) as BuffEffectView;
         if(_loc4_)
         {
            _loc4_.setTarget(param2);
            _loc4_.setBuff(param3);
            _effectLayer.addChild(_loc4_.display);
         }
      }
      
      private function addEffect(param1:EffectVO, param2:Number, param3:Number, param4:int = 1) : EffectView
      {
         var _loc5_:EffectView = _manager.getEffectView(param1);
         if(!_loc5_)
         {
            return null;
         }
         _loc5_.start(param2,param3,param4);
         _loc5_.addRemoveBack(removeEffect);
         _effects.push(_loc5_);
         return _loc5_;
      }
      
      private function removeEffect(param1:EffectView) : void
      {
         var _loc2_:int = _effects.indexOf(param1);
         if(_loc2_ != -1)
         {
            _effects.splice(_loc2_,1);
         }
      }
      
      public function freeze(param1:int) : void
      {
         if(!freezeEnabled)
         {
            return;
         }
         if(param1 < 1)
         {
            return;
         }
         var _loc2_:int = param1 / 1000 * GameConfig.FPS_GAME;
         if(_loc2_ < 1)
         {
            return;
         }
         _freezeFrame = _loc2_;
         GameCtrl.I.pause();
      }
      
      private function justRender(param1:BaseGameSprite) : void
      {
         if(_justRenderTargets.indexOf(param1) == -1)
         {
            _justRenderTargets.push(param1);
         }
      }
      
      private function justRenderAnimate(param1:BaseGameSprite) : void
      {
         if(_justRenderAnimateTargets.indexOf(param1) == -1)
         {
            _justRenderAnimateTargets.push(param1);
         }
      }
      
      private function cancelJustRender(param1:BaseGameSprite) : Boolean
      {
         var _loc2_:int = _justRenderTargets.indexOf(param1);
         if(_loc2_ != -1)
         {
            _justRenderTargets.splice(_loc2_,1);
         }
         return _justRenderTargets.length < 1;
      }
      
      private function cancelJustRenderAnimate(param1:BaseGameSprite) : Boolean
      {
         var _loc2_:int = _justRenderAnimateTargets.indexOf(param1);
         if(_loc2_ != -1)
         {
            _justRenderAnimateTargets.splice(_loc2_,1);
         }
         return _justRenderAnimateTargets.length < 1;
      }
      
      public function shine(param1:uint = 16777215, param2:Number = 0.2) : void
      {
         if(GameConfig.FPS_SHINE_EFFECT == 0)
         {
            return;
         }
         if(_shineEffects.length > shineMaxCount)
         {
            _shineEffects[0].removeSelf();
         }
         var _loc3_:ShineEffectView = _manager.getShine();
         _loc3_.init(param1,param2);
         _loc3_.onRemove = removeShine;
         _shineEffects.push(_loc3_);
         _gameStage.addChild(_loc3_);
      }
      
      private function removeShine(param1:ShineEffectView) : void
      {
         var _loc2_:int = _shineEffects.indexOf(param1);
         if(_loc2_ != -1)
         {
            _shineEffects.splice(_loc2_,1);
         }
      }
      
      public function startShake(param1:Number, param2:Number) : void
      {
         _shakeHoldX = param1;
         _shakeHoldY = param2;
      }
      
      public function endShake() : void
      {
         _shakeHoldX = 0;
         _shakeHoldY = 0;
         _gameStage.x = 0;
         _gameStage.y = 0;
      }
      
      public function shake(param1:Number = 0, param2:Number = 3, param3:int = 500) : void
      {
         if(!SHAKE_ENABLED)
         {
            return;
         }
         if(isNaN(param1) || isNaN(param2))
         {
            return;
         }
         if(param1 != 0)
         {
            if(_shakePowX == 0)
            {
               _shakeXDirect = param1 > 0 ? 1 : -1;
               _shakePowX = Math.abs(param1);
            }
            else
            {
               _shakePowX += Math.abs(param1) / 2;
            }
         }
         if(param2 != 0)
         {
            if(_shakePowY == 0)
            {
               _shakeYDirect = param2 > 0 ? 1 : -1;
               _shakePowY = Math.abs(param2);
            }
            else
            {
               _shakePowY += Math.abs(param2) / 2;
            }
         }
         if(param3 <= 0)
         {
            param3 = 500;
         }
         _shakeLoseX = Math.ceil(_shakePowX / (param3 / 1000 * 30));
         _shakeLoseY = Math.ceil(_shakePowY / (param3 / 1000 * 30));
         if(_shakeLoseX < 1)
         {
            _shakeLoseX = 1;
         }
         if(_shakeLoseY < 1)
         {
            _shakeLoseY = 1;
         }
      }
      
      public function startShadow(param1:DisplayObject, param2:int = 0, param3:int = 0, param4:int = 0) : void
      {
         if(!SHADOW_ENABLED)
         {
            return;
         }
         var _loc5_:ShadowEffectView = _shadowEffects[param1];
         if(_loc5_)
         {
            _loc5_.r = param2;
            _loc5_.g = param3;
            _loc5_.b = param4;
            _loc5_.stopShadow = false;
            return;
         }
         _loc5_ = new ShadowEffectView(param1,param2,param3,param4);
         _loc5_.onRemove = removeShadow;
         _loc5_.container = _effectLayer;
         _shadowEffects[param1] = _loc5_;
      }
      
      public function endShadow(param1:DisplayObject) : void
      {
         if(!SHADOW_ENABLED)
         {
            return;
         }
         if(!_shadowEffects)
         {
            return;
         }
         var _loc2_:ShadowEffectView = _shadowEffects[param1];
         if(_loc2_)
         {
            _loc2_.stopShadow = true;
         }
      }
      
      private function removeShadow(param1:ShadowEffectView) : void
      {
         if(!_shadowEffects)
         {
            return;
         }
         delete _shadowEffects[param1.target];
      }
      
      public function bisha(param1:BaseGameSprite, param2:Boolean = false, param3:DisplayObject = null) : void
      {
         justRenderAnimate(param1);
         GameCtrl.I.pause();
         GameCtrl.I.setRenderHit(false);
         _gameStage.addChildAt(_blackBack,0);
         _blackBack.fadIn();
         if(param3 && param1 is FighterMain)
         {
            showFace(param1 as FighterMain,param3);
         }
         if(param2)
         {
            GameCtrl.I.gameState.cameraFocusOne(param1.getDisplay());
            doEffectById("bisha_super",param1.x,param1.y - 50);
         }
         else
         {
            doEffectById("bisha",param1.x,param1.y - 50);
         }
         _gameStage.getMap().setVisible(false);
         _gameStage.setVisibleByClass(BitmapFilterView,false);
      }
      
      public function endBisha(param1:BaseGameSprite) : void
      {
         if(cancelJustRenderAnimate(param1))
         {
            GameCtrl.I.resume();
            GameCtrl.I.gameState.cameraResume();
            GameCtrl.I.setRenderHit(true);
            _blackBack.fadOut();
            _gameStage.getMap().setVisible(true);
            _gameStage.setVisibleByClass(BitmapFilterView,true);
         }
      }
      
      private function showFace(param1:FighterMain, param2:DisplayObject) : void
      {
         var _loc5_:DisplayObject = null;
         var _loc4_:int = 1;
         var _loc3_:IGameSprite = param1.getCurrentTarget();
         if(_loc3_)
         {
            _loc5_ = _loc3_.getDisplay();
            if(_loc5_)
            {
               _loc4_ = param1.getDisplay().x > _loc5_.x ? 2 : 1;
            }
         }
         _blackBack.showBishaFace(_loc4_,param2);
      }
      
      public function wanKai(param1:FighterMain, param2:DisplayObject = null) : void
      {
         justRenderAnimate(param1);
         GameCtrl.I.pause();
         GameCtrl.I.setRenderHit(false);
         _gameStage.addChildAt(_blackBack,0);
         _blackBack.fadIn();
         if(param2)
         {
            showFace(param1,param2);
         }
         GameCtrl.I.gameState.cameraFocusOne(param1.getDisplay());
         doEffectById("bisha_super",param1.x,param1.y - 50);
         _gameStage.getMap().setVisible(false);
         _gameStage.setVisibleByClass(BitmapFilterView,false);
      }
      
      public function endWanKai(param1:FighterMain) : void
      {
         if(cancelJustRenderAnimate(param1))
         {
            GameCtrl.I.resume();
            GameCtrl.I.gameState.cameraResume();
            _blackBack.fadOut();
            GameCtrl.I.setRenderHit(true);
            _gameStage.getMap().setVisible(true);
         }
      }
      
      public function jumpEffect(param1:Number, param2:Number) : void
      {
         doEffectById("jump",param1,param2);
      }
      
      public function jumpAirEffect(param1:Number, param2:Number) : void
      {
         doEffectById("jump_air",param1,param2);
      }
      
      public function touchFloorEffect(param1:Number, param2:Number) : void
      {
         doEffectById("touch_floor",param1,param2);
      }
      
      public function hitFloorEffect(param1:int, param2:Number, param3:Number) : void
      {
         switch(param1)
         {
            case 0:
               doEffectById("hit_floor",param2,param3);
               break;
            case 1:
               doEffectById("hit_floor_low",param2,param3);
               break;
            case 2:
               doEffectById("hit_floor_heavy",param2,param3);
               doEffectById("hit_floor_yan",param2,param3);
         }
      }
      
      public function slowDown(param1:Number, param2:int = 1000) : void
      {
         GameCtrl.I.slow(param1);
         _renderAnimateGap = Math.ceil(GameConfig.FPS_GAME / (30 / param1)) - 1;
         if(param2 == 0)
         {
            _slowDownFrame = 0;
         }
         else
         {
            _slowDownFrame = param2 / 1000 * GameConfig.FPS_GAME;
         }
      }
      
      private function renderSlowDown() : void
      {
         if(_slowDownFrame > 0)
         {
            _slowDownFrame = _slowDownFrame - 1;
            if(_slowDownFrame <= 0)
            {
               slowDownResume();
            }
         }
      }
      
      public function slowDownResume() : void
      {
         GameCtrl.I.slowResume();
         _renderAnimateGap = Math.ceil(GameConfig.FPS_GAME / 30) - 1;
         _slowDownFrame = 0;
      }
      
      public function BGEffect(param1:String, param2:Number = -1) : void
      {
         var effect:EffectView;
         var id:String = param1;
         var hold:Number = param2;
         var data:EffectVO = EffectModel.I.getEffect(id);
         if(!data)
         {
            return;
         }
         effect = addEffect(data,0,0,1);
         if(hold != -1)
         {
            effect.holdFrame = hold * 30;
         }
         if(effect)
         {
            effect.addRemoveBack(function():void
            {
               _gameStage.getMap().setVisible(true);
            });
            _gameStage.getMap().setVisible(false);
            _gameStage.addChildAt(effect.display,0);
         }
      }
      
      public function setOnFreezeOver(param1:Function) : void
      {
         if(!_onFreezeOver)
         {
            _onFreezeOver = new Vector.<Function>();
         }
         _onFreezeOver.push(param1);
      }
      
      public function replaceSkill(param1:BaseGameSprite) : void
      {
         GameCtrl.I.pause();
         _gameStage.addChildAt(_blackBack,0);
         _gameStage.getMap().setVisible(false);
         doEffectById("replaceSp",param1.x,param1.y);
         _replaceSkillPos = new Point(param1.x,param1.y);
         _replaceSkillFrame = 0;
         _replaceSkillFrameHold = GameConfig.FPS_GAME;
      }
      
      private function endReplaceSkill() : void
      {
         GameCtrl.I.resume();
         _blackBack.fadOut();
         _gameStage.getMap().setVisible(true);
         _replaceSkillFrameHold = 0;
      }
      
      private function renderReplaceSkill() : void
      {
         _replaceSkillFrame = _replaceSkillFrame + 1;
         if(_replaceSkillFrame == 1)
         {
            doEffectById("replaceSp2",_replaceSkillPos.x,_replaceSkillPos.y);
         }
         if(_replaceSkillFrame > _replaceSkillFrameHold)
         {
            endReplaceSkill();
         }
      }
      
      public function energyExplode(param1:BaseGameSprite) : void
      {
         GameCtrl.I.pause();
         _gameStage.addChildAt(_blackBack,0);
         _gameStage.getMap().setVisible(false);
         doEffectById("explodeSp",param1.x,param1.y);
         _explodeEffectPos = new Point(param1.x,param1.y);
         _explodeSkillFrame = 0.7 * GameConfig.FPS_GAME;
      }
      
      private function endEnergyExplode() : void
      {
         doEffectById("explodeSp2",_explodeEffectPos.x,_explodeEffectPos.y);
         GameCtrl.I.resume();
         _blackBack.fadOut();
         _gameStage.getMap().setVisible(true);
         _explodeSkillFrame = 0;
      }
      
      private function renderEnergyExplode() : void
      {
         _explodeSkillFrame = _explodeSkillFrame - 1;
         if(_explodeSkillFrame <= 0)
         {
            endEnergyExplode();
         }
      }
      
      public function ghostStep(param1:BaseGameSprite) : void
      {
         justRender(param1);
         justRenderAnimate(param1);
         GameCtrl.I.pause();
         _gameStage.addChildAt(_blackBack,0);
         _blackBack.fadIn();
         _gameStage.getMap().setVisible(false);
         SoundCtrl.I.playSwcSound(snd_ghost_jump);
      }
      
      public function endGhostStep(param1:BaseGameSprite) : void
      {
         var _loc3_:Boolean = cancelJustRender(param1);
         var _loc2_:Boolean = cancelJustRenderAnimate(param1);
         if(_loc3_ && _loc2_)
         {
            GameCtrl.I.resume();
            _blackBack.fadOut();
            _gameStage.getMap().setVisible(true);
         }
      }
      
      public function startFilter(param1:BaseGameSprite, param2:BitmapFilter, param3:Point = null) : void
      {
         var _loc4_:BitmapFilterView = null;
         for each(var _loc5_:BitmapFilterView in _filterEffects)
         {
            if(_loc5_.target == param1)
            {
               _loc4_ = _loc5_;
               break;
            }
         }
         if(!_loc4_)
         {
            _loc4_ = new BitmapFilterView(param1,param2,param3);
            GameCtrl.I.addGameSprite(0,_loc4_,0);
            _filterEffects.push(_loc4_);
         }
         else
         {
            _loc4_.update(param2,param3);
         }
      }
      
      public function endFilter(param1:BaseGameSprite) : void
      {
         var _loc3_:int = 0;
         var _loc2_:BitmapFilterView = null;
         _loc3_ = 0;
         while(_loc3_ < _filterEffects.length)
         {
            _loc2_ = _filterEffects[_loc3_];
            if(_loc2_.target == param1)
            {
               GameCtrl.I.removeGameSprite(_loc2_,true);
               _filterEffects.splice(_loc3_,1);
               break;
            }
            _loc3_++;
         }
      }
   }
}

