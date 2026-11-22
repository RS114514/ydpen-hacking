package net.play5d.game.bvn.data
{
   import net.play5d.game.bvn.fighter.Assister;
   import net.play5d.game.bvn.fighter.FighterMain;
   
   public class GameRunFighterGroup
   {
      
      public var fighter1:FighterMain;
      
      public var fighter2:FighterMain;
      
      public var fighter3:FighterMain;
      
      public var fuzhu:Assister;
      
      public var currentFighter:FighterMain;
      
      public function GameRunFighterGroup()
      {
         super();
      }
      
      public function getFighterDatas() : Vector.<FighterVO>
      {
         var _loc1_:Vector.<FighterVO> = new Vector.<FighterVO>();
         fighter1 && _loc1_.push(fighter1.data);
         fighter2 && _loc1_.push(fighter2.data);
         fighter3 && _loc1_.push(fighter3.data);
         return _loc1_;
      }
      
      public function getNextFighter() : FighterMain
      {
         switch(currentFighter)
         {
            case fighter1:
               return fighter2;
            case fighter2:
               return fighter3;
            default:
               return null;
         }
      }
      
      public function destoryFighters(param1:FighterMain) : void
      {
         if(fighter1 && fighter1 != param1)
         {
            disposeFighter(fighter1);
         }
         if(fighter2 && fighter2 != param1)
         {
            disposeFighter(fighter2);
         }
         if(fighter3 && fighter3 != param1)
         {
            disposeFighter(fighter3);
         }
         disposeFuzhu();
      }
      
      public function removeCurrentFighter() : void
      {
         disposeFighter(currentFighter);
      }
      
      private function disposeFighter(param1:FighterMain) : void
      {
         if(param1 == null)
         {
            return;
         }
         if(param1 == currentFighter)
         {
            currentFighter = null;
         }
         param1.destory(true);
         switch(param1)
         {
            case fighter1:
               fighter1 = null;
               return;
            case fighter2:
               fighter2 = null;
               break;
            case fighter3:
               fighter3 = null;
         }
      }
      
      private function disposeFuzhu() : void
      {
         if(fuzhu != null)
         {
            fuzhu.destory(true);
            fuzhu = null;
         }
      }
   }
}

