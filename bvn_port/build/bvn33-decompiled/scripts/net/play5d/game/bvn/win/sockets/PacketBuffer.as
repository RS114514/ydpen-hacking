package net.play5d.game.bvn.win.sockets
{
   import flash.utils.ByteArray;
   
   public class PacketBuffer
   {
      
      private var buf:ByteArray = new ByteArray();
      
      public function PacketBuffer()
      {
         super();
      }
      
      public function push(param1:ByteArray) : void
      {
         if(buf == null)
         {
            buf = param1;
         }
         else
         {
            buf.position = buf.length;
            buf.writeBytes(param1);
         }
      }
      
      public function getPackets() : Array
      {
         var _loc3_:uint = 0;
         var _loc1_:ByteArray = null;
         var _loc2_:ByteArray = null;
         var _loc4_:Array = [];
         buf.position = 0;
         while(buf.bytesAvailable >= 2)
         {
            _loc3_ = uint(buf.readShort());
            if(buf.bytesAvailable < _loc3_)
            {
               _loc1_ = new ByteArray();
               _loc1_.writeBytes(buf,0,buf.bytesAvailable);
               buf = _loc1_;
               return _loc4_;
            }
            _loc2_ = new ByteArray();
            buf.readBytes(_loc2_,0,_loc3_);
            _loc2_.position = 0;
            _loc4_.push(_loc2_);
         }
         if(buf.bytesAvailable <= 0)
         {
            buf = null;
         }
         return _loc4_;
      }
      
      public function clear() : void
      {
         buf = null;
      }
   }
}

