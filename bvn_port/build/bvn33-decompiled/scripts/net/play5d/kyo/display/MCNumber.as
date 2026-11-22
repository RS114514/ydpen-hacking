package net.play5d.kyo.display
{
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   
   public class MCNumber extends Sprite
   {
      
      public var mcWidth:Number = -1;
      
      public var startFrame:int;
      
      protected var _mc:Class;
      
      protected var _mcs:Array = [];
      
      protected var _number:uint;
      
      protected var _bits:uint;
      
      public function MCNumber(param1:Class, param2:uint, param3:int = 1, param4:Number = -1, param5:uint = 0)
      {
         super();
         this._mc = param1;
         this._bits = param5;
         this.startFrame = param3;
         this.mcWidth = param4;
         this.number = param2;
      }
      
      public function get number() : uint
      {
         return this._number;
      }
      
      public function set number(param1:uint) : void
      {
         var _loc2_:DisplayObject = null;
         var _loc3_:String = null;
         var _loc5_:* = 0;
         var _loc6_:String = null;
         var _loc7_:DisplayObject = null;
         this._number = param1;
         for each(_loc2_ in this._mcs)
         {
            removeChild(_loc2_);
         }
         this._mcs = [];
         _loc3_ = param1.toString();
         while(_loc3_.length < this._bits)
         {
            _loc3_ = "0" + _loc3_;
         }
         var _loc4_:Number = 0;
         while(_loc5_ < _loc3_.length)
         {
            _loc6_ = _loc3_.charAt(_loc5_);
            _loc7_ = this.createNum(int(_loc6_));
            _loc7_.x = _loc4_;
            _loc4_ += this.mcWidth == -1 ? _loc7_.width : this.mcWidth;
            _loc5_++;
         }
      }
      
      protected function createNum(param1:int) : DisplayObject
      {
         var _loc2_:MovieClip = new this._mc();
         _loc2_.gotoAndStop(this.startFrame + param1);
         addChild(_loc2_);
         this._mcs.push(_loc2_);
         return _loc2_;
      }
   }
}

