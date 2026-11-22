package net.play5d.game.bvn.state
{
   import com.greensock.TweenLite;
   import com.greensock.easing.Back;
   import flash.display.DisplayObject;
   import flash.events.DataEvent;
   import flash.utils.setTimeout;
   import net.play5d.game.bvn.Debugger;
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.AssetManager;
   import net.play5d.game.bvn.ctrl.GameLogic;
   import net.play5d.game.bvn.ctrl.GameRender;
   import net.play5d.game.bvn.ctrl.SoundCtrl;
   import net.play5d.game.bvn.ctrl.StateCtrl;
   import net.play5d.game.bvn.data.AssisterModel;
   import net.play5d.game.bvn.data.FighterModel;
   import net.play5d.game.bvn.data.FighterVO;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.game.bvn.data.GameMode;
   import net.play5d.game.bvn.data.MessionModel;
   import net.play5d.game.bvn.data.SelectCharListConfigVO;
   import net.play5d.game.bvn.data.SelectCharListItemVO;
   import net.play5d.game.bvn.data.SelectStageConfigVO;
   import net.play5d.game.bvn.data.SelectVO;
   import net.play5d.game.bvn.events.GameEvent;
   import net.play5d.game.bvn.input.GameInputer;
   import net.play5d.game.bvn.ui.GameUI;
   import net.play5d.game.bvn.ui.select.MapSelectUI;
   import net.play5d.game.bvn.ui.select.SelectFighterItem;
   import net.play5d.game.bvn.ui.select.SelectUIFactory;
   import net.play5d.game.bvn.ui.select.SelectedFighterGroup;
   import net.play5d.game.bvn.ui.select.SelecterItemUI;
   import net.play5d.game.bvn.utils.KeyBoarder;
   import net.play5d.game.bvn.utils.ResUtils;
   import net.play5d.kyo.stage.Istage;
   import net.play5d.kyo.utils.KyoRandom;
   
   public class SelectFighterStage implements Istage
   {
      
      public static var AUTO_FINISH:Boolean = true;
      
      private static const SELECT_STATE_FIGHTER:int = 0;
      
      private static const SELECT_STATE_ASSIST:int = 1;
      
      private static const SELECT_STATE_MAP:int = 2;
      
      private var _selectState:int;
      
      private var _ui:stg_select;
      
      private var _config:SelectStageConfigVO;
      
      private var _curListConfig:SelectCharListConfigVO;
      
      private var _itemObj:Object;
      
      private var _p1Slt:SelecterItemUI;
      
      private var _p2Slt:SelecterItemUI;
      
      private var _p1SelectedGroup:SelectedFighterGroup;
      
      private var _p2SelectedGroup:SelectedFighterGroup;
      
      private var _mapSelectUI:MapSelectUI;
      
      private var _curStep:int = 0;
      
      private var _tweenTime:int = 500;
      
      private var _twoPlayerSelectFin:Boolean;
      
      public function SelectFighterStage()
      {
         super();
      }
      
      public function get display() : DisplayObject
      {
         return _ui;
      }
      
      public function build() : void
      {
         _ui = ResUtils.I.createDisplayObject(ResUtils.I.select,ResUtils.SELECT);
         _config = GameData.I.config.select_config;
         GameRender.add(render);
         GameInputer.focus();
         GameInputer.enabled = false;
         nextStep();
         SoundCtrl.I.BGM(AssetManager.I.getSound("select"));
         StateCtrl.I.clearTrans();
         KeyBoarder.focus();
         MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["select_fighter"])));
      }
      
      private function initFighter() : void
      {
         trace("初始化选人");
         clear();
         _selectState = 0;
         buildList(_config.charList);
         GameData.I.p1Select = new SelectVO();
         if(GameMode.isVsPeople() || GameMode.isVsCPU())
         {
            GameData.I.p2Select = new SelectVO();
         }
         GameInputer.enabled = false;
         setTimeout(initSelecter,_tweenTime);
      }
      
      private function initAssist() : void
      {
         trace("初始化辅助");
         clear();
         _selectState = 1;
         buildList(_config.assistList);
         GameInputer.enabled = false;
         setTimeout(initSelecter,_tweenTime);
      }
      
      private function fadOutList(param1:Function = null) : void
      {
         var _loc4_:Number = NaN;
         GameInputer.enabled = false;
         var _loc3_:Number = GameConfig.GAME_SIZE.x / 2 - 30;
         var _loc2_:Number = GameConfig.GAME_SIZE.y / 2 - 30;
         for each(var _loc5_:SelectFighterItem in _itemObj)
         {
            _loc4_ = Math.random() * 0.1;
            TweenLite.to(_loc5_.ui,0.2,{
               "x":_loc3_,
               "y":_loc2_,
               "scaleX":0,
               "scaleY":0,
               "delay":_loc4_
            });
         }
         if(param1 != null)
         {
            TweenLite.delayedCall(0.3,param1);
         }
      }
      
      private function clear() : void
      {
         if(_itemObj)
         {
            for each(var _loc1_:SelectFighterItem in _itemObj)
            {
               _loc1_.removeEventListener("mouseOver",selectFighterMouseHandler);
               _loc1_.removeEventListener("click",selectFighterMouseHandler);
               _loc1_.removeEventListener("touchTap",selectFighterTouchHandler);
               _loc1_.destory();
            }
            _itemObj = null;
         }
         if(_p1Slt)
         {
            _p1Slt.destory();
            _p1Slt = null;
         }
         if(_p2Slt)
         {
            _p2Slt.destory();
            _p2Slt = null;
         }
         if(_mapSelectUI)
         {
            _mapSelectUI.destory();
            _mapSelectUI = null;
         }
         if(_p1SelectedGroup)
         {
            _p1SelectedGroup.destory();
            _p1SelectedGroup = null;
         }
         if(_p2SelectedGroup)
         {
            _p2SelectedGroup.destory();
            _p2SelectedGroup = null;
         }
      }
      
      private function buildList(param1:SelectCharListConfigVO) : void
      {
         var _loc7_:int = 0;
         var _loc12_:SelectCharListItemVO = null;
         var _loc3_:SelectFighterItem = null;
         var _loc9_:Number = NaN;
         var _loc8_:Number = NaN;
         var _loc14_:Number = NaN;
         var _loc10_:Number = _config.x + _config.left;
         var _loc11_:Number = _config.y + _config.top;
         var _loc6_:Number = param1.HCount > 1 ? (_config.width - _config.unitSize.x - _config.left - _config.right) / (param1.HCount - 1) : 0;
         var _loc5_:Number = param1.VCount > 1 ? (_config.height - _config.unitSize.y - _config.top - _config.bottom) / (param1.VCount - 1) : 0;
         var _loc13_:Array = param1.list;
         _curListConfig = param1;
         _itemObj = {};
         var _loc4_:Number = GameConfig.GAME_SIZE.x / 2 - 30;
         var _loc2_:Number = GameConfig.GAME_SIZE.y / 2 - 30;
         while(_loc7_ < _loc13_.length)
         {
            _loc12_ = _loc13_[_loc7_];
            _loc3_ = addFighterItem(_loc12_);
            if(_loc3_)
            {
               _loc9_ = _loc10_ + _loc6_ * _loc3_.selectData.x;
               _loc8_ = _loc11_ + _loc5_ * _loc3_.selectData.y;
               if(_loc3_.selectData.offset)
               {
                  _loc9_ += _loc3_.selectData.offset.x;
                  _loc8_ += _loc3_.selectData.offset.y;
               }
               _loc3_.ui.scaleX = 0;
               _loc3_.ui.scaleY = 0;
               _loc3_.ui.x = _loc4_;
               _loc3_.ui.y = _loc2_;
               _loc14_ = Math.random() * (_tweenTime - 300) / 1000;
               TweenLite.to(_loc3_.ui,0.3,{
                  "x":_loc9_,
                  "y":_loc8_,
                  "delay":_loc14_,
                  "scaleX":1,
                  "scaleY":1,
                  "ease":Back.easeOut
               });
            }
            _loc7_++;
         }
      }
      
      private function addFighterItem(param1:SelectCharListItemVO) : SelectFighterItem
      {
         if(!param1.fighterID)
         {
            return null;
         }
         var _loc2_:FighterVO = _selectState == 1 ? AssisterModel.I.getAssister(param1.fighterID) : FighterModel.I.getFighter(param1.fighterID);
         if(!_loc2_)
         {
            Debugger.log("SelectFighterStage.addFighterItem :: 未找到角色数据：" + param1.fighterID);
            return null;
         }
         var _loc4_:Number = 60;
         var _loc3_:Number = 60;
         var _loc5_:SelectFighterItem = new SelectFighterItem(_loc2_,param1);
         if(GameConfig.TOUCH_MODE)
         {
            _loc5_.addEventListener("touchTap",selectFighterTouchHandler);
         }
         else
         {
            _loc5_.addEventListener("mouseOver",selectFighterMouseHandler);
            _loc5_.addEventListener("click",selectFighterMouseHandler);
         }
         _ui.addChild(_loc5_.ui);
         _itemObj[param1.x + "," + param1.y] = _loc5_;
         return _loc5_;
      }
      
      private function selectFighterMouseHandler(param1:String, param2:SelectFighterItem) : void
      {
         if(!param2 || !param2.selectData)
         {
            return;
         }
         switch(param1)
         {
            case "mouseOver":
               doHover(param2);
               break;
            case "click":
               doSelect(param2);
         }
      }
      
      private function selectFighterTouchHandler(param1:String, param2:SelectFighterItem) : void
      {
         if(!param2 || !param2.selectData)
         {
            return;
         }
         var _loc3_:SelecterItemUI = null;
         if(_p1Slt && _p1Slt.enabled)
         {
            _loc3_ = _p1Slt;
         }
         if(!_loc3_ && (_p2Slt && _p2Slt.enabled))
         {
            _loc3_ = _p2Slt;
         }
         if(!_loc3_)
         {
            return;
         }
         if(isHoverFighter(_loc3_,param2))
         {
            doSelect(param2);
         }
         else
         {
            doHover(param2);
         }
      }
      
      private function doHover(param1:SelectFighterItem) : void
      {
         if(_p1Slt && _p1Slt.enabled)
         {
            if(_p1Slt.isSelected(param1.selectData.fighterID))
            {
               return;
            }
            moveToSelectFighter(_p1Slt,param1);
            SoundCtrl.I.sndSelect();
            return;
         }
         if(_p2Slt && _p2Slt.enabled)
         {
            if(_p2Slt.isSelected(param1.selectData.fighterID))
            {
               return;
            }
            moveToSelectFighter(_p2Slt,param1);
            SoundCtrl.I.sndSelect();
            return;
         }
      }
      
      private function doSelect(param1:SelectFighterItem) : void
      {
         if(_p1Slt && _p1Slt.enabled)
         {
            if(_p1Slt.isSelected(param1.selectData.fighterID))
            {
               return;
            }
            _p1Slt.select(playerSeltBack);
            SoundCtrl.I.sndConfrim();
            return;
         }
         if(_p2Slt && _p2Slt.enabled)
         {
            if(_p2Slt.isSelected(param1.selectData.fighterID))
            {
               return;
            }
            _p2Slt.select(playerSeltBack);
            SoundCtrl.I.sndConfrim();
            return;
         }
      }
      
      private function getFighterItem(param1:int, param2:int) : SelectFighterItem
      {
         if(!_itemObj)
         {
            return null;
         }
         return _itemObj[param1 + "," + param2];
      }
      
      private function initSelecter() : void
      {
         GameInputer.enabled = true;
         if(GameMode.isVsPeople())
         {
            initSelecterP1();
            initSelecterP2();
            _twoPlayerSelectFin = false;
         }
         else
         {
            initSelecterP1();
         }
      }
      
      private function initSelecterP1() : void
      {
         _p1Slt = SelectUIFactory.createSelecter(1);
         _p1Slt.isSelectAssist = _selectState == 1;
         _p1Slt.selectTimesCount = GameMode.isTeamMode() && !_p1Slt.isSelectAssist ? 3 : 1;
         _ui.addChild(_p1Slt.ui);
         _ui.addChild(_p1Slt.group);
         moveSlt(_p1Slt,0,0);
      }
      
      private function initSelecterP2() : void
      {
         _p2Slt = SelectUIFactory.createSelecter(2);
         _p2Slt.isSelectAssist = _selectState == 1;
         _p2Slt.selectTimesCount = GameMode.isTeamMode() && !_p2Slt.isSelectAssist ? 3 : 1;
         _ui.addChild(_p2Slt.ui);
         _ui.addChild(_p2Slt.group);
         moveSlt(_p2Slt,9,0);
      }
      
      private function moveSlt(param1:SelecterItemUI, param2:int, param3:int, param4:Boolean = true) : Boolean
      {
         var _loc10_:Boolean = false;
         var _loc12_:Boolean = false;
         var _loc8_:Boolean = false;
         var _loc6_:Boolean = false;
         var _loc9_:int = 0;
         var _loc11_:int = 0;
         var _loc5_:Boolean = false;
         var _loc7_:SelectFighterItem = getFighterItem(param2,param3);
         if(!_loc7_ || _loc7_ && param1.isSelected(_loc7_.selectData.fighterID))
         {
            if(!param4)
            {
               return true;
            }
            if(param2 > param1.x)
            {
               _loc10_ = true;
               _loc11_ = 0;
               while(_loc11_ < _curListConfig.HCount)
               {
                  _loc9_ = param2 + _loc11_;
                  if(_loc9_ > _curListConfig.HCount - 1)
                  {
                     _loc9_ -= _curListConfig.HCount;
                  }
                  _loc7_ = getFighterItem(_loc9_,param1.y);
                  if(_loc7_ && !param1.isSelected(_loc7_.selectData.fighterID))
                  {
                     break;
                  }
                  _loc11_++;
               }
            }
            if(param2 < param1.x)
            {
               _loc6_ = true;
               _loc11_ = 0;
               while(_loc11_ < _curListConfig.HCount)
               {
                  _loc9_ = param2 - _loc11_;
                  if(_loc9_ < 0)
                  {
                     _loc9_ = _curListConfig.HCount + _loc9_;
                  }
                  _loc7_ = getFighterItem(_loc9_,param1.y);
                  if(_loc7_ && !param1.isSelected(_loc7_.selectData.fighterID))
                  {
                     break;
                  }
                  _loc11_++;
               }
            }
            if(param3 > param1.y)
            {
               _loc8_ = true;
               if(param3 > _curListConfig.VCount - 1)
               {
                  param3 = 0;
               }
               _loc11_ = param3;
               while(_loc11_ < _curListConfig.VCount)
               {
                  _loc7_ = getHLineFighter(param1.x,_loc11_);
                  if(_loc7_)
                  {
                     break;
                  }
                  _loc11_++;
               }
            }
            if(param3 < param1.y)
            {
               _loc12_ = true;
               if(param3 < 0)
               {
                  param3 = _curListConfig.VCount - 1;
               }
               _loc11_ = param3;
               while(_loc11_ >= 0)
               {
                  _loc7_ = getHLineFighter(param1.x,_loc11_);
                  if(_loc7_)
                  {
                     break;
                  }
                  _loc11_--;
               }
            }
         }
         if(!_loc7_)
         {
            return false;
         }
         param1.x = _loc7_.selectData.x;
         param1.y = _loc7_.selectData.y;
         if(param1.isSelected(_loc7_.selectData.fighterID))
         {
            if(_loc12_ || _loc8_)
            {
               _loc5_ = moveSlt(param1,param1.x + 1,param1.y);
               if(!_loc5_)
               {
                  if(_loc12_)
                  {
                     moveSlt(param1,param1.x,param1.y - 1);
                  }
                  if(_loc8_)
                  {
                     moveSlt(param1,param1.x,param1.y + 1);
                  }
               }
            }
            return true;
         }
         moveToSelectFighter(param1,_loc7_);
         return true;
      }
      
      private function isHoverFighter(param1:SelecterItemUI, param2:SelectFighterItem) : Boolean
      {
         return param1.x == param2.selectData.x && param1.y == param2.selectData.y;
      }
      
      private function moveToSelectFighter(param1:SelecterItemUI, param2:SelectFighterItem) : void
      {
         param1.randoms = null;
         param1.x = param2.selectData.x;
         param1.y = param2.selectData.y;
         param1.moveTo(param2.ui.x,param2.ui.y);
         param1.currentFighter = param2.fighterData;
         if(param1.group)
         {
            param1.group.updateFighter(param1.currentFighter);
         }
         checkRandom(param1);
      }
      
      private function checkRandom(param1:SelecterItemUI) : Boolean
      {
         var slt:SelecterItemUI = param1;
         if(slt.currentFighter.id.indexOf("random") != -1)
         {
            switch(_selectState)
            {
               case 0:
                  slt.randoms = FighterModel.I.getFighters(slt.currentFighter.comicType,function(param1:FighterVO):Boolean
                  {
                     return param1.id.indexOf("random") == -1 && GameLogic.canSelectFighter(param1.id) && !slt.selectVO.isSelected(param1.id);
                  });
                  break;
               case 1:
                  slt.randoms = AssisterModel.I.getAssisters(slt.currentFighter.comicType,function(param1:FighterVO):Boolean
                  {
                     return param1.id.indexOf("random") == -1 && GameLogic.canSelectAssist(param1.id);
                  });
                  break;
               default:
                  return false;
            }
            slt.randFrame = 0;
            renderRandom(slt);
            return true;
         }
         return false;
      }
      
      private function getHLineFighter(param1:int, param2:int) : SelectFighterItem
      {
         var _loc5_:int = 0;
         var _loc4_:int = 0;
         var _loc3_:SelectFighterItem = null;
         while(true)
         {
            _loc4_ = param1 + _loc5_;
            if(_loc4_ >= 0 && _loc4_ < _curListConfig.HCount)
            {
               _loc3_ = getFighterItem(_loc4_,param2);
               if(_loc3_)
               {
                  break;
               }
            }
            if(_loc5_ == 0)
            {
               _loc5_ = 1;
            }
            else if(_loc5_ > 0)
            {
               _loc5_ *= -1;
            }
            else
            {
               if(_loc5_ < -_curListConfig.HCount)
               {
                  return null;
               }
               _loc5_ *= -1;
               _loc5_++;
            }
         }
         return _loc3_;
      }
      
      private function renderRandom(param1:SelecterItemUI) : void
      {
         if(param1.randoms)
         {
            if(param1.randFrame > 0)
            {
               param1.randFrame = 0;
               return;
            }
            param1.randFrame++;
            param1.currentFighter = KyoRandom.getRandomInArray(param1.randoms,false);
            if(param1.group)
            {
               param1.group.updateFighter(param1.currentFighter);
            }
         }
      }
      
      private function render() : void
      {
         var _loc1_:String = null;
         if(GameInputer.back(1))
         {
            if(GameUI.showingDialog())
            {
               GameUI.closeConfrim();
            }
            else
            {
               GameUI.confrim("BACK TITLE?","返回到主菜单？",MainGame.I.goMenu);
            }
         }
         if(GameUI.showingDialog())
         {
            return;
         }
         if(_p1Slt && _p1Slt.enabled)
         {
            renderRandom(_p1Slt);
            _loc1_ = _p1Slt.inputType;
            if(GameInputer.up(_loc1_,1))
            {
               moveSlt(_p1Slt,_p1Slt.x,_p1Slt.y - 1);
               SoundCtrl.I.sndSelect();
            }
            if(GameInputer.down(_loc1_,1))
            {
               moveSlt(_p1Slt,_p1Slt.x,_p1Slt.y + 1);
               SoundCtrl.I.sndSelect();
            }
            if(GameInputer.left(_loc1_,1))
            {
               moveSlt(_p1Slt,_p1Slt.x - 1,_p1Slt.y);
               SoundCtrl.I.sndSelect();
            }
            if(GameInputer.right(_loc1_,1))
            {
               moveSlt(_p1Slt,_p1Slt.x + 1,_p1Slt.y);
               SoundCtrl.I.sndSelect();
            }
            if(GameInputer.select(_loc1_,1))
            {
               _p1Slt.select(playerSeltBack);
               SoundCtrl.I.sndConfrim();
            }
         }
         if(_p2Slt && _p2Slt.enabled)
         {
            _loc1_ = _p2Slt.inputType;
            renderRandom(_p2Slt);
            if(GameInputer.up(_loc1_,1))
            {
               moveSlt(_p2Slt,_p2Slt.x,_p2Slt.y - 1);
               SoundCtrl.I.sndSelect();
            }
            if(GameInputer.down(_loc1_,1))
            {
               moveSlt(_p2Slt,_p2Slt.x,_p2Slt.y + 1);
               SoundCtrl.I.sndSelect();
            }
            if(GameInputer.left(_loc1_,1))
            {
               moveSlt(_p2Slt,_p2Slt.x - 1,_p2Slt.y);
               SoundCtrl.I.sndSelect();
            }
            if(GameInputer.right(_loc1_,1))
            {
               moveSlt(_p2Slt,_p2Slt.x + 1,_p2Slt.y);
               SoundCtrl.I.sndSelect();
            }
            if(GameInputer.select(_loc1_,1))
            {
               _p2Slt.select(playerSeltBack);
               SoundCtrl.I.sndConfrim();
            }
         }
         if(_mapSelectUI && _mapSelectUI.enabled)
         {
            _loc1_ = _mapSelectUI.inputType;
            if(GameInputer.left(_loc1_,1))
            {
               _mapSelectUI.prev();
               SoundCtrl.I.sndSelect();
            }
            if(GameInputer.right(_loc1_,1))
            {
               _mapSelectUI.next();
               SoundCtrl.I.sndSelect();
            }
            if(GameInputer.select(_loc1_,1))
            {
               _mapSelectUI.select(onMapSelect);
               SoundCtrl.I.sndConfrim();
            }
         }
      }
      
      public function get p1SelectFinish() : Boolean
      {
         return _p1Slt && _p1Slt.selectFinish();
      }
      
      public function get p2SelectFinish() : Boolean
      {
         return _p2Slt && _p2Slt.selectFinish();
      }
      
      public function setSelect(param1:int, param2:Array) : void
      {
         var _loc3_:SelecterItemUI = param1 == 1 ? _p1Slt : _p2Slt;
         _loc3_.setCurrentSelect(param2);
         _loc3_.removeSelecter();
         SoundCtrl.I.sndConfrim();
      }
      
      private function playerSeltBack(param1:SelecterItemUI) : void
      {
         var _loc2_:SelecterItemUI = null;
         var _loc3_:int = 0;
         if(param1.selectFinish())
         {
            if(GameMode.isVsPeople())
            {
               GameEvent.dispatchEvent("SELECT_FIGHTER_STEP",param1.getCurrentSelectes());
               _loc2_ = param1 == _p1Slt ? _p2Slt : _p1Slt;
               if(_loc2_ && _loc2_.selectFinish() && !_twoPlayerSelectFin)
               {
                  _twoPlayerSelectFin = true;
                  if(!AUTO_FINISH)
                  {
                     return;
                  }
                  nextStep();
               }
            }
            else
            {
               nextStep();
            }
            param1.destory();
         }
         else if(!param1.randoms)
         {
            _loc3_ = param1 == _p1Slt == 1 ? 1 : -1;
            moveSlt(param1,param1.x + _loc3_,param1.y,true);
         }
      }
      
      public function nextStep() : void
      {
         switch(_curStep)
         {
            case 0:
               initFighter();
               _curStep = 1;
               break;
            case 1:
               if(GameMode.isVsCPU())
               {
                  _p1Slt.removeSelecter();
                  _p1Slt.enabled = false;
                  initSelecterP2();
                  _p2Slt.inputType = "P1";
                  _curStep = 2;
               }
               else
               {
                  fadOutList(initAssist);
                  _curStep = 3;
               }
               break;
            case 2:
               fadOutList(initAssist);
               _curStep = 3;
               break;
            case 3:
               if(GameMode.isVsCPU())
               {
                  _p1Slt.removeSelecter();
                  _p1Slt.enabled = false;
                  initSelecterP2();
                  _p2Slt.inputType = "P1";
                  _curStep = 4;
               }
               else if(GameMode.isVsCPU() || GameMode.isVsPeople())
               {
                  fadOutList(initMap);
                  _curStep = 5;
               }
               else
               {
                  startAcradeGame();
               }
               break;
            case 4:
               _curStep = 5;
               fadOutList(initMap);
               break;
            case 5:
               selectFinish();
         }
      }
      
      private function initMap() : void
      {
         var oldX:Number;
         var oldY:Number;
         trace("选择地图");
         MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["select_map"])));
         clear();
         GameInputer.enabled = false;
         _mapSelectUI = new MapSelectUI();
         _ui.addChild(_mapSelectUI);
         oldX = _mapSelectUI.x;
         oldY = _mapSelectUI.y;
         _mapSelectUI.scaleX = 0;
         _mapSelectUI.scaleY = 0;
         _mapSelectUI.x = GameConfig.GAME_SIZE.x / 2;
         _mapSelectUI.y = GameConfig.GAME_SIZE.y / 2;
         TweenLite.to(_mapSelectUI,0.3,{
            "x":oldX,
            "y":oldY,
            "scaleX":1,
            "scaleY":1,
            "ease":Back.easeOut,
            "onComplete":function():void
            {
               if(_mapSelectUI)
               {
                  _mapSelectUI.addMouseEvents(mapPrevHandler,mapNextHandler,mapConfrimHandler);
                  _mapSelectUI.inputType = "P1";
                  _mapSelectUI.enabled = true;
               }
               GameInputer.enabled = true;
            }
         });
      }
      
      private function mapPrevHandler() : void
      {
         _mapSelectUI.prev();
      }
      
      private function mapNextHandler() : void
      {
         _mapSelectUI.next();
      }
      
      private function mapConfrimHandler() : void
      {
         _mapSelectUI.select(onMapSelect);
      }
      
      private function onMapSelect() : void
      {
         nextStep();
      }
      
      private function startAcradeGame() : void
      {
         MessionModel.I.initMession();
         selectFinish();
      }
      
      private function selectFinish() : void
      {
         GameEvent.dispatchEvent("SELECT_FIGHTER_FINISH");
         if(!AUTO_FINISH)
         {
            return;
         }
         goLoadGame();
         MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["select_finish"])));
      }
      
      public function goLoadGame() : void
      {
         trace("开始游戏");
         StateCtrl.I.transIn(MainGame.I.loadGame);
      }
      
      public function afterBuild() : void
      {
      }
      
      public function destory(param1:Function = null) : void
      {
         clear();
         GameRender.remove(render);
         GameInputer.enabled = false;
         SoundCtrl.I.BGM(null);
         GameUI.closeConfrim();
      }
   }
}

