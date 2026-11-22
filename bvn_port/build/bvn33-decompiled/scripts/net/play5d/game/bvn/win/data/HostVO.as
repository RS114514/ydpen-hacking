package net.play5d.game.bvn.win.data
{
   public class HostVO
   {
      
      public var ip:String;
      
      public var tcpPort:int;
      
      public var udpPort:int;
      
      public var ownerName:String;
      
      public var name:String;
      
      public var password:String;
      
      public var gameMode:int = 1;
      
      public var status:int = 0;
      
      public var updateTime:Date = new Date();
      
      public function HostVO()
      {
         super();
      }
      
      public function toJson() : String
      {
         var _loc2_:Object = {
            "ownerName":ownerName,
            "name":name,
            "password":password,
            "gameMode":gameMode,
            "updateTime":updateTime.time,
            "status":status
         };
         return JSON.stringify(_loc2_);
      }
      
      public function readJson(param1:String) : void
      {
         var _loc2_:Object = JSON.parse(param1);
         ownerName = _loc2_.ownerName;
         name = _loc2_.name;
         password = _loc2_.password;
         gameMode = _loc2_.gameMode;
         updateTime.time = _loc2_.updateTime;
         status = _loc2_.status;
      }
      
      public function getListName() : String
      {
         var _loc1_:String = status == 1 ? "(满)" : "";
         return name;
      }
      
      public function getGameModeStr() : String
      {
         switch(gameMode - 1)
         {
            case 0:
               return "TEAM VS - 小队对战";
            case 1:
               return "SINGLE VS - 单人对战";
            default:
               return null;
         }
      }
   }
}

