package net.play5d.game.bvn.data
{
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.EffectCtrl;
   import net.play5d.game.bvn.ctrl.SoundCtrl;
   import net.play5d.game.bvn.interfaces.GameInterface;
   import net.play5d.game.bvn.interfaces.IExtendConfig;
   import net.play5d.kyo.utils.KyoUtils;
   
   public class ConfigVO
   {
      
      public const key_menu:KeyConfigVO = new KeyConfigVO(0);
      
      public const key_p1:KeyConfigVO = new KeyConfigVO(1);
      
      public const key_p2:KeyConfigVO = new KeyConfigVO(2);
      
      public var select_config:SelectStageConfigVO = new SelectStageConfigVO();
      
      public var AI_level:int = 1;
      
      public var fighterHP:Number = 1;
      
      public var fightTime:int = 60;
      
      public var quality:String = "medium";
      
      public var soundVolume:Number = 0.7;
      
      public var bgmVolume:Number = 0.7;
      
      public var keyInputMode:int = 1;
      
      public var extendConfig:IExtendConfig;
      
      public function ConfigVO()
      {
         super();
         extendConfig = GameInterface.instance.getConfigExtend();
         setDefaultConfig(key_menu);
         setDefaultConfig(key_p1);
         setDefaultConfig(key_p2);
      }
      
      public function setDefaultConfig(param1:KeyConfigVO) : void
      {
         switch(param1.id)
         {
            case 0:
               param1.setKeys(87,83,65,68,74,75,76,85,73,79);
               param1.selects = [74,75,76,85,73,79];
               break;
            case 1:
               param1.setKeys(87,83,65,68,74,75,76,85,73,79);
               break;
            case 2:
               param1.setKeys(38,40,37,39,97,98,99,100,101,102);
         }
      }
      
      public function toSaveObj() : Object
      {
         var _loc1_:Object = {};
         _loc1_.key_p1 = key_p1.toSaveObj();
         _loc1_.key_p2 = key_p2.toSaveObj();
         _loc1_.AI_level = AI_level;
         _loc1_.fighterHP = fighterHP;
         _loc1_.fightTime = fightTime;
         _loc1_.quality = quality;
         _loc1_.keyInputMode = keyInputMode;
         _loc1_.soundVolume = soundVolume;
         _loc1_.bgmVolume = bgmVolume;
         if(extendConfig)
         {
            _loc1_.extend_config = extendConfig.toSaveObj();
         }
         return _loc1_;
      }
      
      public function readSaveObj(param1:Object) : void
      {
         key_p1.readSaveObj(param1.key_p1);
         key_p2.readSaveObj(param1.key_p2);
         if(param1.extend_config && extendConfig)
         {
            extendConfig.readSaveObj(param1.extend_config);
         }
         delete param1["key_p1"];
         delete param1["key_p2"];
         KyoUtils.setValueByObject(this,param1);
      }
      
      public function getValueByKey(param1:String) : *
      {
         if(this.hasOwnProperty(param1))
         {
            return this[param1];
         }
         if(extendConfig)
         {
            try
            {
               return extendConfig[param1];
            }
            catch(e:Error)
            {
               trace(e);
            }
         }
         return null;
      }
      
      public function setValueByKey(param1:String, param2:*) : void
      {
         if(this.hasOwnProperty(param1))
         {
            this[param1] = param2;
            switch(param1)
            {
               case "bgmVolume":
                  SoundCtrl.I.setBgmVolumn(bgmVolume);
                  break;
               case "soundVolume":
                  SoundCtrl.I.setSoundVolumn(soundVolume);
            }
            return;
         }
         if(extendConfig)
         {
            try
            {
               extendConfig[param1] = param2;
            }
            catch(e:Error)
            {
               trace(e);
            }
         }
      }
      
      public function applyConfig() : void
      {
         switch(quality)
         {
            case "low":
               MainGame.I.stage.quality = "low";
               GameConfig.setGameFps(30);
               GameConfig.FPS_SHINE_EFFECT = 15;
               EffectCtrl.EFFECT_SMOOTHING = false;
               break;
            case "medium":
               MainGame.I.stage.quality = "low";
               GameConfig.setGameFps(60);
               GameConfig.FPS_SHINE_EFFECT = 30;
               EffectCtrl.EFFECT_SMOOTHING = false;
               break;
            case "high":
               MainGame.I.stage.quality = "medium";
               GameConfig.setGameFps(60);
               GameConfig.FPS_SHINE_EFFECT = 30;
               EffectCtrl.EFFECT_SMOOTHING = false;
               break;
            case "higher":
               MainGame.I.stage.quality = "high";
               GameConfig.setGameFps(60);
               GameConfig.FPS_SHINE_EFFECT = 30;
               EffectCtrl.EFFECT_SMOOTHING = true;
               break;
            case "best":
               MainGame.I.stage.quality = "high";
               GameConfig.setGameFps(60);
               GameConfig.FPS_SHINE_EFFECT = 60;
               EffectCtrl.EFFECT_SMOOTHING = true;
         }
         GameInterface.instance.applyConfig(this);
         SoundCtrl.I.setBgmVolumn(bgmVolume);
         SoundCtrl.I.setSoundVolumn(soundVolume);
      }
   }
}

