package net.play5d.game.bvn.data
{
   public class MessionVO
   {
      
      public var comicType:int;
      
      public var gameMode:int;
      
      public var stageList:Vector.<MessionStageVO>;
      
      public function MessionVO()
      {
         super();
      }
      
      public function initByXML(param1:XML) : void
      {
         var _loc5_:int = 0;
         var _loc3_:MessionStageVO = null;
         var _loc4_:Object = null;
         var _loc2_:String = null;
         comicType = param1.@comicType;
         gameMode = param1.@gameMode;
         stageList = new Vector.<MessionStageVO>();
         while(_loc5_ < param1.stage.length())
         {
            _loc3_ = new MessionStageVO();
            _loc4_ = param1.stage[_loc5_];
            _loc2_ = _loc4_.@fighter;
            _loc3_.mession = this;
            _loc3_.assister = _loc4_.@assister;
            _loc3_.fighters = _loc2_.split(",");
            _loc3_.map = _loc4_.@map;
            _loc3_.hpRate = Number(_loc4_.@hpRate) > 0 ? Number(_loc4_.@hpRate) : 1;
            _loc3_.attackRate = Number(_loc4_.@attackRate) > 0 ? Number(_loc4_.@attackRate) : 1;
            stageList.push(_loc3_);
            _loc5_++;
         }
      }
   }
}

