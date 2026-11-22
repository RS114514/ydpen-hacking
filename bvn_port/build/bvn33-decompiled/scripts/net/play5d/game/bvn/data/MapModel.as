package net.play5d.game.bvn.data
{
   public class MapModel
   {
      
      private static var _i:MapModel;
      
      private var _mapObj:Object;
      
      private var _mapArray:Array;
      
      public function MapModel()
      {
         super();
      }
      
      public static function get I() : MapModel
      {
         if(!_i)
         {
            _i = new MapModel();
         }
         return _i;
      }
      
      public function getMap(param1:String) : MapVO
      {
         return _mapObj[param1];
      }
      
      public function getAllMaps() : Array
      {
         return _mapArray;
      }
      
      public function initByXML(param1:XML) : void
      {
         var _loc2_:MapVO = null;
         _mapObj = {};
         _mapArray = [];
         for each(var _loc3_:XML in param1.map)
         {
            _loc2_ = new MapVO();
            _loc2_.initByXML(_loc3_);
            _mapObj[_loc2_.id] = _loc2_;
            _mapArray.push(_loc2_);
         }
      }
   }
}

