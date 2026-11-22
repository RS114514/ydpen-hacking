package net.play5d.game.bvn.win.utils
{
   import flash.filesystem.File;
   import flash.filesystem.FileStream;
   import net.play5d.game.bvn.interfaces.ILoger;
   
   public class Loger implements ILoger
   {
      
      private static var _file:File;
      
      private static var _fileStream:FileStream;
      
      public function Loger()
      {
         super();
      }
      
      public function log(param1:String) : void
      {
         trace(param1);
         if(!_file)
         {
            _file = new File(File.applicationDirectory.nativePath + "/log.log");
         }
         _fileStream = new FileStream();
         _fileStream.open(_file,"append");
         _fileStream.writeUTFBytes(param1 + "\r\n");
         _fileStream.close();
         _fileStream = null;
      }
   }
}

