package net.play5d.game.bvn.fighter.ctrler
{
   import flash.media.Sound;
   import flash.media.SoundChannel;
   import flash.media.SoundTransform;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.kyo.utils.KyoRandom;
   
   public class FighterVoiceCtrler
   {
      
      private var _voiceObj:Object = {};
      
      private var _channel:SoundChannel;
      
      private var _curLength:int;
      
      private var _soundTransform:SoundTransform;
      
      public function FighterVoiceCtrler()
      {
         super();
         _soundTransform = new SoundTransform();
         _soundTransform.volume = GameData.I.config.soundVolume;
      }
      
      public function destory() : void
      {
         if(_voiceObj)
         {
            _voiceObj = null;
         }
         if(_channel)
         {
            _channel.stop();
            _channel = null;
         }
      }
      
      public function setVoice(param1:int, param2:Array) : void
      {
         _voiceObj[param1] = param2;
      }
      
      public function playVoice(param1:int, param2:Number = 1) : void
      {
         var _loc4_:Class = null;
         var _loc3_:Sound = null;
         if(_channel && _channel.position < _curLength)
         {
            return;
         }
         if(Math.random() > param2)
         {
            return;
         }
         var _loc5_:Array = _voiceObj[param1];
         if(_loc5_ && _loc5_.length > 0)
         {
            _loc4_ = _loc5_.length > 1 ? KyoRandom.getRandomInArray(_loc5_) : _loc5_[0];
            if(_loc4_)
            {
               _loc3_ = new _loc4_();
               _curLength = _loc3_.length;
               _channel = _loc3_.play(0,0,_soundTransform);
            }
         }
      }
   }
}

