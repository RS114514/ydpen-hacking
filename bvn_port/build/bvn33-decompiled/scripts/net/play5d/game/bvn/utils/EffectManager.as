package net.play5d.game.bvn.utils
{
   import flash.utils.Dictionary;
   import net.play5d.game.bvn.data.EffectModel;
   import net.play5d.game.bvn.data.EffectVO;
   import net.play5d.game.bvn.fighter.models.HitVO;
   import net.play5d.game.bvn.views.effects.BuffEffectView;
   import net.play5d.game.bvn.views.effects.EffectView;
   import net.play5d.game.bvn.views.effects.ShineEffectView;
   import net.play5d.game.bvn.views.effects.SpecialEffectView;
   import net.play5d.game.bvn.views.effects.SteelHitEffect;
   
   public class EffectManager
   {
      
      private var _viewCache:Dictionary = new Dictionary();
      
      private var _hitCache:Dictionary = new Dictionary();
      
      private var _shineCache:Vector.<ShineEffectView> = new Vector.<ShineEffectView>();
      
      public function EffectManager()
      {
         super();
      }
      
      public function destory() : void
      {
         for each(var _loc3_:Vector.<EffectView> in _viewCache)
         {
            for each(var _loc1_:EffectView in _loc3_)
            {
               _loc1_.destory();
            }
         }
         for each(var _loc2_:ShineEffectView in _shineCache)
         {
            _loc2_.destory();
         }
         _viewCache = null;
         _hitCache = null;
         _shineCache = null;
      }
      
      public function getEffectVOByHitVO(param1:HitVO) : EffectVO
      {
         if(_hitCache[param1] != undefined)
         {
            return _hitCache[param1];
         }
         var _loc2_:EffectVO = EffectModel.I.getHitEffect(param1.hitType);
         if(!_loc2_)
         {
            _hitCache[param1] = null;
            return null;
         }
         _loc2_ = _loc2_.clone();
         if(_loc2_.shake)
         {
            if(_loc2_.shake.pow != undefined && _loc2_.shake.pow != 0)
            {
               _loc2_.shake.y = _loc2_.shake.pow;
            }
            if(_loc2_.shake.x == 0 && _loc2_.shake.y == 0)
            {
               _loc2_.shake.x = 3;
            }
         }
         _hitCache[param1] = _loc2_;
         return _loc2_;
      }
      
      public function getEffectView(param1:EffectVO) : EffectView
      {
         var _loc4_:int = 0;
         var _loc5_:int = 0;
         var _loc3_:EffectView = null;
         var _loc2_:Vector.<EffectView> = _viewCache[param1];
         if(_loc2_)
         {
            _loc4_ = int(_loc2_.length);
            while(_loc5_ < _loc4_)
            {
               if(!_loc2_[_loc5_].isActive)
               {
                  return _loc2_[_loc5_];
               }
               _loc5_++;
            }
         }
         else
         {
            _loc2_ = new Vector.<EffectView>();
            _viewCache[param1] = _loc2_;
         }
         if(param1.isSpecial)
         {
            _loc3_ = new SpecialEffectView(param1);
         }
         else if(param1.isBuff)
         {
            _loc3_ = new BuffEffectView(param1);
         }
         else if(param1.isSteelHit)
         {
            _loc3_ = new SteelHitEffect(param1);
         }
         else
         {
            _loc3_ = new EffectView(param1);
         }
         _loc2_.push(_loc3_);
         return _loc3_;
      }
      
      public function getShine() : ShineEffectView
      {
         var _loc3_:int = 0;
         var _loc1_:int = int(_shineCache.length);
         while(_loc3_ < _loc1_)
         {
            if(!_shineCache[_loc3_].isActive)
            {
               return _shineCache[_loc3_];
            }
            _loc3_++;
         }
         var _loc2_:ShineEffectView = new ShineEffectView();
         _shineCache.push(_loc2_);
         return _loc2_;
      }
   }
}

