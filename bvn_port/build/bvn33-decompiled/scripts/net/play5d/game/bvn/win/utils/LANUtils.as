package net.play5d.game.bvn.win.utils
{
   import net.play5d.game.bvn.GameConfig;
   
   public class LANUtils
   {
      
      private static const _LOCK_KEYFRAME:int = 3;
      
      private static const _SYNC_GAP:int = 90;
      
      public static var LOCK_KEYFRAME:int = 3;
      
      public static var SYNC_GAP:int = 90;
      
      public function LANUtils()
      {
         super();
      }
      
      public static function updateParams() : void
      {
         var _loc1_:Number = GameConfig.FPS_GAME / 30;
         LOCK_KEYFRAME = 3 * _loc1_;
         SYNC_GAP = 90 * _loc1_;
      }
      
      public static function getTimeStr(param1:Date) : String
      {
         return formatNum(param1.month + 1) + "/" + formatNum(param1.date) + " " + formatNum(param1.hours) + ":" + formatNum(param1.minutes);
      }
      
      private static function formatNum(param1:int) : String
      {
         if(param1 < 10)
         {
            return "0" + param1;
         }
         return param1.toString();
      }
   }
}

