package net.play5d.game.bvn.ctrl
{
   import flash.geom.Rectangle;
   import flash.utils.Dictionary;
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.ctrl.game_ctrls.GameCtrl;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.game.bvn.data.GameMode;
   import net.play5d.game.bvn.data.MessionModel;
   import net.play5d.game.bvn.data.MessionStageVO;
   import net.play5d.game.bvn.data.SelectCharListConfigVO;
   import net.play5d.game.bvn.data.SelectCharListItemVO;
   import net.play5d.game.bvn.events.GameEvent;
   import net.play5d.game.bvn.fighter.FighterMain;
   import net.play5d.game.bvn.fighter.events.FighterEventDispatcher;
   import net.play5d.game.bvn.fighter.models.HitVO;
   import net.play5d.game.bvn.interfaces.BaseGameSprite;
   import net.play5d.game.bvn.interfaces.IGameSprite;
   import net.play5d.game.bvn.map.FloorVO;
   import net.play5d.game.bvn.map.MapMain;
   import net.play5d.game.bvn.state.GameCamera;
   import net.play5d.game.bvn.ui.select.SelectIndexUI;
   import net.play5d.game.bvn.utils.ResUtils;
   
   public class GameLogic
   {
      
      private static var _map:MapMain;
      
      private static var _camera:GameCamera;
      
      private static var _floorContact:Dictionary = new Dictionary();
      
      private static var _hitsObj:Object = {};
      
      public function GameLogic()
      {
         super();
      }
      
      public static function initGameLogic(param1:MapMain, param2:GameCamera) : void
      {
         _map = param1;
         _camera = param2;
      }
      
      public static function clear() : void
      {
         _map = null;
         _camera = null;
      }
      
      public static function isInAir(param1:BaseGameSprite) : Boolean
      {
         if(!_map)
         {
            trace("error:map is null!");
            return false;
         }
         if(param1.getVecY() < 0)
         {
            param1.isTouchBottom = false;
            return true;
         }
         if(param1.y > _map.playerBottom - 12)
         {
            param1.y = _map.playerBottom;
            param1.isTouchBottom = true;
            return false;
         }
         param1.isTouchBottom = false;
         var _loc2_:Boolean = param1.getVecY() < 5 * GameConfig.SPEED_PLUS;
         if(!_loc2_)
         {
            return true;
         }
         var _loc4_:Number = 10 * GameConfig.SPEED_PLUS_DEFAULT;
         var _loc3_:FloorVO = _floorContact[param1];
         if(_loc3_)
         {
            if(_loc3_.hitTest(param1.x,param1.y,_loc4_))
            {
               param1.y = _loc3_.y;
               return false;
            }
            delete _floorContact[param1];
            return true;
         }
         _loc3_ = _map.getFloorHitTest(param1.x,param1.y,_loc4_);
         if(_loc3_)
         {
            param1.y = _loc3_.y;
            _floorContact[param1] = _loc3_;
            return false;
         }
         return true;
      }
      
      public static function isTouchBottomFloor(param1:IGameSprite) : Boolean
      {
         if(!_map)
         {
            trace("error:map is null!");
            return false;
         }
         return param1.y > _map.playerBottom;
      }
      
      public static function isOutRange(param1:IGameSprite) : Boolean
      {
         if(!_map)
         {
            trace("error:map is null!");
            return false;
         }
         var _loc2_:int = 20;
         return param1.x > _map.right + _loc2_ || param1.x < _map.left - _loc2_ || param1.y > _map.bottom + _loc2_;
      }
      
      public static function addHits(param1:Object, param2:Object, param3:int) : int
      {
         if(_hitsObj[param1] == undefined)
         {
            _hitsObj[param1] = {
               "hits":0,
               "targetID":param2,
               "uiID":param3
            };
         }
         _hitsObj[param1].targetID = param2;
         _hitsObj[param1].hits++;
         return _hitsObj[param1].hits;
      }
      
      public static function clearHits(param1:Object) : void
      {
         _hitsObj[param1].hits = 0;
         _hitsObj[param1].targetID = null;
         _hitsObj[param1].uiID = null;
      }
      
      public static function getHitsObj(param1:Object) : Object
      {
         return _hitsObj[param1];
      }
      
      public static function getHitsObjByTargetId(param1:Object) : Object
      {
         for each(var _loc2_:Object in _hitsObj)
         {
            if(_loc2_.targetID == param1)
            {
               return _loc2_;
            }
         }
         return null;
      }
      
      public static function clearHitsByTargetId(param1:Object) : void
      {
         for(var _loc2_:String in _hitsObj)
         {
            if(_hitsObj[_loc2_].targetID == param1)
            {
               delete _hitsObj[_loc2_];
            }
         }
      }
      
      public static function checkFighterDie(param1:FighterMain) : Boolean
      {
         if(GameMode.currentMode == 40)
         {
            return false;
         }
         return param1.hp <= 0;
      }
      
      public static function hitTarget(param1:HitVO, param2:IGameSprite, param3:IGameSprite) : void
      {
         if(!param2 || !param3)
         {
            return;
         }
         if(param2 is FighterMain == false)
         {
            return;
         }
         if(param3 is FighterMain == false)
         {
            return;
         }
         if((param3 as FighterMain).actionState != 21 && (param3 as FighterMain).actionState != 22)
         {
            return;
         }
         var _loc4_:Object = {};
         _loc4_.target = param3;
         _loc4_.hitvo = param1;
         FighterEventDispatcher.dispatchEvent(param2 as FighterMain,"HIT_TARGET",_loc4_);
      }
      
      public static function addScoreByHitTarget(param1:HitVO) : void
      {
         var _loc4_:int;
         var _loc5_:int = _loc4_ = param1.power;
         if(param1.isBisha())
         {
            _loc5_ = _loc4_ * 2;
         }
         if(param1.id == "sh1" || param1.id == "sh2")
         {
            _loc5_ += 500;
         }
         if(param1.isBreakDef)
         {
            _loc5_ += 200;
         }
         if(param1.hurtType == 1)
         {
            _loc5_ += 200;
         }
         var _loc3_:Object = getHitsObj(1);
         var _loc2_:int = int(_loc3_ ? _loc3_.hits : 0);
         if(_loc2_ < 4)
         {
            _loc5_ += _loc2_ * 50;
         }
         else
         {
            _loc5_ += _loc2_ * 100;
         }
         addScore(_loc5_);
         GameEvent.dispatchEvent("SCORE_UPDATE");
      }
      
      public static function addScoreByKO() : void
      {
         var _loc1_:int = 0;
         if(GameCtrl.I.gameRunData.p1FighterGroup.currentFighter.lastHitVO && GameCtrl.I.gameRunData.p1FighterGroup.currentFighter.lastHitVO.isBisha())
         {
            addScore(2000);
         }
         if(GameCtrl.I.gameRunData.p1FighterGroup.currentFighter.hp == GameCtrl.I.gameRunData.p1FighterGroup.currentFighter.hpMax)
         {
            addScore(20000);
         }
         else
         {
            addScore(3000);
         }
         GameEvent.dispatchEvent("SCORE_UPDATE");
      }
      
      public static function addScoreByPassMission() : void
      {
         if(GameMode.currentMode == 10 && GameCtrl.I.gameRunData.p1FighterGroup.currentFighter == GameCtrl.I.gameRunData.p1FighterGroup.fighter1)
         {
            addScore(15000);
         }
         else
         {
            addScore(5000);
         }
      }
      
      private static function addScore(param1:int) : void
      {
         var _loc2_:Number = GameData.I.config.keyInputMode == 0 ? 1 : 0.8;
         GameData.I.score += param1 * _loc2_;
      }
      
      public static function loseScoreByContinue() : void
      {
         GameData.I.score -= 10000;
         if(GameData.I.score < 0)
         {
            GameData.I.score = 0;
         }
      }
      
      public static function fixGameSpritePosition(param1:IGameSprite) : void
      {
         var _loc7_:Number = NaN;
         var _loc9_:Number = NaN;
         var _loc5_:Number = NaN;
         var _loc4_:Number = NaN;
         var _loc6_:Rectangle = null;
         var _loc3_:Number = NaN;
         var _loc2_:Number = NaN;
         var _loc8_:Boolean = false;
         if(param1.allowCrossMapXY() == false)
         {
            _loc7_ = _map.left + 10;
            _loc9_ = _map.right - 10;
            _loc5_ = 10;
            _loc4_ = _camera.getZoom();
            _loc6_ = _camera.getScreenRect();
            if(param1 is FighterMain)
            {
               if((param1 as FighterMain).getVecX() != 0)
               {
                  if(_loc4_ == _camera.autoZoomMin)
                  {
                     _loc3_ = _loc6_.x / _loc4_ + _loc5_;
                     _loc2_ = _loc3_ + _loc6_.width - _loc5_;
                     if(_loc7_ < _loc3_)
                     {
                        _loc7_ = _loc3_;
                     }
                     if(_loc9_ > _loc2_)
                     {
                        _loc9_ = _loc2_;
                     }
                  }
               }
            }
            _loc8_ = false;
            if(param1.x <= _loc7_)
            {
               param1.x = _loc7_;
               _loc8_ = true;
            }
            if(param1.x >= _loc9_)
            {
               param1.x = _loc9_;
               _loc8_ = true;
            }
            param1.setIsTouchSide(_loc8_);
         }
         if(param1.allowCrossMapBottom() == false)
         {
            if(param1.y > _map.bottom)
            {
               param1.y = _map.bottom;
            }
         }
      }
      
      public static function resetFighterHP(param1:FighterMain) : void
      {
         var _loc2_:Number = 1;
         if(GameMode.isAcrade() && MessionModel.I.getCurrentMessionStage())
         {
            _loc2_ = MessionModel.I.getCurrentMessionStage().hpRate;
         }
         if(param1.customHpMax > 0)
         {
            param1.hp = param1.hpMax = param1.customHpMax * GameData.I.config.fighterHP * _loc2_;
         }
         else
         {
            param1.hp = param1.hpMax = 1000 * GameData.I.config.fighterHP * _loc2_;
         }
         param1.isAlive = true;
      }
      
      public static function setMessionEnemyAttack(param1:FighterMain) : void
      {
         var _loc2_:MessionStageVO = MessionModel.I.getCurrentMessionStage();
         if(_loc2_)
         {
            param1.attackRate = _loc2_.attackRate;
         }
      }
      
      public static function canSelectFighter(param1:String) : Boolean
      {
         var _loc3_:SelectCharListConfigVO = GameData.I.config.select_config.charList;
         for each(var _loc2_:SelectCharListItemVO in _loc3_.list)
         {
            if(_loc2_.fighterID == param1)
            {
               return true;
            }
         }
         return false;
      }
      
      public static function canSelectAssist(param1:String) : Boolean
      {
         var _loc3_:SelectCharListConfigVO = GameData.I.config.select_config.assistList;
         for each(var _loc2_:SelectCharListItemVO in _loc3_.list)
         {
            if(_loc2_.fighterID == param1)
            {
               return true;
            }
         }
         return false;
      }
      
      public static function setGameMode(param1:int) : void
      {
         if(param1 == 1)
         {
            GameData.I.loadSelect("assets/config/salect.xml");
            ResUtils.WINNER = "winner_stg_mc2";
            SelectIndexUI.SHOW_MODE = 1;
         }
         else
         {
            GameData.I.loadSelect("assets/config/select.xml");
            ResUtils.WINNER = "winner_stg_mc";
            SelectIndexUI.SHOW_MODE = 0;
         }
      }
   }
}

