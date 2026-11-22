package net.play5d.game.bvn.win.utils
{
   import net.play5d.game.bvn.win.ctrls.LANServerCtrl;
   import net.play5d.game.bvn.win.data.LanGameModel;
   
   public class SocketMsgFactory
   {
      
      public function SocketMsgFactory()
      {
         super();
      }
      
      public static function createFindHostMsg() : Object
      {
         var _loc1_:Object = {};
         _loc1_.type = "FIND_HOST";
         return _loc1_;
      }
      
      public static function createFindHostBackMsg() : Object
      {
         var _loc1_:Object = {};
         _loc1_.type = "FIND_HOST_BACK";
         _loc1_.host = LANServerCtrl.I.host.toJson();
         return _loc1_;
      }
      
      public static function createJoinMsg() : Object
      {
         var _loc1_:Object = {};
         _loc1_.type = "JOIN";
         _loc1_.name = LanGameModel.I.playerName;
         return _loc1_;
      }
      
      public static function createJoinSuccMsg() : Object
      {
         var _loc1_:Object = {};
         _loc1_.type = "JOIN_BACK";
         _loc1_.success = true;
         return _loc1_;
      }
      
      public static function createJoinInMsg() : Object
      {
         var _loc1_:Object = {};
         _loc1_.type = "JOIN_IN";
         _loc1_.name = LanGameModel.I.playerName;
         return _loc1_;
      }
      
      public static function createJoinFailMsg(param1:String = null) : Object
      {
         var _loc2_:Object = {};
         _loc2_.type = "JOIN_BACK";
         _loc2_.success = false;
         _loc2_.msg = param1;
         return _loc2_;
      }
      
      public static function createKickOutMsg(param1:String = null) : Object
      {
         var _loc2_:Object = {};
         _loc2_.type = "KICK_OUT";
         _loc2_.msg = param1;
         return _loc2_;
      }
      
      public static function createChart(param1:String, param2:String) : Object
      {
         var _loc3_:Object = {};
         _loc3_.type = "CHART";
         _loc3_.msg = param1;
         _loc3_.name = param2;
         return _loc3_;
      }
      
      public static function createStartGame() : Object
      {
         var _loc1_:Object = {};
         _loc1_.type = "START_GAME";
         return _loc1_;
      }
   }
}

