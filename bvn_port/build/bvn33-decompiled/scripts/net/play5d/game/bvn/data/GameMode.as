package net.play5d.game.bvn.data
{
   public class GameMode
   {
      
      public static const TEAM_ACRADE:int = 10;
      
      public static const TEAM_VS_PEOPLE:int = 11;
      
      public static const TEAM_VS_CPU:int = 12;
      
      public static const SINGLE_ACRADE:int = 20;
      
      public static const SINGLE_VS_PEOPLE:int = 21;
      
      public static const SINGLE_VS_CPU:int = 22;
      
      public static const SURVIVOR:int = 30;
      
      public static const TRAINING:int = 40;
      
      public static var currentMode:int;
      
      public function GameMode()
      {
         super();
      }
      
      public static function getTeams() : Array
      {
         return [{
            "id":1,
            "name":"P1"
         },{
            "id":2,
            "name":"P2"
         }];
      }
      
      public static function isTeamMode() : Boolean
      {
         return currentMode == 10 || currentMode == 12 || currentMode == 11;
      }
      
      public static function isSingleMode() : Boolean
      {
         return currentMode == 20 || currentMode == 22 || currentMode == 21;
      }
      
      public static function isVsPeople() : Boolean
      {
         return currentMode == 11 || currentMode == 21;
      }
      
      public static function isVsCPU(param1:Boolean = true) : Boolean
      {
         return currentMode == 12 || currentMode == 22 || param1 && currentMode == 40;
      }
      
      public static function isAcrade() : Boolean
      {
         return currentMode == 20 || currentMode == 10 || currentMode == 30;
      }
   }
}

