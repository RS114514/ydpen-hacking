package net.play5d.game.bvn.ui.fight
{
   import flash.display.DisplayObject;
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.fighter.FighterMain;
   
   public class FighterHpBar
   {
      
      private var _ui:hpbar_barmc;
      
      private var _bar:DisplayObject;
      
      private var _redbar:DisplayObject;
      
      private var _fighter:FighterMain;
      
      private var _hprate:Number = 1;
      
      private var _redBarMoving:Boolean;
      
      private var _redBarMoveDelay:int;
      
      private var _justHurtFly:Boolean;
      
      public function FighterHpBar(param1:hpbar_barmc)
      {
         super();
         _ui = param1;
         _bar = _ui.bar;
         _redbar = _ui.redbar;
      }
      
      public function get ui() : DisplayObject
      {
         return _ui;
      }
      
      public function destory() : void
      {
         _fighter = null;
      }
      
      public function setFighter(param1:FighterMain) : void
      {
         _fighter = param1;
      }
      
      public function render() : void
      {
         var _loc2_:Number = NaN;
         var _loc4_:Number = NaN;
         var _loc1_:Number = _fighter.hp / _fighter.hpMax;
         if(_redBarMoving && _loc1_ != _hprate)
         {
            _redbar.scaleX = _hprate;
            _redBarMoving = false;
         }
         _hprate = _loc1_;
         var _loc3_:Number = _hprate - _bar.scaleX;
         var _loc5_:Number = _loc3_ < 0 ? 0.4 : 0.04;
         if(Math.abs(_loc3_) < 0.01)
         {
            _bar.scaleX = _hprate;
         }
         else
         {
            _bar.scaleX += _loc3_ * _loc5_;
         }
         switch(_fighter.actionState - 21)
         {
            case 0:
               _redBarMoveDelay = 100;
               break;
            case 1:
            case 2:
               if(_redBarMoveDelay > 0)
               {
                  if(!_justHurtFly)
                  {
                     _redBarMoveDelay = 1.5 * GameConfig.FPS_GAME;
                     _justHurtFly = true;
                  }
                  else if(_redBarMoveDelay > 0)
                  {
                     _redBarMoveDelay = _redBarMoveDelay - 1;
                  }
               }
               break;
            default:
               _redBarMoveDelay = 0;
               _justHurtFly = false;
         }
         if(_redBarMoveDelay <= 0)
         {
            _loc2_ = _hprate - _redbar.scaleX;
            _loc4_ = _loc2_ < 0 ? 0.1 : 0.02;
            if(Math.abs(_loc2_) < 0.01)
            {
               _redbar.scaleX = _hprate;
               _redBarMoving = false;
            }
            else
            {
               _redbar.scaleX += _loc2_ * _loc4_;
               _redBarMoving = true;
            }
         }
      }
   }
}

