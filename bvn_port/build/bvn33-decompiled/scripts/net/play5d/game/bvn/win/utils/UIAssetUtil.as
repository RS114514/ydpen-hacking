package net.play5d.game.bvn.win.utils
{
   import flash.display.BitmapData;
   import flash.utils.Dictionary;
   import flash.utils.describeType;
   
   public class UIAssetUtil
   {
      
      private static var _i:UIAssetUtil;
      
      public var win_ui:Class = win_ui_swf$3004d27628d8d4a2298f330a250d34e9126528623;
      
      private var _swfPool:Dictionary;
      
      private var _initBack:Function;
      
      private var _inited:Boolean;
      
      private var _initing:Boolean;
      
      public function UIAssetUtil()
      {
         super();
      }
      
      public static function get I() : UIAssetUtil
      {
         if(!_i)
         {
            _i = new UIAssetUtil();
         }
         return _i;
      }
      
      public function initalize(param1:Function = null) : void
      {
         var _loc7_:String = null;
         var _loc2_:Class = null;
         var _loc6_:InsSwf = null;
         if(_initing)
         {
            throw new Error("正在初始化过程中，不能再次初始化！");
         }
         if(_inited)
         {
            if(param1 != null)
            {
               param1();
            }
            return;
         }
         _inited = true;
         _initing = true;
         _swfPool = new Dictionary();
         _initBack = param1;
         var _loc4_:XML = describeType(this);
         var _loc3_:Object = {};
         for each(var _loc5_:XML in _loc4_.variable)
         {
            _loc7_ = _loc5_.@name;
            _loc2_ = this[_loc7_];
            _loc6_ = new InsSwf(_loc2_);
            _loc6_.ready = swfReadyBack;
            _swfPool[_loc2_] = _loc6_;
         }
      }
      
      private function swfReadyBack(param1:InsSwf) : void
      {
         for each(var _loc2_:InsSwf in _swfPool)
         {
            if(!_loc2_.isReady)
            {
               return;
            }
         }
         finish();
      }
      
      private function finish() : void
      {
         _initing = false;
         if(_initBack != null)
         {
            _initBack();
            _initBack = null;
         }
      }
      
      public function createDisplayObject(param1:String) : *
      {
         var _loc2_:Class = getItemClass(param1);
         if(_loc2_)
         {
            return new _loc2_();
         }
      }
      
      public function createBitmapData(param1:String, param2:int, param3:int) : BitmapData
      {
         var _loc4_:Class = getItemClass(param1);
         if(!_loc4_)
         {
            return null;
         }
         return new _loc4_(param2,param3);
      }
      
      public function getItemClass(param1:String) : Class
      {
         if(!_swfPool)
         {
            throw new Error("未进行初始化！");
         }
         var _loc2_:InsSwf = _swfPool[win_ui];
         if(!_loc2_)
         {
            throw new Error("swf is undefined!");
         }
         return _loc2_.getClass(param1);
      }
   }
}

import flash.display.Loader;
import flash.display.LoaderInfo;
import flash.events.Event;
import flash.system.ApplicationDomain;
import flash.system.LoaderContext;
import flash.utils.ByteArray;

class InsSwf
{
   
   private var _swf:*;
   
   private var _domain:ApplicationDomain;
   
   public var isReady:Boolean;
   
   public var ready:Function;
   
   public function InsSwf(param1:Class)
   {
      super();
      _swf = new param1();
      var _loc2_:ByteArray = _swf.movieClipData;
      if(!_loc2_)
      {
         throw new Error("未发现swf的movieClipData!");
      }
      var _loc3_:Loader = new Loader();
      _loc3_.contentLoaderInfo.addEventListener("complete",loadComplete,false,0,true);
      var _loc4_:LoaderContext = new LoaderContext(false,ApplicationDomain.currentDomain);
      _loc4_.allowCodeImport = true;
      _loc3_.loadBytes(_loc2_,_loc4_);
   }
   
   public function getClass(param1:String) : Class
   {
      return _domain.getDefinition(param1) as Class;
   }
   
   private function loadComplete(param1:Event) : void
   {
      var _loc2_:LoaderInfo = param1.currentTarget as LoaderInfo;
      _domain = _loc2_.applicationDomain;
      isReady = true;
      if(ready != null)
      {
         ready(this);
         ready = null;
      }
   }
}
