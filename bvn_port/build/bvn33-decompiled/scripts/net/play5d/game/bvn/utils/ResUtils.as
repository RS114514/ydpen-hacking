package net.play5d.game.bvn.utils
{
   import flash.display.BitmapData;
   import flash.display.Sprite;
   import flash.media.SoundTransform;
   import flash.utils.Dictionary;
   import flash.utils.describeType;
   import net.play5d.game.bvn.data.GameData;
   
   public class ResUtils
   {
      
      private static var _i:ResUtils;
      
      public static var SETTING:String = "stg_set_ui";
      
      public static var CONGRATULATIONS:String = "mc_congratulations";
      
      public static var WINNER:String = "winner_stg_mc";
      
      public static var TITLE:String = "stg_title";
      
      public static var GAME_OVER:String = "stg_gameover_mc";
      
      public static var SELECT:String = "stg_select";
      
      public var common_ui:Class = common_ui_swf$a3bf7921c1ba01403bf4dfe7a7fe5c9e1164926403;
      
      public var fight:Class = fight_swf$9ccdf9d2a37e1fb6b6f0df6717a547941873914523;
      
      public var gameover:Class = gameover_swf;
      
      public var howtoplay:Class = howtoplay_swf;
      
      public var loading:Class = loading_swf;
      
      public var select:Class = select_swf;
      
      public var setting:Class = setting_swf;
      
      public var title:Class = title_swf;
      
      private var _swfPool:Dictionary;
      
      private var _initBack:Function;
      
      private var _initError:Function;
      
      private var _inited:Boolean;
      
      private var _initing:Boolean;
      
      public function ResUtils()
      {
         super();
      }
      
      public static function get I() : ResUtils
      {
         if(!_i)
         {
            _i = new ResUtils();
         }
         return _i;
      }
      
      public function initalize(param1:Function = null, param2:Function = null) : void
      {
         var _loc8_:String = null;
         var _loc3_:Class = null;
         var _loc7_:InsSwf = null;
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
         _initError = param2;
         var _loc5_:XML = describeType(this);
         var _loc4_:Object = {};
         for each(var _loc6_:XML in _loc5_.variable)
         {
            _loc8_ = _loc6_.@name;
            _loc3_ = this[_loc8_];
            _loc7_ = new InsSwf(_loc3_);
            _loc7_.ready = swfReadyBack;
            _loc7_.error = swfErrorBack;
            _swfPool[_loc3_] = _loc7_;
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
      
      private function swfErrorBack(param1:String) : void
      {
         if(_initError != null)
         {
            _initError();
         }
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
      
      public function createDisplayObject(param1:Class, param2:String) : *
      {
         var _loc3_:* = undefined;
         var _loc5_:Sprite = null;
         var _loc6_:SoundTransform = null;
         var _loc4_:Class = getItemClass(param1,param2);
         if(_loc4_)
         {
            _loc3_ = new _loc4_();
            if(_loc3_ is Sprite)
            {
               _loc5_ = _loc3_ as Sprite;
               _loc6_ = _loc5_.soundTransform;
               _loc6_.volume = GameData.I.config.soundVolume;
               _loc5_.soundTransform = _loc6_;
               return _loc5_;
            }
            return _loc3_;
         }
      }
      
      public function createBitmapData(param1:Class, param2:String, param3:int, param4:int) : BitmapData
      {
         var _loc5_:Class = getItemClass(param1,param2);
         if(!_loc5_)
         {
            return null;
         }
         return new _loc5_(param3,param4);
      }
      
      public function getItemClass(param1:Class, param2:String) : Class
      {
         if(!_swfPool)
         {
            throw new Error("未进行初始化！");
         }
         var _loc3_:InsSwf = _swfPool[param1];
         if(!_loc3_)
         {
            throw new Error("swf is undefined!");
         }
         return _loc3_.getClass(param2);
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
   
   public var error:Function;
   
   public function InsSwf(param1:Class)
   {
      super();
      _swf = new param1();
      var _loc2_:ByteArray = _swf.movieClipData;
      if(!_loc2_)
      {
         error("未发现swf的movieClipData!");
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
