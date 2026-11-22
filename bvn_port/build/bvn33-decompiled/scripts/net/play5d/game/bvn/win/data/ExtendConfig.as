package net.play5d.game.bvn.win.data
{
   import net.play5d.game.bvn.interfaces.IExtendConfig;
   import net.play5d.game.bvn.win.input.JoyStickConfigVO;
   import net.play5d.game.bvn.win.input.JoySticker;
   
   public class ExtendConfig implements IExtendConfig
   {
      
      public var joyMenuConfig:JoyStickConfigVO = new JoyStickConfigVO();
      
      public var joy1Config:JoyStickConfigVO = new JoyStickConfigVO();
      
      public var joy2Config:JoyStickConfigVO = new JoyStickConfigVO();
      
      public var isFullScreen:Boolean = true;
      
      private var _isInitDefaultJoystick:Boolean;
      
      public function ExtendConfig()
      {
         super();
      }
      
      public function toSaveObj() : Object
      {
         var _loc1_:Object = {};
         _loc1_.joy_menu = joyMenuConfig.toObj();
         _loc1_.joy_p1 = joy1Config.toObj();
         _loc1_.joy_p2 = joy2Config.toObj();
         _loc1_.isFullScreen = isFullScreen;
         _loc1_.lan_name = LanGameModel.I.playerName;
         return _loc1_;
      }
      
      public function readSaveObj(param1:Object) : void
      {
         if(!param1)
         {
            return;
         }
         joyMenuConfig.readObj(param1.joy_menu);
         joy1Config.readObj(param1.joy_p1);
         joy2Config.readObj(param1.joy_p2);
         isFullScreen = param1.isFullScreen;
         updateJoyConfig();
         if(param1.lan_name)
         {
            LanGameModel.I.playerName = param1.lan_name;
         }
      }
      
      public function updateJoyConfig() : void
      {
         initDefaultDevices();
         joyMenuConfig.deviceId = joy1Config.deviceId;
      }
      
      private function initDefaultDevices() : void
      {
         if(_isInitDefaultJoystick)
         {
            return;
         }
         trace("initDefaultDevices");
         _isInitDefaultJoystick = true;
         setDefaultDevice(joy1Config,0);
         setDefaultDevice(joy2Config,1);
      }
      
      private function setDefaultDevice(param1:JoyStickConfigVO, param2:int) : void
      {
         if(!param1.deviceIsSet && param1.deviceId == null)
         {
            param1.deviceId = JoySticker.getDeviceId(param2);
         }
      }
   }
}

