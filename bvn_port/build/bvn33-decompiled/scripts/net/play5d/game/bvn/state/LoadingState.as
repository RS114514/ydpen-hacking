package net.play5d.game.bvn.state
{
   import com.greensock.TweenLite;
   import flash.display.DisplayObject;
   import flash.events.DataEvent;
   import flash.utils.setTimeout;
   import net.play5d.game.bvn.Debugger;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.AssetManager;
   import net.play5d.game.bvn.ctrl.GameLoader;
   import net.play5d.game.bvn.ctrl.GameRender;
   import net.play5d.game.bvn.ctrl.SoundCtrl;
   import net.play5d.game.bvn.ctrl.StateCtrl;
   import net.play5d.game.bvn.ctrl.game_ctrls.GameCtrl;
   import net.play5d.game.bvn.data.FighterModel;
   import net.play5d.game.bvn.data.FighterVO;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.game.bvn.data.GameRunFighterGroup;
   import net.play5d.game.bvn.data.MapModel;
   import net.play5d.game.bvn.data.MapVO;
   import net.play5d.game.bvn.data.SelectVO;
   import net.play5d.game.bvn.fighter.Assister;
   import net.play5d.game.bvn.fighter.FighterMain;
   import net.play5d.game.bvn.input.GameInputer;
   import net.play5d.game.bvn.map.MapMain;
   import net.play5d.game.bvn.ui.GameUI;
   import net.play5d.game.bvn.ui.select.SelectIndexUI;
   import net.play5d.game.bvn.utils.ResUtils;
   import net.play5d.kyo.stage.Istage;
   
   public class LoadingState implements Istage
   {
      
      public static var AUTO_START_GAME:Boolean = true;
      
      private var _ui:loading_fight_mc;
      
      private var _sltUI:loading_select_ui_mc;
      
      private var _loadQueue:Array;
      
      private var _curMsg:String;
      
      private var _loadCount:int;
      
      private var _destoryed:Boolean;
      
      private var _loadFin:Boolean;
      
      private var _selectIndexUI:SelectIndexUI;
      
      private var _loadedFighterCache:Object = {};
      
      private var _currentLoadBack:Function;
      
      private var _gameFinished:Boolean;
      
      public function LoadingState()
      {
         super();
      }
      
      public function get display() : DisplayObject
      {
         return _ui;
      }
      
      public function p1SelectFinish() : Boolean
      {
         return _selectIndexUI.p1Finish();
      }
      
      public function p2SelectFinish() : Boolean
      {
         return _selectIndexUI.p2Finish();
      }
      
      public function selectFinish() : Boolean
      {
         return _selectIndexUI.isFinish();
      }
      
      public function getSort() : Array
      {
         return [_selectIndexUI.getP1Order(),_selectIndexUI.getP2Order()];
      }
      
      public function setOrder(param1:int, param2:Array) : void
      {
         if(param1 == 1)
         {
            _selectIndexUI.setP1Order(param2);
         }
         if(param1 == 2)
         {
            _selectIndexUI.setP2Order(param2);
         }
      }
      
      public function build() : void
      {
         var p1selt:SelectVO;
         var p2selt:SelectVO;
         var fighters:Array;
         var assisters:Array;
         var fighter:FighterVO;
         var fighterName:String;
         var o:Object;
         var fightBGMs:Array;
         var i:int;
         var map:MapVO;
         var mapName:String;
         MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["loading_start"])));
         GameRender.add(render);
         GameInputer.focus();
         GameInputer.enabled = true;
         SoundCtrl.I.BGM(AssetManager.I.getSound("loading"));
         _ui = ResUtils.I.createDisplayObject(ResUtils.I.fight,"loading_fight_mc");
         _sltUI = _ui.sltui;
         _selectIndexUI = new SelectIndexUI();
         _selectIndexUI.onFinish = finish;
         _sltUI.addChild(_selectIndexUI);
         p1selt = GameData.I.p1Select;
         p2selt = GameData.I.p2Select;
         _loadQueue = [];
         fighters = [{
            "id":p1selt.fighter1,
            "runobj":{"id":"p1"}
         },{
            "id":p1selt.fighter2,
            "runobj":{"id":"p1"}
         },{
            "id":p1selt.fighter3,
            "runobj":{"id":"p1"}
         },{
            "id":p2selt.fighter1,
            "runobj":{"id":"p2"}
         },{
            "id":p2selt.fighter2,
            "runobj":{"id":"p2"}
         },{
            "id":p2selt.fighter3,
            "runobj":{"id":"p2"}
         }];
         assisters = [{
            "id":p1selt.fuzhu,
            "runobj":{
               "group":"p1FighterGroup",
               "id":"fuzhu"
            }
         },{
            "id":p2selt.fuzhu,
            "runobj":{
               "group":"p2FighterGroup",
               "id":"fuzhu"
            }
         }];
         fightBGMs = [];
         while(i < fighters.length)
         {
            o = fighters[i];
            if(o.id)
            {
               fighterName = o.id;
               fighter = FighterModel.I.getFighter(o.id);
               if(fighter)
               {
                  if(fighter.bgm)
                  {
                     fightBGMs.push({
                        "id":fighter.id,
                        "url":fighter.bgm,
                        "rate":fighter.bgmRate
                     });
                  }
                  fighterName = fighter.name;
               }
               _loadQueue.push({
                  "msg":"正在加载角色：" + fighterName,
                  "func":GameLoader.loadFighter,
                  "params":[o.id,function(param1:FighterMain, param2:Object):void
                  {
                     cacheFighter(param1,param2.id,param1.data.id);
                     loadNext();
                  },loadFail,loadProcess,o.runobj]
               });
            }
            i = i + 1;
         }
         i = 0;
         while(i < assisters.length)
         {
            o = assisters[i];
            if(o.id)
            {
               fighter = FighterModel.I.getFighter(o.id);
               fighterName = fighter ? fighter.name : o.id;
               _loadQueue.push({
                  "msg":"正在加载辅助角色：" + fighterName,
                  "func":GameLoader.loadAssister,
                  "params":[o.id,function(param1:Assister, param2:Object):void
                  {
                     GameCtrl.I.gameRunData[param2.group][param2.id] = param1;
                     loadNext();
                  },loadFail,loadProcess,o.runobj]
               });
            }
            i = i + 1;
         }
         map = MapModel.I.getMap(GameData.I.selectMap);
         mapName = map ? map.name : GameData.I.selectMap;
         _loadQueue.push({
            "msg":"正在加载场景：" + mapName,
            "func":GameLoader.loadMap,
            "params":[GameData.I.selectMap,function(param1:MapMain):void
            {
               if(param1.data && param1.data.bgm)
               {
                  fightBGMs.push({
                     "id":"map",
                     "url":param1.data.bgm,
                     "rate":1
                  });
               }
               GameCtrl.I.gameRunData.map = param1;
               loadNext();
            },loadFail]
         });
         if(fightBGMs.length > 0)
         {
            _loadQueue.push({
               "msg":"正在加载BGM",
               "func":SoundCtrl.I.loadFightBGM,
               "params":[fightBGMs,loadNext,loadFail,loadProcess]
            });
         }
         _loadCount = _loadQueue.length;
         setTimeout(loadNext,1000);
      }
      
      private function render() : void
      {
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
      }
      
      private function loadNext() : void
      {
         if(_loadQueue.length < 1)
         {
            loadFin();
            return;
         }
         var _loc1_:Object = _loadQueue.shift();
         updateMsg(_loc1_.msg);
         _currentLoadBack = _loc1_.back;
         _loc1_.func.apply(null,_loc1_.params);
      }
      
      private function loadFighterComplete(param1:FighterMain) : void
      {
         if(Boolean(_currentLoadBack))
         {
            _currentLoadBack(param1);
            _currentLoadBack = null;
         }
         loadNext();
      }
      
      private function loadFin() : void
      {
         var delayCall:* = function():void
         {
            _loadFin = true;
            finish();
         };
         TweenLite.to(_sltUI,1,{
            "y":80,
            "onComplete":function():void
            {
               setTimeout(delayCall,2000);
            }
         });
      }
      
      private function finish() : void
      {
         if(_destoryed)
         {
            return;
         }
         if(!_selectIndexUI.isFinish() || !_loadFin)
         {
            return;
         }
         if(!AUTO_START_GAME)
         {
            return;
         }
         if(_gameFinished)
         {
            return;
         }
         _gameFinished = true;
         var _loc2_:Array = _selectIndexUI.getP1Order();
         var _loc1_:Array = _selectIndexUI.getP2Order();
         gotoGame(_loc2_,_loc1_);
      }
      
      public function gotoGame(param1:Array, param2:Array) : void
      {
         var _loc3_:GameRunFighterGroup = GameCtrl.I.gameRunData.p1FighterGroup;
         var _loc4_:GameRunFighterGroup = GameCtrl.I.gameRunData.p2FighterGroup;
         _loc3_.fighter1 = getCacheFighter("p1",param1[0]);
         _loc3_.fighter2 = getCacheFighter("p1",param1[1]);
         _loc3_.fighter3 = getCacheFighter("p1",param1[2]);
         _loc4_.fighter1 = getCacheFighter("p2",param2[0]);
         _loc4_.fighter2 = getCacheFighter("p2",param2[1]);
         _loc4_.fighter3 = getCacheFighter("p2",param2[2]);
         _loc3_.currentFighter = _loc3_.fighter1;
         _loc4_.currentFighter = _loc4_.fighter1;
         MainGame.I.stage.dispatchEvent(new DataEvent("5d_message",false,false,JSON.stringify(["loading_finish"])));
         StateCtrl.I.transIn(MainGame.I.goGame,false);
      }
      
      private function getCacheFighter(param1:String, param2:String) : FighterMain
      {
         if(param2 == null)
         {
            return null;
         }
         var _loc3_:String = param1 + "_" + param2;
         var _loc4_:FighterMain = _loadedFighterCache[_loc3_];
         if(!_loc4_)
         {
            throw new Error("未找到fighter:" + _loc3_);
         }
         return _loc4_;
      }
      
      private function cacheFighter(param1:FighterMain, param2:String, param3:String) : void
      {
         var _loc4_:String = param2 + "_" + param3;
         _loadedFighterCache[_loc4_] = param1;
      }
      
      private function loadFail(param1:String) : void
      {
         Debugger.errorMsg(param1);
      }
      
      private function loadProcess(param1:Number) : void
      {
         _sltUI.bar.bar.scaleX = param1;
      }
      
      private function updateMsg(param1:String = null) : void
      {
         if(param1)
         {
            _curMsg = param1;
         }
         var _loc2_:int = _loadCount - _loadQueue.length;
         _sltUI.bar.txt.text = _curMsg + "(" + _loc2_ + "/" + _loadCount + ")";
      }
      
      public function afterBuild() : void
      {
         StateCtrl.I.transOut();
      }
      
      public function destory(param1:Function = null) : void
      {
         _destoryed = true;
         if(_selectIndexUI)
         {
            _selectIndexUI.destory();
            _selectIndexUI = null;
         }
         SoundCtrl.I.BGM(null);
         _loadedFighterCache = null;
         _loadQueue = null;
         GameInputer.clearInput();
         GameRender.remove(render);
         GameUI.closeConfrim();
      }
   }
}

