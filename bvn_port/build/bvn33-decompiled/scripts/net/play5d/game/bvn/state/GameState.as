package net.play5d.game.bvn.state
{
   import flash.display.DisplayObject;
   import flash.display.Sprite;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import flash.utils.getDefinitionByName;
   import flash.utils.getQualifiedClassName;
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.ctrl.EffectCtrl;
   import net.play5d.game.bvn.ctrl.GameLogic;
   import net.play5d.game.bvn.ctrl.game_ctrls.GameCtrl;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.game.bvn.data.GameMode;
   import net.play5d.game.bvn.data.GameRunFighterGroup;
   import net.play5d.game.bvn.fighter.FighterMain;
   import net.play5d.game.bvn.interfaces.IGameSprite;
   import net.play5d.game.bvn.map.MapMain;
   import net.play5d.game.bvn.ui.GameUI;
   import net.play5d.kyo.stage.Istage;
   
   public class GameState extends Sprite implements Istage
   {
      
      private var _gameLayer:Sprite = new Sprite();
      
      private var _playerLayer:Sprite = new Sprite();
      
      private var _gameSprites:Vector.<IGameSprite> = new Vector.<IGameSprite>();
      
      private var _map:MapMain;
      
      public var camera:GameCamera;
      
      private var _cameraFocus:Array;
      
      public var gameUI:GameUI;
      
      public function GameState()
      {
         super();
         _gameLayer.mouseChildren = _gameLayer.mouseEnabled = false;
      }
      
      public function get gameLayer() : Sprite
      {
         return _gameLayer;
      }
      
      public function getMap() : MapMain
      {
         return _map;
      }
      
      public function setVisibleByClass(param1:Class, param2:*) : void
      {
         var _loc4_:String = null;
         var _loc5_:Class = null;
         for each(var _loc3_:IGameSprite in _gameSprites)
         {
            _loc4_ = getQualifiedClassName(_loc3_);
            _loc5_ = getDefinitionByName(_loc4_) as Class;
            if(_loc5_ == param1)
            {
               _loc3_.getDisplay().visible = param2;
            }
         }
      }
      
      public function get display() : DisplayObject
      {
         return this;
      }
      
      public function getGameSpriteGlobalPosition(param1:IGameSprite, param2:Number = 0, param3:Number = 0) : Point
      {
         var _loc4_:Number = camera.getZoom(true);
         var _loc5_:Rectangle = camera.getScreenRect(true);
         return new Point((-_loc5_.x + param1.x + param2) * _loc4_,(-_loc5_.y + param1.y + param3) * _loc4_);
      }
      
      public function getGameSprites() : Vector.<IGameSprite>
      {
         return _gameSprites;
      }
      
      public function addGameSprite(param1:IGameSprite) : void
      {
         if(_gameSprites.indexOf(param1) != -1)
         {
            return;
         }
         _gameSprites.push(param1);
         _playerLayer.addChild(param1.getDisplay());
         param1.setVolume(GameData.I.config.soundVolume);
      }
      
      public function addGameSpriteAt(param1:IGameSprite, param2:int) : void
      {
         if(_gameSprites.indexOf(param1) != -1)
         {
            return;
         }
         _gameSprites.push(param1);
         _playerLayer.addChildAt(param1.getDisplay(),param2);
         param1.setVolume(GameData.I.config.soundVolume);
      }
      
      public function removeGameSprite(param1:IGameSprite) : void
      {
         var _loc2_:int = _gameSprites.indexOf(param1);
         if(_loc2_ == -1)
         {
            return;
         }
         _gameSprites.splice(_loc2_,1);
         try
         {
            _playerLayer.removeChild(param1.getDisplay());
         }
         catch(e:Error)
         {
         }
      }
      
      public function build() : void
      {
         GameCtrl.I.initlize(this);
         EffectCtrl.I.initlize(this,_playerLayer);
         gameUI = new GameUI();
      }
      
      public function initFight(param1:GameRunFighterGroup, param2:GameRunFighterGroup, param3:MapMain) : void
      {
         var _loc6_:Point = null;
         _map = param3;
         _map.gameState = this;
         if(_map.bgLayer)
         {
            addChild(_map.bgLayer);
         }
         addChild(_gameLayer);
         if(_map.mapLayer)
         {
            _gameLayer.addChild(_map.mapLayer);
         }
         _gameLayer.addChild(_playerLayer);
         if(_map.frontFixLayer)
         {
            _gameLayer.addChild(_map.frontFixLayer);
         }
         if(_map.frontLayer)
         {
            _gameLayer.addChild(_map.frontLayer);
         }
         _cameraFocus = [];
         var _loc5_:FighterMain = param1.currentFighter;
         var _loc4_:FighterMain = param2.currentFighter;
         if(_loc5_)
         {
            GameLogic.resetFighterHP(_loc5_);
            _loc5_.x = _map.p1pos.x;
            _loc5_.y = _map.p1pos.y;
            _loc5_.direct = 1;
            _loc5_.updatePosition();
            _cameraFocus.push(_loc5_.getDisplay());
         }
         if(_loc4_)
         {
            GameLogic.resetFighterHP(_loc4_);
            if(GameMode.isAcrade())
            {
               GameLogic.setMessionEnemyAttack(_loc4_);
            }
            _loc4_.x = _map.p2pos.x;
            _loc4_.y = _map.p2pos.y;
            _loc4_.direct = -1;
            _loc4_.updatePosition();
            _cameraFocus.push(_loc4_.getDisplay());
         }
         if(_map.mapLayer)
         {
            _loc6_ = new Point(_map.mapLayer.width,GameConfig.GAME_SIZE.y);
            initCamera();
            camera.focus(_cameraFocus);
            gameUI.initFight(param1,param2);
            addChild(gameUI.getUIDisplay());
            return;
         }
         throw new Error("map is error! :: mapLayer is null!");
      }
      
      public function resetFight(param1:GameRunFighterGroup, param2:GameRunFighterGroup) : void
      {
         var _loc4_:FighterMain = param1.currentFighter;
         var _loc3_:FighterMain = param2.currentFighter;
         _cameraFocus = [];
         if(_loc4_)
         {
            GameLogic.resetFighterHP(_loc4_);
            _loc4_.x = _map.p1pos.x;
            _loc4_.y = _map.p1pos.y;
            _loc4_.direct = 1;
            _loc4_.idle();
            _loc4_.updatePosition();
            _cameraFocus.push(_loc4_.getDisplay());
         }
         if(_loc3_)
         {
            GameLogic.resetFighterHP(_loc3_);
            _loc3_.x = _map.p2pos.x;
            _loc3_.y = _map.p2pos.y;
            _loc3_.direct = -1;
            _loc3_.idle();
            _loc3_.updatePosition();
            _cameraFocus.push(_loc3_.getDisplay());
         }
         gameUI.initFight(param1,param2);
         cameraResume();
      }
      
      public function cameraFocusOne(param1:DisplayObject) : void
      {
         camera.focus([param1]);
         camera.setZoom(3.5);
         camera.tweenSpd = 2.5 / GameConfig.SPEED_PLUS_DEFAULT;
      }
      
      public function cameraResume() : void
      {
         camera.focus(_cameraFocus);
         camera.tweenSpd = 2.5 / GameConfig.SPEED_PLUS_DEFAULT;
      }
      
      private function initCamera() : void
      {
         if(camera)
         {
            throw new Error("camera inited!");
         }
         var _loc4_:Point = _map.getStageSize();
         camera = new GameCamera(_gameLayer,GameConfig.GAME_SIZE,_loc4_,true);
         camera.focusX = true;
         camera.focusY = true;
         camera.offsetY = _map.getMapBottomDistance();
         camera.setStageBounds(new Rectangle(0,-1000,_loc4_.x,_loc4_.y));
         camera.autoZoom = true;
         camera.autoZoomMin = 1;
         camera.autoZoomMax = 2.5;
         camera.tweenSpd = 2.5 / GameConfig.SPEED_PLUS_DEFAULT;
         var _loc3_:Number = 2;
         var _loc1_:Number = _loc4_.x / 2 * _loc3_ - 350;
         var _loc2_:Number = _map.bottom - 200;
         camera.setZoom(_loc3_);
         camera.setX(-_loc1_);
         camera.setY(-_loc2_);
         camera.updateNow();
      }
      
      public function render() : void
      {
         var _loc1_:Rectangle = null;
         if(camera)
         {
            camera.render();
         }
         if(gameUI)
         {
            gameUI.render();
         }
         if(_map && camera)
         {
            _loc1_ = camera.getScreenRect(true);
            _map.render(-_loc1_.x,-_loc1_.y,camera.getZoom(true));
         }
      }
      
      public function drawGameRect(param1:Rectangle, param2:uint = 16711680, param3:Number = 0.5, param4:Boolean = false) : void
      {
         if(param4)
         {
            _gameLayer.graphics.clear();
         }
         _gameLayer.graphics.beginFill(param2,param3);
         _gameLayer.graphics.drawRect(param1.x,param1.y,param1.width,param1.height);
         _gameLayer.graphics.endFill();
      }
      
      public function clearDrawGameRect() : void
      {
         _gameLayer.graphics.clear();
      }
      
      public function afterBuild() : void
      {
      }
      
      public function destory(param1:Function = null) : void
      {
         this.removeChildren();
         if(_gameSprites)
         {
            while(_gameSprites.length > 0)
            {
               removeGameSprite(_gameSprites.shift());
            }
            _gameSprites = null;
         }
         if(_playerLayer)
         {
            _playerLayer.removeChildren();
            _playerLayer = null;
         }
         if(_gameLayer)
         {
            _gameLayer.removeChildren();
            _gameLayer = null;
         }
         if(camera)
         {
            camera = null;
         }
         if(gameUI)
         {
            gameUI.destory();
            gameUI = null;
         }
         EffectCtrl.I.destory();
         GameCtrl.I.destory();
         if(_map)
         {
            _map.destory();
            _map = null;
         }
      }
   }
}

