package net.play5d.game.bvn.win.data
{
   public class LanGameModel
   {
      
      private static var _i:LanGameModel;
      
      public var playerName:String = "someone";
      
      public function LanGameModel()
      {
         super();
      }
      
      public static function get I() : LanGameModel
      {
         if(!_i)
         {
            _i = new LanGameModel();
         }
         return _i;
      }
   }
}

