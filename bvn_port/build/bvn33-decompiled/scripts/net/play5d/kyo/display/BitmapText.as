package net.play5d.kyo.display
{
   import flash.display.Bitmap;
   import flash.display.BitmapData;
   import flash.filters.BitmapFilter;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import flash.text.TextField;
   import flash.text.TextFormat;
   
   public class BitmapText extends Bitmap
   {
      
      public var autoUpdate:Boolean;
      
      private var _tf:TextField;
      
      private var _filers:Array;
      
      public function BitmapText(param1:Boolean = true, param2:uint = 0, param3:Array = null)
      {
         super();
         this.autoUpdate = param1;
         this.smoothing = true;
         this._filers = param3;
         this._tf = new TextField();
         this.color = param2;
      }
      
      override public function set width(param1:Number) : void
      {
         this._tf.width = param1;
      }
      
      override public function set height(param1:Number) : void
      {
         this._tf.height = param1;
      }
      
      public function get textfield() : TextField
      {
         return this._tf;
      }
      
      public function get font() : String
      {
         return this.defaultTextFormat.font;
      }
      
      public function set font(param1:String) : void
      {
         this.defaultTextFormat.font = param1;
         if(this.autoUpdate)
         {
            this.update();
         }
      }
      
      public function get fontSize() : Object
      {
         return this.defaultTextFormat.size;
      }
      
      public function set fontSize(param1:Object) : void
      {
         this.defaultTextFormat.size = param1;
         if(this.autoUpdate)
         {
            this.update();
         }
      }
      
      public function get color() : uint
      {
         return this.defaultTextFormat.color as uint;
      }
      
      public function set color(param1:uint) : void
      {
         this.defaultTextFormat.color = param1;
         if(this.autoUpdate)
         {
            this.update();
         }
      }
      
      public function get align() : String
      {
         return this.defaultTextFormat.align;
      }
      
      public function set align(param1:String) : void
      {
         this.defaultTextFormat.align = param1;
      }
      
      public function get text() : String
      {
         return this._tf.text;
      }
      
      public function set text(param1:String) : void
      {
         this._tf.text = param1;
         if(this.autoUpdate)
         {
            this.update();
         }
      }
      
      public function setTextFormat(param1:TextFormat, param2:int = -1, param3:int = -1) : void
      {
         this._tf.setTextFormat(param1,param2,param3);
         if(this.autoUpdate)
         {
            this.update();
         }
      }
      
      public function get defaultTextFormat() : TextFormat
      {
         if(!this._tf.defaultTextFormat)
         {
            this._tf.defaultTextFormat = new TextFormat();
         }
         return this._tf.defaultTextFormat;
      }
      
      public function set defaultTextFormat(param1:TextFormat) : void
      {
         this._tf.defaultTextFormat = param1;
         if(this.autoUpdate)
         {
            this.update();
         }
      }
      
      public function get textWidth() : Number
      {
         return this._tf.width;
      }
      
      public function set textWidth(param1:Number) : void
      {
         this._tf.width = param1;
      }
      
      public function get textHeight() : Number
      {
         return this._tf.height;
      }
      
      public function set textHeight(param1:Number) : void
      {
         this._tf.height = param1;
      }
      
      public function update() : void
      {
         var _loc2_:BitmapFilter = null;
         if(!this._tf)
         {
            return;
         }
         this._tf.height = this._tf.textHeight + 10;
         this._tf.defaultTextFormat = this.defaultTextFormat;
         var _loc1_:BitmapData = new BitmapData(this._tf.width + 10,this._tf.height,true,0);
         _loc1_.draw(this._tf);
         if(this._filers)
         {
            for each(_loc2_ in this._filers)
            {
               _loc1_.applyFilter(_loc1_,new Rectangle(0,0,_loc1_.width,_loc1_.height),new Point(),_loc2_);
            }
         }
         if(bitmapData)
         {
            bitmapData.dispose();
         }
         bitmapData = _loc1_;
      }
      
      public function destory() : void
      {
         try
         {
            parent.removeChild(this);
         }
         catch(e:Error)
         {
         }
         bitmapData.dispose();
         this._tf = null;
      }
   }
}

