package net.play5d.game.bvn.data
{
   public class FighterModel
   {
      
      private static var _i:FighterModel;
      
      private var _fighterObj:Object;
      
      public function FighterModel()
      {
         super();
      }
      
      public static function get I() : FighterModel
      {
         if(!_i)
         {
            _i = new FighterModel();
         }
         return _i;
      }
      
      public function getAllFighters() : Object
      {
         return _fighterObj;
      }
      
      public function getFighters(param1:int = -1, param2:Function = null) : Vector.<FighterVO>
      {
         var _loc4_:Vector.<FighterVO> = new Vector.<FighterVO>();
         for each(var _loc3_:FighterVO in _fighterObj)
         {
            if(!(param2 && !param2(_loc3_)))
            {
               if(param1 == -1 || _loc3_.comicType == param1)
               {
                  _loc4_.push(_loc3_);
               }
            }
         }
         return _loc4_;
      }
      
      public function getFighter(param1:String, param2:Boolean = false) : FighterVO
      {
         return _fighterObj[param1];
      }
      
      public function initByXML(param1:XML) : void
      {
         var _loc2_:FighterVO = null;
         _fighterObj = {};
         for each(var _loc3_:XML in param1.fighter)
         {
            _loc2_ = new FighterVO();
            _loc2_.initByXML(_loc3_);
            _fighterObj[_loc2_.id] = _loc2_;
         }
      }
   }
}

