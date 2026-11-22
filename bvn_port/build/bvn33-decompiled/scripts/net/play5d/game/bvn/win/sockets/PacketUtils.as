package net.play5d.game.bvn.win.sockets
{
   import flash.utils.ByteArray;
   
   public class PacketUtils
   {
      
      public function PacketUtils()
      {
         super();
      }
      
      public static function createByteArrayWithHead(param1:*) : ByteArray
      {
         var _loc2_:ByteArray = new ByteArray();
         _loc2_.position = 2;
         _loc2_.writeObject(param1);
         _loc2_.position = 0;
         _loc2_.writeShort(_loc2_.bytesAvailable - 2);
         _loc2_.position = 0;
         return _loc2_;
      }
      
      public static function addByteArrayHead(param1:ByteArray) : ByteArray
      {
         param1.position = 0;
         var _loc3_:int = int(param1.bytesAvailable);
         if(_loc3_ < 0)
         {
            return null;
         }
         var _loc2_:ByteArray = new ByteArray();
         _loc2_.writeShort(_loc3_);
         _loc2_.writeBytes(param1,0,param1.bytesAvailable);
         _loc2_.position = 0;
         return _loc2_;
      }
      
      public static function compress(param1:ByteArray) : void
      {
      }
      
      public static function uncompress(param1:ByteArray) : void
      {
      }
   }
}

