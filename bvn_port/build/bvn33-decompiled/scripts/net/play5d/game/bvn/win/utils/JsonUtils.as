package net.play5d.game.bvn.win.utils
{
   public class JsonUtils
   {
      
      public function JsonUtils()
      {
         super();
      }
      
      public static function isJsonString(param1:Object) : Boolean
      {
         var _loc2_:String = null;
         if(param1 is String)
         {
            _loc2_ = param1 as String;
            return _loc2_.charAt(0) == "{" || _loc2_.charAt(0) == "[";
         }
         return false;
      }
      
      public static function str2json(param1:Object) : Object
      {
         var _loc2_:Object = null;
         if(isJsonString(param1))
         {
            try
            {
               _loc2_ = JSON.parse(param1 as String);
            }
            catch(e:Error)
            {
               trace(e);
            }
            return _loc2_;
         }
         return null;
      }
   }
}

