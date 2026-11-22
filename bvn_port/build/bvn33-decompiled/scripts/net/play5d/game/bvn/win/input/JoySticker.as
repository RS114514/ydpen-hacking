package net.play5d.game.bvn.win.input
{
   import flash.events.GameInputEvent;
   import flash.ui.GameInput;
   import flash.ui.GameInputControl;
   import flash.ui.GameInputDevice;
   import net.play5d.game.bvn.win.GameInterfaceManager;
   
   public class JoySticker
   {
      
      private static var _gameInput:GameInput;
      
      private static var _inited:Boolean;
      
      private static var _gameDeivces:Vector.<GameInputDevice>;
      
      private static var _deivceMap:Object;
      
      private static var _downKey:JoyStickSetVO;
      
      public function JoySticker()
      {
         super();
      }
      
      public static function initlize() : void
      {
         if(_inited)
         {
            return;
         }
         trace("JoySticker.initlize");
         if(!GameInput.isSupported)
         {
            trace("该平台不支持手柄！");
            return;
         }
         _inited = true;
         _gameDeivces = new Vector.<GameInputDevice>();
         _deivceMap = {};
         _gameInput = new GameInput();
         _gameInput.addEventListener("deviceAdded",joystickHandler);
         _gameInput.addEventListener("deviceRemoved",joystickHandler);
         _gameInput.addEventListener("deviceUnusable",joystickHandler);
      }
      
      public static function getAllDeivces() : Vector.<GameInputDevice>
      {
         return _gameDeivces;
      }
      
      public static function getDeviceId(param1:int) : String
      {
         if(param1 >= _gameDeivces.length)
         {
            return null;
         }
         var _loc2_:GameInputDevice = _gameDeivces[param1];
         if(_loc2_)
         {
            return _loc2_.id;
         }
         return null;
      }
      
      private static function joystickHandler(param1:GameInputEvent) : void
      {
         switch(param1.type)
         {
            case "deviceAdded":
               trace("connected",param1.device,GameInput.numDevices);
               outputDeviceInfo(param1.device);
               if(GameInput.numDevices < 3)
               {
                  addDeivce(param1.device);
                  GameInterfaceManager.config.updateJoyConfig();
               }
               break;
            case "deviceRemoved":
               trace("disconnected",param1.device);
               removeDevice(param1.device);
               break;
            case "deviceUnusable":
               trace("unuse",param1.device);
               removeDevice(param1.device);
         }
      }
      
      private static function outputDeviceInfo(param1:GameInputDevice) : void
      {
         var _loc3_:int = 0;
         var _loc2_:GameInputControl = null;
         trace("device.enabled - " + param1.enabled);
         trace("device.id - " + param1.id);
         trace("device.name - " + param1.name);
         trace("device.numControls - " + param1.numControls);
         trace("device.sampleInterval - " + param1.sampleInterval);
         trace("device.MAX_BUFFER - 32000");
         trace("buttonNum",param1.numControls);
         while(_loc3_ < param1.numControls)
         {
            _loc2_ = param1.getControlAt(_loc3_);
            trace("button:" + _loc3_ + ":" + _loc2_.id);
            _loc3_++;
         }
      }
      
      private static function addDeivce(param1:GameInputDevice) : void
      {
         param1.enabled = true;
         _gameDeivces.push(param1);
         var _loc2_:String = param1.id;
         _deivceMap[_loc2_] = param1;
         trace("addDevice:" + _loc2_,":",param1.id);
      }
      
      private static function removeDevice(param1:GameInputDevice) : void
      {
         param1.enabled = false;
         var _loc2_:int = _gameDeivces.indexOf(param1);
         if(_loc2_ != -1)
         {
            _gameDeivces.splice(_loc2_,1);
         }
         for(var _loc3_:String in _deivceMap)
         {
            if(_deivceMap[_loc3_] == param1)
            {
               delete _deivceMap[_loc3_];
            }
         }
      }
      
      private static function getDeive(param1:String) : GameInputDevice
      {
         return _deivceMap[param1];
      }
      
      public static function isActive(param1:String) : Boolean
      {
         var _loc2_:GameInputDevice = getDeive(param1);
         return _loc2_ && _loc2_.enabled;
      }
      
      public static function isDown(param1:String, param2:JoyStickSetVO) : Boolean
      {
         var _loc3_:GameInputDevice = getDeive(param1);
         if(!_loc3_)
         {
            return false;
         }
         if(param2.id > _loc3_.numControls)
         {
            return false;
         }
         var _loc4_:GameInputControl = _loc3_.getControlAt(param2.id);
         if(!_loc4_)
         {
            return false;
         }
         if(param2.value > 0)
         {
            return _loc4_.value > 0.5;
         }
         if(param2.value < 0)
         {
            return _loc4_.value < -0.5;
         }
         return false;
      }
      
      public static function isDownAnyKey(param1:String) : Boolean
      {
         var _loc3_:int = 0;
         var _loc2_:GameInputDevice = getDeive(param1);
         if(!_loc2_)
         {
            return false;
         }
         while(_loc3_ < _loc2_.numControls)
         {
            if(checkDownValue(_loc2_,_loc3_))
            {
               return true;
            }
            _loc3_++;
         }
         return false;
      }
      
      public static function getDownKey(param1:String, param2:Boolean) : JoyStickSetVO
      {
         var _loc8_:int = 0;
         var _loc4_:Number = NaN;
         var _loc3_:String = null;
         var _loc6_:String = null;
         var _loc5_:JoyStickSetVO = null;
         var _loc7_:GameInputDevice = getDeive(param1);
         if(!_loc7_)
         {
            return null;
         }
         while(_loc8_ < _loc7_.numControls)
         {
            _loc4_ = checkDownValue(_loc7_,_loc8_);
            if(_loc4_ != 0)
            {
               if(_downKey)
               {
                  _loc3_ = _loc8_ + "_" + _loc4_;
                  _loc6_ = _downKey.id + "_" + _downKey.value;
                  if(_loc6_ == _loc3_)
                  {
                     return param2 ? null : _downKey;
                  }
               }
               _downKey = _loc5_ = new JoyStickSetVO(_loc8_,_loc4_);
               trace("isDown",_loc5_.id + "_" + _loc5_.value);
               return _loc5_;
            }
            _loc8_++;
         }
         return null;
      }
      
      private static function checkDownValue(param1:GameInputDevice, param2:int) : Number
      {
         if(param2 > param1.numControls)
         {
            return 0;
         }
         var _loc4_:GameInputControl = param1.getControlAt(param2);
         if(!_loc4_)
         {
            return 0;
         }
         var _loc3_:Number = _loc4_.value;
         if(_loc3_ == 1 || _loc3_ > 0.5)
         {
            return 1;
         }
         if(_loc3_ < -0.5)
         {
            return -1;
         }
         return 0;
      }
   }
}

