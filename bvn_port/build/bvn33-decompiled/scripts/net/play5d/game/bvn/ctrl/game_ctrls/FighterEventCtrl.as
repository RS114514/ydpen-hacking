package net.play5d.game.bvn.ctrl.game_ctrls
{
   import net.play5d.game.bvn.ctrl.EffectCtrl;
   import net.play5d.game.bvn.ctrl.GameLogic;
   import net.play5d.game.bvn.data.GameMode;
   import net.play5d.game.bvn.data.GameRunFighterGroup;
   import net.play5d.game.bvn.data.TeamVO;
   import net.play5d.game.bvn.fighter.Assister;
   import net.play5d.game.bvn.fighter.Bullet;
   import net.play5d.game.bvn.fighter.FighterAttacker;
   import net.play5d.game.bvn.fighter.FighterMain;
   import net.play5d.game.bvn.fighter.events.FighterEvent;
   import net.play5d.game.bvn.fighter.events.FighterEventDispatcher;
   import net.play5d.game.bvn.interfaces.BaseGameSprite;
   import net.play5d.game.bvn.interfaces.IGameSprite;
   
   public class FighterEventCtrl
   {
      
      private var _attackers:Array = [];
      
      public function FighterEventCtrl()
      {
         super();
      }
      
      public function initlize() : void
      {
         FighterEventDispatcher.removeAllListeners();
         FighterEventDispatcher.addEventListener("FIRE_BULLET",fireBullet);
         FighterEventDispatcher.addEventListener("ADD_ATTACKER",addAttacker);
         FighterEventDispatcher.addEventListener("ADD_ASSISTER",addAssister);
         FighterEventDispatcher.addEventListener("HIT_TARGET",onHitTarget);
         FighterEventDispatcher.addEventListener("HURT_RESUME",onHurtResume);
         FighterEventDispatcher.addEventListener("HURT_DOWN",onHurtDown);
         FighterEventDispatcher.addEventListener("DIE",onDie);
      }
      
      public function destory() : void
      {
         FighterEventDispatcher.removeAllListeners();
      }
      
      private function fireBullet(param1:FighterEvent) : void
      {
         var _loc2_:Object = param1.params;
         if(!_loc2_ || !_loc2_.mc)
         {
            return;
         }
         var _loc3_:Bullet = new Bullet(_loc2_.mc,_loc2_);
         _loc3_.onRemove = removeBullet;
         _loc3_.setHitVO(_loc2_.hitVO);
         GameCtrl.I.addGameSprite(param1.fighter.team.id,_loc3_);
      }
      
      private function removeBullet(param1:Bullet) : void
      {
         GameCtrl.I.removeGameSprite(param1);
      }
      
      private function addAttacker(param1:FighterEvent) : void
      {
         var _loc3_:Object = param1.params;
         if(!_loc3_ || !_loc3_.mc)
         {
            return;
         }
         var _loc2_:FighterAttacker = new FighterAttacker(_loc3_.mc,_loc3_);
         _loc2_.onRemove = removeAttacker;
         _loc2_.setOwner(param1.fighter);
         _loc2_.init();
         _attackers.push(_loc2_);
         GameCtrl.I.addGameSprite(param1.fighter.team.id,_loc2_);
      }
      
      private function addAssister(param1:FighterEvent) : void
      {
         var _loc4_:FighterMain = param1.fighter as FighterMain;
         var _loc3_:GameRunFighterGroup = _loc4_.team.id == 1 ? GameCtrl.I.gameRunData.p1FighterGroup : GameCtrl.I.gameRunData.p2FighterGroup;
         var _loc2_:Assister = _loc3_.fuzhu;
         _loc2_.setOwner(_loc4_);
         _loc2_.direct = _loc4_.direct;
         _loc2_.x = _loc4_.x - 30 * _loc2_.direct;
         _loc2_.y = _loc4_.y;
         _loc2_.onRemove = removeAssister;
         GameCtrl.I.addGameSprite(param1.fighter.team.id,_loc2_);
         EffectCtrl.I.assisterEffect(_loc2_);
         _loc2_.goFight();
      }
      
      private function removeAssister(param1:Assister) : void
      {
         GameCtrl.I.removeGameSprite(param1);
      }
      
      private function removeAttacker(param1:FighterAttacker) : void
      {
         GameCtrl.I.removeGameSprite(param1);
         var _loc2_:int = _attackers.indexOf(param1);
         if(_loc2_ != -1)
         {
            _attackers.splice(_loc2_,1);
         }
      }
      
      public function getAttacker(param1:String, param2:int) : FighterAttacker
      {
         for each(var _loc3_:FighterAttacker in _attackers)
         {
            if(_loc3_.name == param1 && _loc3_.team.id == param2)
            {
               return _loc3_;
            }
         }
         return null;
      }
      
      private function onHitTarget(param1:FighterEvent) : void
      {
         addHits(param1.fighter as FighterMain,param1.params.target);
         if(GameMode.isAcrade() && param1.fighter.team.id == 1)
         {
            GameLogic.addScoreByHitTarget(param1.params.hitvo);
         }
      }
      
      private function onHurtResume(param1:FighterEvent) : void
      {
         removeHits(param1.fighter.id);
      }
      
      private function onHurtDown(param1:FighterEvent) : void
      {
         removeHits(param1.fighter.id);
      }
      
      private function addHits(param1:FighterMain, param2:IGameSprite) : void
      {
         var _loc5_:String = param2 && param2 is BaseGameSprite ? (param2 as BaseGameSprite).id : null;
         var _loc4_:int = 1;
         switch(param1.team.id - 1)
         {
            case 0:
               _loc4_ = 1;
               break;
            case 1:
               _loc4_ = 2;
         }
         var _loc3_:int = GameLogic.addHits(param1.id,_loc5_,_loc4_);
         if(_loc3_ > 1)
         {
            GameCtrl.I.gameState.gameUI.getUI().showHits(_loc3_,_loc4_);
         }
      }
      
      private function removeHits(param1:String) : void
      {
         var _loc2_:Object = GameLogic.getHitsObjByTargetId(param1);
         if(_loc2_)
         {
            GameCtrl.I.gameState.gameUI.getUI().hideHits(_loc2_.uiID);
         }
         GameLogic.clearHitsByTargetId(param1);
      }
      
      private function onDie(param1:FighterEvent) : void
      {
         var _loc3_:FighterMain = null;
         var _loc2_:FighterMain = param1.fighter as FighterMain;
         var _loc4_:TeamVO = GameCtrl.I.getEnemyTeam(param1.fighter);
         if(_loc4_)
         {
            for each(var _loc5_:IGameSprite in _loc4_.children)
            {
               if(_loc5_ is FighterMain)
               {
                  _loc3_ = _loc5_ as FighterMain;
                  break;
               }
            }
         }
         GameCtrl.I.gameEnd(_loc3_,_loc2_);
      }
   }
}

