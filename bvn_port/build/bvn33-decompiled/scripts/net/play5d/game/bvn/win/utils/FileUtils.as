package net.play5d.game.bvn.win.utils
{
   import flash.filesystem.File;
   import flash.filesystem.FileStream;
   import flash.utils.ByteArray;
   import net.play5d.game.bvn.utils.GameLoger;
   
   public class FileUtils
   {
      
      public function FileUtils()
      {
         super();
      }
      
      public static function writeFile(param1:String, param2:*, param3:String = null) : void
      {
         var _loc5_:File = null;
         var _loc6_:FileStream = null;
         var _loc4_:ByteArray = null;
         if(!param3)
         {
            param3 = "write";
         }
         try
         {
            _loc5_ = new File(param1);
            _loc6_ = new FileStream();
            _loc6_.open(_loc5_,param3);
            if(param2 is String)
            {
               _loc6_.writeUTFBytes(param2);
            }
            if(param2 is ByteArray)
            {
               _loc4_ = param2 as ByteArray;
               _loc6_.writeBytes(_loc4_,0,_loc4_.bytesAvailable);
            }
            _loc6_.close();
         }
         catch(e:Error)
         {
            GameLoger.log("FileUtils.writeFile" + e);
         }
      }
      
      public static function writeAppFloderFile(param1:String, param2:*, param3:String = null) : void
      {
         var _loc4_:String = getAppFloderFileUrl(param1);
         writeFile(_loc4_,param2,param3);
      }
      
      public static function getAppFloderFileUrl(param1:String) : String
      {
         var _loc3_:File = File.applicationDirectory;
         var _loc2_:String = _loc3_.nativePath;
         return _loc2_ + "/" + param1;
      }
      
      public static function createFloder(param1:String) : void
      {
         var _loc2_:File = null;
         try
         {
            _loc2_ = new File(param1);
            _loc2_.createDirectory();
         }
         catch(e:Error)
         {
            GameLoger.log("FileUtils.createFloder" + e);
         }
      }
      
      public static function readTextFile(param1:String) : String
      {
         var _loc2_:String = null;
         var _loc3_:File = null;
         var _loc4_:FileStream = null;
         try
         {
            _loc3_ = new File(param1);
            _loc4_ = new FileStream();
            _loc4_.open(_loc3_,"read");
            _loc2_ = _loc4_.readUTFBytes(_loc4_.bytesAvailable);
            _loc4_.close();
         }
         catch(e:Error)
         {
            GameLoger.log("FileUtils.readTextFile , " + e);
         }
         return _loc2_;
      }
      
      public static function del(param1:String) : void
      {
         var _loc2_:File = new File(param1);
         try
         {
            _loc2_.deleteFile();
         }
         catch(e:Error)
         {
            GameLoger.log("FileUtils.del" + e);
         }
      }
   }
}

