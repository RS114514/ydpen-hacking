package net.play5d.game.bvn.ctrl.game_ctrls
{
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.ctrl.StateCtrl;
   import net.play5d.game.bvn.fighter.FighterMain;
   
   public class TrainingCtrler
   {
      
      public static var RECOVER_HP:Boolean = true;
      
      public static var RECOVER_QI:Boolean = true;
      
      public static var RECOVER_FZ_QI:Boolean = true;
      
      private var _trainAddDelay:Object;
      
      private var _fighters:Array;
      
      public function TrainingCtrler()
      {
         super();
      }
      
      public function initlize(param1:Array) : void
      {
         _fighters = param1;
         for each(var _loc2_:FighterMain in _fighters)
         {
            _loc2_.qi = 300;
         }
         _trainAddDelay = {};
         StateCtrl.I.transOut(null,true);
      }
      
      public function destory() : void
      {
         _fighters = null;
         _trainAddDelay = null;
      }
      
      public function render() : void
      {
         var _loc2_:String = null;
         var _loc1_:String = null;
         var _loc3_:String = null;
         for each(var _loc4_:FighterMain in _fighters)
         {
            _loc2_ = _loc4_.id + "_hp";
            if(_loc4_.actionState == 21 || _loc4_.actionState == 22)
            {
               _trainAddDelay[_loc2_] = 1 * GameConfig.FPS_GAME;
            }
            else if(_trainAddDelay[_loc2_] != undefined && _trainAddDelay[_loc2_] > 0)
            {
               _trainAddDelay[_loc2_]--;
               if(_trainAddDelay[_loc2_] <= 0 && RECOVER_HP)
               {
                  _loc4_.hp = _loc4_.hpMax;
               }
            }
            else if(_loc4_.hp == _loc4_.hpMax)
            {
               _trainAddDelay[_loc2_] = 0;
            }
            else
            {
               _trainAddDelay[_loc2_] = 2 * GameConfig.FPS_GAME;
            }
            _loc1_ = _loc4_.id + "_qi";
            if(_trainAddDelay[_loc1_] != undefined && _trainAddDelay[_loc1_] > 0)
            {
               _trainAddDelay[_loc1_]--;
               if(_trainAddDelay[_loc1_] <= 0 && RECOVER_QI)
               {
                  _loc4_.qi = 300;
               }
            }
            else if(_loc4_.qi == 300)
            {
               _trainAddDelay[_loc1_] = 0;
            }
            else
            {
               _trainAddDelay[_loc1_] = 2 * GameConfig.FPS_GAME;
            }
            _loc3_ = _loc4_.id + "fz";
            if(_trainAddDelay[_loc3_] != undefined && _trainAddDelay[_loc3_] > 0)
            {
               _trainAddDelay[_loc3_]--;
               if(_trainAddDelay[_loc3_] <= 0 && RECOVER_FZ_QI)
               {
                  _loc4_.fzqi = 100;
               }
            }
            else if(_loc4_.fzqi == 100)
            {
               _trainAddDelay[_loc3_] = 0;
            }
            else
            {
               _trainAddDelay[_loc3_] = 2 * GameConfig.FPS_GAME;
            }
         }
      }
   }
}

