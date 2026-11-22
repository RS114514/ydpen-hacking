package net.play5d.game.bvn.win.input
{
   import net.play5d.game.bvn.input.GameKeyInput;
   
   public class InputManager
   {
      
      private static var _i:InputManager;
      
      public var key_menu:GameKeyInput = new GameKeyInput();
      
      public var key_p1:GameKeyInput = new GameKeyInput();
      
      public var key_p2:GameKeyInput = new GameKeyInput();
      
      public var joy_menu:GameJoystickInput = new GameJoystickInput(1);
      
      public var joy_p1:GameJoystickInput = new GameJoystickInput(1);
      
      public var joy_p2:GameJoystickInput = new GameJoystickInput(2);
      
      public var socket_input_p1:GameSocketInput = new GameSocketInput();
      
      public var socket_input_p2:GameSocketInput = new GameSocketInput();
      
      public function InputManager()
      {
         super();
      }
      
      public static function get I() : InputManager
      {
         if(!_i)
         {
            _i = new InputManager();
         }
         return _i;
      }
   }
}

