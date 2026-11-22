package net.play5d.game.bvn.ctrl
{
   import flash.media.Sound;
   import flash.media.SoundTransform;
   import net.play5d.kyo.loader.KyoSoundLoader;
   import net.play5d.kyo.sound.KyoBGSounder;
   import net.play5d.kyo.utils.KyoRandom;
   
   public class SoundCtrl
   {
      
      private static var _i:SoundCtrl;
      
      private var _bgSound:KyoBGSounder;
      
      private var _soundLoader:KyoSoundLoader;
      
      private var _bgmObj:Object;
      
      private var _bgmPaused:Boolean = false;
      
      private var _waitingSound:Object;
      
      private var _sndTransform:SoundTransform = new SoundTransform();
      
      public function SoundCtrl()
      {
         super();
      }
      
      public static function get I() : SoundCtrl
      {
         if(!_i)
         {
            _i = new SoundCtrl();
         }
         return _i;
      }
      
      public function setSoundVolumn(param1:Number) : void
      {
         _sndTransform.volume = param1;
      }
      
      public function setBgmVolumn(param1:Number) : void
      {
         if(!_bgSound)
         {
            _bgSound = new KyoBGSounder();
         }
         _bgSound.volume = param1;
      }
      
      public function playAssetSound(param1:String, param2:Number = 1) : void
      {
         var _loc4_:SoundTransform = null;
         if(param1 == null)
         {
            return;
         }
         var _loc3_:Sound = AssetManager.I.getSound(param1);
         if(_loc3_)
         {
            _loc4_ = _sndTransform;
            if(param2 != 1)
            {
               _loc4_ = new SoundTransform(param2 * _sndTransform.volume);
            }
            _loc3_.play(0,0,_loc4_);
         }
      }
      
      public function playEffectSound(param1:String, param2:Number = 1) : void
      {
         var _loc4_:SoundTransform = null;
         if(param1 == null)
         {
            return;
         }
         var _loc3_:Sound = AssetManager.I.getEffect(param1);
         if(_loc3_)
         {
            _loc4_ = _sndTransform;
            if(param2 != 1)
            {
               _loc4_ = new SoundTransform(param2 * _sndTransform.volume);
            }
            _loc3_.play(0,0,_loc4_);
         }
      }
      
      public function playAssetSoundRandom(... rest) : void
      {
         var _loc2_:String = KyoRandom.getRandomInArray(rest);
         playAssetSound(_loc2_);
      }
      
      public function playSwcSound(param1:Class) : void
      {
         var _loc2_:Sound = new param1();
         _loc2_.play(0,0,_sndTransform);
      }
      
      public function BGM(param1:Object) : void
      {
         if(_bgmPaused)
         {
            _waitingSound = param1;
            return;
         }
         if(!_bgSound)
         {
            _bgSound = new KyoBGSounder();
         }
         if(_bgSound.sound == param1)
         {
            return;
         }
         if(_bgSound.playing)
         {
            _bgSound.stop();
         }
         if(param1)
         {
            _bgSound.play(param1);
         }
      }
      
      public function pauseBGM() : void
      {
         if(_bgmPaused)
         {
            return;
         }
         _bgmPaused = true;
         if(_bgSound)
         {
            _bgSound.pause();
         }
      }
      
      public function resumeBGM() : void
      {
         if(!_bgmPaused)
         {
            return;
         }
         _bgmPaused = false;
         if(_waitingSound)
         {
            BGM(_waitingSound);
            _waitingSound = null;
            return;
         }
         if(_bgSound)
         {
            _bgSound.resume();
         }
      }
      
      public function loadFightBGM(param1:Array, param2:Function, param3:Function = null, param4:Function = null) : void
      {
         var o:Object;
         var curUrl:String;
         var sndLen:int;
         var arr:Array = param1;
         var success:Function = param2;
         var fail:Function = param3;
         var process:Function = param4;
         var loadNext:* = function():void
         {
            if(urls.length < 1)
            {
               if(success != null)
               {
                  success();
               }
               return;
            }
            curUrl = urls.shift();
            AssetManager.I.loadSound(curUrl,loadBack,loadFail,loadProcess);
         };
         var loadBack:* = function(param1:Sound):void
         {
            _soundLoader.addSound(curUrl,param1);
            loadNext();
         };
         var loadFail:* = function():void
         {
            trace("SoundCtrl.loadFightBGM fail!",curUrl);
            loadNext();
         };
         var loadProcess:* = function(param1:Number):void
         {
            var _loc3_:Number = NaN;
            var _loc2_:Number = NaN;
            if(process != null)
            {
               _loc3_ = sndLen - urls.length - 1 + param1;
               _loc2_ = _loc3_ / sndLen;
               process(param1);
            }
         };
         _bgmObj = {};
         var urls:Array = [];
         for each(o in arr)
         {
            _bgmObj[o.id] = o;
            urls.push(o.url);
         }
         _soundLoader = new KyoSoundLoader();
         sndLen = int(urls.length);
         loadNext();
      }
      
      public function playFightBGM(param1:String) : void
      {
         var _loc3_:Object = _bgmObj[param1];
         if(param1 == "map")
         {
            if(_loc3_ == null)
            {
               return;
            }
         }
         else
         {
            if(_loc3_ == null)
            {
               playFightBGM("map");
               return;
            }
            if(Math.random() > Number(_loc3_.rate))
            {
               playFightBGM("map");
               return;
            }
         }
         var _loc2_:Sound = _soundLoader.getSound(_loc3_.url);
         BGM(_loc2_);
      }
      
      public function unloadFightBGM() : void
      {
         BGM(null);
         if(_soundLoader)
         {
            _soundLoader.unload();
            _soundLoader = null;
         }
      }
      
      public function sndSelect() : void
      {
         playSwcSound(snd_menu1);
      }
      
      public function sndConfrim() : void
      {
         playSwcSound(snd_menu2);
      }
   }
}

