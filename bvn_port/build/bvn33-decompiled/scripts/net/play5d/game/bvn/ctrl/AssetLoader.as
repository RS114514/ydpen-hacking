package net.play5d.game.bvn.ctrl
{
   import flash.display.Loader;
   import flash.events.Event;
   import flash.events.IOErrorEvent;
   import flash.events.ProgressEvent;
   import flash.media.Sound;
   import flash.net.URLRequest;
   import net.play5d.game.bvn.interfaces.IAssetLoader;
   import net.play5d.kyo.loader.KyoURLoader;
   
   public class AssetLoader implements IAssetLoader
   {
      
      public function AssetLoader()
      {
         super();
      }
      
      public function loadXML(param1:String, param2:Function, param3:Function = null) : void
      {
         var url:String = param1;
         var back:Function = param2;
         var fail:Function = param3;
         KyoURLoader.load(url,function(param1:String):void
         {
            if(back != null)
            {
               back(new XML(param1));
            }
         },fail);
      }
      
      public function loadSwf(param1:String, param2:Function, param3:Function = null, param4:Function = null) : void
      {
         var url:String = param1;
         var back:Function = param2;
         var fail:Function = param3;
         var process:Function = param4;
         var loadComplete:* = function(param1:Event):void
         {
            loader.contentLoaderInfo.removeEventListener("complete",loadComplete);
            loader.contentLoaderInfo.removeEventListener("ioError",loadError);
            loader.contentLoaderInfo.removeEventListener("progress",loadProcess);
            if(back != null)
            {
               back(loader);
            }
         };
         var loadError:* = function(param1:Event):void
         {
            loader.contentLoaderInfo.removeEventListener("complete",loadComplete);
            loader.contentLoaderInfo.removeEventListener("ioError",loadError);
            loader.contentLoaderInfo.removeEventListener("progress",loadProcess);
            if(fail != null)
            {
               fail();
            }
         };
         var loadProcess:* = function(param1:ProgressEvent):void
         {
            if(process != null)
            {
               process(param1.bytesLoaded / param1.bytesTotal);
            }
         };
         var loader:Loader = new Loader();
         loader.contentLoaderInfo.addEventListener("complete",loadComplete);
         loader.contentLoaderInfo.addEventListener("ioError",loadError);
         loader.contentLoaderInfo.addEventListener("progress",loadProcess);
         loader.load(new URLRequest(url));
      }
      
      public function loadBitmap(param1:String, param2:Function, param3:Function = null, param4:Function = null) : void
      {
         var url:String = param1;
         var back:Function = param2;
         var fail:Function = param3;
         var process:Function = param4;
         var loadComplete:* = function(param1:Event):void
         {
            loader.contentLoaderInfo.removeEventListener("complete",loadComplete);
            loader.contentLoaderInfo.removeEventListener("ioError",loadError);
            loader.contentLoaderInfo.removeEventListener("progress",loadProcess);
            if(back != null)
            {
               back(loader.content);
            }
         };
         var loadError:* = function(param1:Event):void
         {
            loader.contentLoaderInfo.removeEventListener("complete",loadComplete);
            loader.contentLoaderInfo.removeEventListener("ioError",loadError);
            loader.contentLoaderInfo.removeEventListener("progress",loadProcess);
            if(fail != null)
            {
               fail();
            }
         };
         var loadProcess:* = function(param1:ProgressEvent):void
         {
            if(process != null)
            {
               process(param1.bytesLoaded / param1.bytesTotal);
            }
         };
         var loader:Loader = new Loader();
         loader.contentLoaderInfo.addEventListener("complete",loadComplete);
         loader.contentLoaderInfo.addEventListener("ioError",loadError);
         loader.contentLoaderInfo.addEventListener("progress",loadProcess);
         loader.load(new URLRequest(url));
      }
      
      public function loadSound(param1:String, param2:Function, param3:Function = null, param4:Function = null) : void
      {
         var url:String = param1;
         var back:Function = param2;
         var fail:Function = param3;
         var process:Function = param4;
         var loadCom:* = function(param1:Event):void
         {
            sound.removeEventListener("complete",loadCom);
            sound.removeEventListener("ioError",loadErr);
            sound.removeEventListener("progress",loadProcess);
            if(back != null)
            {
               back(sound);
            }
         };
         var loadErr:* = function(param1:IOErrorEvent):void
         {
            sound.removeEventListener("complete",loadCom);
            sound.removeEventListener("ioError",loadErr);
            sound.removeEventListener("progress",loadProcess);
            if(fail != null)
            {
               fail();
            }
         };
         var loadProcess:* = function(param1:ProgressEvent):void
         {
            if(process != null)
            {
               process(param1.bytesLoaded / param1.bytesTotal);
            }
         };
         var sound:Sound = new Sound(new URLRequest(url));
         sound.addEventListener("complete",loadCom);
         sound.addEventListener("ioError",loadErr);
         sound.addEventListener("progress",loadProcess);
      }
      
      public function dispose(param1:String) : void
      {
      }
      
      public function needPreLoad() : Boolean
      {
         return false;
      }
      
      public function loadPreLoad(param1:Function, param2:Function = null, param3:Function = null) : void
      {
      }
   }
}

