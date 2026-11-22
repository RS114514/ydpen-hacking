package net.play5d.game.bvn.win.sockets.udp
{
   import flash.events.DatagramSocketDataEvent;
   import flash.net.DatagramSocket;
   import flash.net.InterfaceAddress;
   import flash.net.NetworkInfo;
   import flash.net.NetworkInterface;
   import flash.utils.ByteArray;
   
   public class UDPSocket
   {
      
      private var _udpsocket:DatagramSocket;
      
      private var _dataBacks:Vector.<Function>;
      
      private var _onLineClients:Array;
      
      private var _broadCastAddress:String;
      
      public function UDPSocket()
      {
         super();
         trace("DatagramSocket.isSupported = ",DatagramSocket.isSupported);
         _udpsocket = new DatagramSocket();
      }
      
      public function listen(param1:int) : void
      {
         _udpsocket.bind(param1);
         _udpsocket.receive();
      }
      
      public function unListen() : void
      {
         _udpsocket.close();
      }
      
      public function addDataHandler(param1:Function) : void
      {
         if(!_dataBacks)
         {
            _dataBacks = new Vector.<Function>();
         }
         if(_dataBacks.indexOf(param1) == -1)
         {
            _dataBacks.push(param1);
         }
         if(_udpsocket.hasEventListener("data"))
         {
            return;
         }
         _udpsocket.addEventListener("data",dataHandler);
      }
      
      public function removeDataHandler(param1:Function) : void
      {
         var _loc2_:int = _dataBacks.indexOf(param1);
         if(_loc2_ != -1)
         {
            _dataBacks.splice(_loc2_,1);
         }
      }
      
      private function dataHandler(param1:DatagramSocketDataEvent) : void
      {
         var _loc5_:ByteArray = null;
         var _loc4_:UDPDataVO = new UDPDataVO();
         _loc4_.fromIP = param1.srcAddress;
         _loc4_.fromPort = param1.srcPort;
         var _loc3_:ByteArray = param1.data;
         var _loc6_:int;
         switch((_loc6_ = _loc3_.readByte()) - 1)
         {
            case 0:
               _loc4_.dataType = 2;
               _loc4_.setData(_loc3_.readUTFBytes(_loc3_.bytesAvailable));
               break;
            case 1:
               _loc4_.dataType = 1;
               _loc5_ = new ByteArray();
               _loc5_.writeBytes(_loc3_,1,_loc3_.bytesAvailable);
               _loc5_.position = 0;
               _loc4_.setData(_loc5_);
               break;
            case 2:
               _loc4_.dataType = 3;
               _loc4_.setData(_loc3_.readObject());
         }
         for each(var _loc2_:Function in _dataBacks)
         {
            if(_loc2_ != null)
            {
               _loc2_(_loc4_);
            }
         }
      }
      
      public function send(param1:String, param2:int, param3:Object) : void
      {
         log("UDPCtrler.send",param1,param2,param3);
         var _loc4_:ByteArray = new ByteArray();
         if(param3 is String)
         {
            _loc4_.writeByte(1);
            _loc4_.writeUTFBytes(param3 as String);
         }
         else if(param3 is ByteArray)
         {
            _loc4_.writeByte(2);
            _loc4_.writeBytes(param3 as ByteArray,0,(param3 as ByteArray).bytesAvailable);
         }
         else
         {
            _loc4_.writeByte(3);
            _loc4_.writeObject(param3);
         }
         _udpsocket.send(_loc4_,0,0,param1,param2);
      }
      
      public function sendBroadcast(param1:int, param2:Object) : void
      {
         var _loc3_:Vector.<NetworkInterface> = undefined;
         if(!_broadCastAddress)
         {
            _loc3_ = NetworkInfo.networkInfo.findInterfaces();
            for each(var _loc5_:NetworkInterface in _loc3_)
            {
               if(_loc5_.active)
               {
                  for each(var _loc4_:InterfaceAddress in _loc5_.addresses)
                  {
                     if(_loc4_.broadcast && _loc4_.broadcast != "")
                     {
                        _broadCastAddress = _loc4_.broadcast;
                     }
                  }
               }
            }
         }
         if(_broadCastAddress)
         {
            send(_broadCastAddress,param1,param2);
         }
         else
         {
            trace("获取广播地址失败!");
         }
      }
      
      private function log(... rest) : void
      {
      }
   }
}

