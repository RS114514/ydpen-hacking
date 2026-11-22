package net.play5d.game.bvn.data
{
   import net.play5d.game.bvn.ctrl.GameLogic;
   
   public class MessionModel
   {
      
      private static var _i:MessionModel;
      
      public var AI_LEVEL:int = 6;
      
      private var _curMession:MessionVO;
      
      private var _curStageId:int;
      
      private var _curStage:MessionStageVO;
      
      private var _messions:Array;
      
      public function MessionModel()
      {
         super();
      }
      
      public static function get I() : MessionModel
      {
         if(!_i)
         {
            _i = new MessionModel();
         }
         return _i;
      }
      
      public function initByXML(param1:XML) : void
      {
         var _loc2_:MessionVO = null;
         _messions = [];
         for each(var _loc3_:XML in param1.design)
         {
            _loc2_ = new MessionVO();
            _loc2_.initByXML(_loc3_);
            _messions.push(_loc2_);
         }
      }
      
      public function getMession(param1:int, param2:int) : MessionVO
      {
         for each(var _loc3_:MessionVO in _messions)
         {
            if(_loc3_.comicType == param1 && _loc3_.gameMode == param2)
            {
               return _loc3_;
            }
         }
         return null;
      }
      
      public function getCurrentMessionStage() : MessionStageVO
      {
         return _curStage;
      }
      
      public function initMession() : void
      {
         var _loc5_:int = 0;
         var _loc4_:FighterVO = FighterModel.I.getFighter(GameData.I.p1Select.fighter1);
         var _loc1_:int = GameMode.isTeamMode() ? 0 : 1;
         var _loc3_:MessionVO = getMession(_loc4_.comicType,_loc1_);
         _curMession = _loc3_;
         _curStage = _loc3_.stageList[_curStageId];
         GameData.I.p2Select ||= new SelectVO();
         var _loc2_:Array = _curStage.getFighters();
         while(_loc5_ < _loc2_.length)
         {
            GameData.I.p2Select["fighter" + (_loc5_ + 1)] = _loc2_[_loc5_];
            _loc5_++;
         }
         GameData.I.p2Select.fuzhu = _curStage.assister;
         GameData.I.selectMap = _curStage.map;
         AI_LEVEL = GameData.I.config.AI_level;
         trace("p1::",GameData.I.p1Select.toString());
         trace("p2::",GameData.I.p2Select.toString());
      }
      
      public function reset() : void
      {
         _curStageId = 0;
         _curStage = null;
         _curMession = null;
         GameData.I.score = 0;
      }
      
      public function messionComplete() : void
      {
         if(missionAllComplete())
         {
            trace("mission all over!!!");
            return;
         }
         _curStageId = _curStageId + 1;
         initMession();
         if(GameMode.isAcrade())
         {
            GameLogic.addScoreByPassMission();
         }
      }
      
      public function missionAllComplete() : Boolean
      {
         return _curStageId >= _curMession.stageList.length - 1;
      }
   }
}

