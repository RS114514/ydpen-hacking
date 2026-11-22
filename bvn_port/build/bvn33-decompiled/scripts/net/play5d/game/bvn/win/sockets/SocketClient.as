package net.play5d.game.bvn.win.sockets
{
   import flash.events.Event;
   import flash.events.EventDispatcher;
   import flash.events.IOErrorEvent;
   import flash.events.ProgressEvent;
   import flash.net.Socket;
   import flash.utils.ByteArray;
   import net.play5d.game.bvn.win.sockets.events.SocketEvent;
   
   public class SocketClient extends EventDispatcher
   {
      
      private var _clientSocket:Socket;
      
      public var isConnected:Boolean;
      
      private var _packetBuffer:PacketBuffer;
      
      public function SocketClient()
      {
         super();
         _clientSocket = new Socket();
         _clientSocket.objectEncoding = 3;
         _clientSocket.addEventListener("connect",onConnect);
         _clientSocket.addEventListener("close",onClose);
         _clientSocket.addEventListener("ioError",onError);
         _clientSocket.addEventListener("socketData",onSocketData);
         _packetBuffer = new PacketBuffer();
      }
      
      public function getSocketServer() : String
      {
         return _clientSocket.remoteAddress + ":" + _clientSocket.remotePort;
      }
      
      public function connect(param1:String, param2:int) : void
      {
         log("开始连接服务器 :: " + param1 + ":" + param2);
         _clientSocket.connect(param1,param2);
      }
      
      public function close() : void
      {
         log("关闭链接");
         try
         {
            _clientSocket.close();
         }
         catch(e:Error)
         {
            trace(e);
         }
      }
      
      private function onConnect(param1:Event) : void
      {
         log("成功连接服务器!");
         log("Connection from " + _clientSocket.remoteAddress + ":" + _clientSocket.remotePort);
         isConnected = true;
         dispatchEvent(new SocketEvent("SocketEvent_CLIENT_CONNECT"));
      }
      
      private function onClose(param1:Event) : void
      {
         log("服务器断开!");
         isConnected = false;
         dispatchEvent(new SocketEvent("SocketEvent_CLOSE"));
      }
      
      private function onSocketData(param1:ProgressEvent) : void
      {
         var _loc5_:SocketEvent = null;
         var _loc2_:ByteArray = new ByteArray();
         _clientSocket.readBytes(_loc2_,0,_clientSocket.bytesAvailable);
         PacketUtils.uncompress(_loc2_);
         _packetBuffer.push(_loc2_);
         var _loc4_:Array = _packetBuffer.getPackets();
         for each(var _loc3_:ByteArray in _loc4_)
         {
            _loc5_ = new SocketEvent("SocketEvent_RECEIVE_DATA");
            _loc5_.data = _loc3_;
            dispatchEvent(_loc5_);
            log("Received from Server ::" + _loc3_);
         }
      }
      
      public function send(param1:Object) : void
      {
         var _loc2_:ByteArray = null;
         try
         {
            if(_clientSocket != null && _clientSocket.connected)
            {
               if(param1 is ByteArray)
               {
                  _loc2_ = PacketUtils.addByteArrayHead(param1 as ByteArray);
               }
               else
               {
                  _loc2_ = PacketUtils.createByteArrayWithHead(param1);
               }
               if(!_loc2_)
               {
                  return;
               }
               PacketUtils.compress(_loc2_);
               _clientSocket.writeBytes(_loc2_,0,_loc2_.bytesAvailable);
               _clientSocket.flush();
               log("Sent message (" + param1 + " | length:" + _loc2_.length + ") to " + _clientSocket.remoteAddress + ":" + _clientSocket.remotePort);
            }
            else
            {
               log("No socket connection.");
            }
         }
         catch(error:Error)
         {
            log(error.message);
         }
      }
      
      public function sendJSON(param1:Object) : void
      {
         var _loc2_:String = JSON.stringify(param1);
         send(_loc2_);
      }
      
      private function onError(param1:IOErrorEvent) : void
      {
         log(param1.toString());
         isConnected = false;
         var _loc2_:SocketEvent = new SocketEvent("SocketEvent_ERROR");
         _loc2_.error = param1.toString();
         dispatchEvent(_loc2_);
      }
      
      private function log(param1:String) : void
      {
      }
   }
}

