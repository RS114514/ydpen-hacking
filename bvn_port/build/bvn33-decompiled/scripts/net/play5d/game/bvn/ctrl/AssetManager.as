package net.play5d.game.bvn.ctrl
{
   import flash.display.Bitmap;
   import flash.display.DisplayObject;
   import flash.display.Loader;
   import flash.geom.Point;
   import flash.media.Sound;
   import net.play5d.game.bvn.data.AssisterModel;
   import net.play5d.game.bvn.data.FighterModel;
   import net.play5d.game.bvn.data.FighterVO;
   import net.play5d.game.bvn.data.MapModel;
   import net.play5d.game.bvn.data.MapVO;
   import net.play5d.game.bvn.interfaces.IAssetLoader;
   import net.play5d.game.bvn.utils.BitmapAssetLoader;
   import net.play5d.kyo.display.bitmap.BitmapFont;
   import net.play5d.kyo.display.bitmap.BitmapFontLoader;
   import net.play5d.kyo.loader.KyoClassLoader;
   import net.play5d.kyo.loader.KyoSoundLoader;
   import net.play5d.kyo.utils.KyoUtils;
   
   public class AssetManager
   {
      
      private static var _i:AssetManager;
      
      private var _swfLoader:KyoClassLoader = new KyoClassLoader();
      
      private var _soundLoader:KyoSoundLoader = new KyoSoundLoader();
      
      private var _bitmapLoader:BitmapAssetLoader = new BitmapAssetLoader();
      
      private var _bitmapFontLoader:BitmapFontLoader = new BitmapFontLoader();
      
      private var _assetLoader:IAssetLoader = new AssetLoader();
      
      private const _effectSwfPath:String = "assets/effect.swf";
      
      private var _fighterFaceCache:Object = {};
      
      public function AssetManager()
      {
         super();
      }
      
      public static function get I() : AssetManager
      {
         if(!_i)
         {
            _i = new AssetManager();
         }
         return _i;
      }
      
      public function getFont(param1:String) : BitmapFont
      {
         return _bitmapFontLoader.getFont(param1);
      }
      
      public function setAssetLoader(param1:IAssetLoader) : void
      {
         _assetLoader = param1;
      }
      
      public function loadBasic(param1:Function, param2:Function = null) : void
      {
         var type:String;
         var back:Function = param1;
         var process:Function = param2;
         var loadProcess:* = function(param1:Number):void
         {
            if(process != null)
            {
               process(param1,type,loadStep,loadCount);
            }
         };
         var loadNext:* = function():void
         {
            switch(loadStep)
            {
               case 0:
                  loadPreLoadSounds(loadNext,loadProcess);
                  type = "声音";
                  loadProcess(0);
                  break;
               case 1:
                  loadGraphics(["assets/effect.swf"],loadNext,loadProcess);
                  type = "特效";
                  loadProcess(0);
                  break;
               case 2:
                  loadFonts(loadNext,loadProcess);
                  type = "字体";
                  loadProcess(0);
                  break;
               case 3:
                  loadBitmaps(loadNext,loadProcess);
                  type = "图片";
                  loadProcess(0);
                  break;
               case 4:
                  initAssets();
                  if(back != null)
                  {
                     back();
                  }
            }
            loadStep = loadStep + 1;
         };
         var loadStep:int = 0;
         var loadCount:int = 4;
         loadNext();
      }
      
      private function loadPreLoadSounds(param1:Function, param2:Function) : void
      {
         var back:Function = param1;
         var process:Function = param2;
         _assetLoader.loadXML("assets/config/preload.xml",function(param1:XML):void
         {
            var _loc6_:Array = [];
            var _loc2_:String = param1.bgm.@path;
            var _loc3_:String = param1.sound.@path;
            for each(var _loc5_:XML in param1.bgm.item)
            {
               _loc6_.push(_loc2_ + "/" + _loc5_.toString());
            }
            for each(var _loc4_:XML in param1.sound.item)
            {
               _loc6_.push(_loc3_ + "/" + _loc4_.toString());
            }
            loadSnds(_loc6_,back,process);
         });
      }
      
      private function loadSnds(param1:Array, param2:Function, param3:Function) : void
      {
         var curUrl:String;
         var sounds:Array = param1;
         var back:Function = param2;
         var process:Function = param3;
         var loadNext:* = function():void
         {
            if(snds.length < 1)
            {
               if(back != null)
               {
                  back();
               }
               return;
            }
            curUrl = snds.shift();
            _assetLoader.loadSound(curUrl,loadCom,loadErr,loadProcess);
         };
         var loadCom:* = function(param1:Sound):void
         {
            _soundLoader.addSound(curUrl,param1);
            _assetLoader.dispose(curUrl);
            loadNext();
         };
         var loadErr:* = function():void
         {
            trace("加载声音失败 : " + curUrl);
            loadNext();
         };
         var loadProcess:* = function(param1:Number):void
         {
            var _loc3_:Number = NaN;
            var _loc2_:Number = NaN;
            if(process != null)
            {
               _loc3_ = sndLen - snds.length - 1 + param1;
               _loc2_ = _loc3_ / sndLen;
               process(_loc2_);
            }
         };
         var snds:Array = sounds.concat();
         var sndLen:int = int(snds.length);
         loadNext();
      }
      
      private function initAssets() : void
      {
         var _loc1_:BitmapFont = getFont("font1");
         if(_loc1_)
         {
            _loc1_.charGap = -8;
            _loc1_.spaceGap = 10;
            _loc1_.offsetY = -5;
         }
      }
      
      public function getEffect(param1:String) : *
      {
         var _loc2_:Class = _swfLoader.getClass(param1,"assets/effect.swf");
         return new _loc2_();
      }
      
      public function getSound(param1:String) : Sound
      {
         return _soundLoader.getSound(param1);
      }
      
      public function getFighterFace(param1:FighterVO, param2:Point = null) : DisplayObject
      {
         var _loc3_:Bitmap = _bitmapLoader.getBitmap(param1.faceUrl);
         if(!_loc3_)
         {
            return null;
         }
         if(!param2)
         {
            param2 = new Point(50,50);
         }
         _loc3_.width = param2.x;
         _loc3_.height = param2.y;
         return _loc3_;
      }
      
      public function getFighterFaceBig(param1:FighterVO, param2:Point = null) : DisplayObject
      {
         var _loc3_:Bitmap = _bitmapLoader.getBitmap(param1.faceBigUrl);
         if(!_loc3_)
         {
            return null;
         }
         if(!param2)
         {
            param2 = new Point(245,62);
         }
         _loc3_.width = param2.x;
         _loc3_.height = param2.y;
         return _loc3_;
      }
      
      public function getFighterFaceBar(param1:FighterVO, param2:Point = null) : DisplayObject
      {
         var _loc3_:Bitmap = _bitmapLoader.getBitmap(param1.faceBarUrl);
         if(!_loc3_)
         {
            return null;
         }
         if(!param2)
         {
            param2 = new Point(102,64);
         }
         _loc3_.width = param2.x;
         _loc3_.height = param2.y;
         return _loc3_;
      }
      
      public function getFighterFaceWin(param1:FighterVO, param2:Point = null) : DisplayObject
      {
         if(!param1.faceWinUrl)
         {
            return null;
         }
         var _loc3_:Bitmap = _bitmapLoader.getBitmap(param1.faceWinUrl);
         if(!_loc3_)
         {
            return null;
         }
         if(!param2)
         {
            param2 = new Point(300,250);
         }
         _loc3_.width = param2.x;
         _loc3_.height = param2.y;
         return _loc3_;
      }
      
      public function getMapPic(param1:MapVO, param2:Point = null) : DisplayObject
      {
         var _loc3_:Bitmap = _bitmapLoader.getBitmap(param1.picUrl);
         if(!_loc3_)
         {
            return null;
         }
         if(!param2)
         {
            param2 = new Point(450,240);
         }
         _loc3_.width = param2.x;
         _loc3_.height = param2.y;
         return _loc3_;
      }
      
      public function loadXML(param1:String, param2:Function, param3:Function) : void
      {
         _assetLoader.loadXML(param1,param2,param3);
      }
      
      public function loadSWF(param1:String, param2:Function, param3:Function = null, param4:Function = null) : void
      {
         _assetLoader.loadSwf(param1,param2,param3,param4);
      }
      
      public function loadSound(param1:String, param2:Function, param3:Function = null, param4:Function = null) : void
      {
         _assetLoader.loadSound(param1,param2,param3,param4);
      }
      
      public function loadBitmap(param1:String, param2:Function, param3:Function = null, param4:Function = null) : void
      {
         _assetLoader.loadBitmap(param1,param2,param3,param4);
      }
      
      public function disposeAsset(param1:String) : void
      {
         _assetLoader.dispose(param1);
      }
      
      private function loadGraphics(param1:Array, param2:Function = null, param3:Function = null) : void
      {
         var loadedAmount:int;
         var curUrl:String;
         var loadarray:Array = param1;
         var back:Function = param2;
         var process:Function = param3;
         var loadNext:* = function():void
         {
            if(loads.length < 1)
            {
               if(back != null)
               {
                  back();
               }
               return;
            }
            curUrl = loads.shift();
            _assetLoader.loadSwf(curUrl,loadCom,loadFail,process);
         };
         var loadCom:* = function(param1:Loader):void
         {
            loadedAmount = loadedAmount + 1;
            _swfLoader.addSwf(curUrl,param1);
            _assetLoader.dispose(curUrl);
            loadNext();
         };
         var loadFail:* = function():void
         {
            trace("Error :: " + curUrl + " load fail!");
            loadNext();
         };
         var loads:Array = loadarray.concat();
         loadNext();
      }
      
      private function loadBitmaps(param1:Function = null, param2:Function = null) : void
      {
         var _loc3_:Array = getFighterFaceUrls(FighterModel.I.getAllFighters(),true,true);
         _loc3_ = _loc3_.concat(getFighterFaceUrls(AssisterModel.I.getAllAssisters()));
         _loc3_ = _loc3_.concat(getMapPicUrls(MapModel.I.getAllMaps()));
         KyoUtils.array_deleteSames(_loc3_);
         _bitmapLoader.loadQueue(_loc3_,param1,param2);
      }
      
      private function loadFonts(param1:Function = null, param2:Function = null) : void
      {
         var fontXML:XML;
         var fontBitmapUrl:String;
         var back:Function = param1;
         var process:Function = param2;
         var loadXMLCom:* = function(param1:XML):void
         {
            fontXML = param1;
            var _loc2_:String = param1.pages.page.@file;
            var _loc3_:String = url.substr(0,url.lastIndexOf("/") + 1);
            fontBitmapUrl = _loc3_ + _loc2_;
            _assetLoader.loadBitmap(fontBitmapUrl,bitmapCom,bitmapFail);
         };
         var bitmapCom:* = function(param1:DisplayObject):void
         {
            var _loc2_:Bitmap = param1 as Bitmap;
            _bitmapFontLoader.addFont(fontXML,_loc2_.bitmapData);
            _assetLoader.dispose(fontBitmapUrl);
            if(back != null)
            {
               back();
            }
         };
         var bitmapFail:* = function():void
         {
            trace("字体图片加载失败",url);
         };
         var loadXMLFail:* = function():void
         {
            trace("字体XML加载失败",url);
         };
         var url:String = "assets/font/font1.xml";
         _assetLoader.loadXML(url,loadXMLCom,loadXMLFail);
      }
      
      private function getFighterFaceUrls(param1:Object, param2:Boolean = false, param3:Boolean = false) : Array
      {
         var _loc4_:Array = [];
         for each(var _loc5_:FighterVO in param1)
         {
            if(_loc5_.faceUrl)
            {
               _loc4_.push(_loc5_.faceUrl);
            }
            if(_loc5_.faceBigUrl)
            {
               _loc4_.push(_loc5_.faceBigUrl);
            }
            if(param2 && _loc5_.faceBarUrl)
            {
               _loc4_.push(_loc5_.faceBarUrl);
            }
            if(param3 && _loc5_.faceWinUrl)
            {
               _loc4_.push(_loc5_.faceWinUrl);
            }
         }
         return _loc4_;
      }
      
      private function getMapPicUrls(param1:Object) : Array
      {
         var _loc2_:Array = [];
         for each(var _loc3_:MapVO in param1)
         {
            _loc2_.push(_loc3_.picUrl);
         }
         return _loc2_;
      }
      
      public function needPreLoad() : Boolean
      {
         return _assetLoader.needPreLoad();
      }
      
      public function loadPreLoad(param1:Function, param2:Function = null, param3:Function = null) : void
      {
         _assetLoader.loadPreLoad(param1,param2,param3);
      }
   }
}

