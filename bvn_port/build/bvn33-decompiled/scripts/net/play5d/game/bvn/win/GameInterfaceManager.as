package net.play5d.game.bvn.win
{
   import flash.desktop.NativeApplication;
   import flash.display.DisplayObject;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.geom.Matrix;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.game_ctrls.GameCtrl;
   import net.play5d.game.bvn.data.ConfigVO;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.game.bvn.input.IGameInput;
   import net.play5d.game.bvn.interfaces.IExtendConfig;
   import net.play5d.game.bvn.interfaces.IFighterActionCtrl;
   import net.play5d.game.bvn.interfaces.IGameInterface;
   import net.play5d.game.bvn.map.MapMain;
   import net.play5d.game.bvn.ui.GameUI;
   import net.play5d.game.bvn.utils.EmbedAssetUtils;
   import net.play5d.game.bvn.utils.PayUtils;
   import net.play5d.game.bvn.utils.URL;
   import net.play5d.game.bvn.win.ctrls.LANClientCtrl;
   import net.play5d.game.bvn.win.ctrls.LANGameCtrl;
   import net.play5d.game.bvn.win.ctrls.LANServerCtrl;
   import net.play5d.game.bvn.win.data.ExtendConfig;
   import net.play5d.game.bvn.win.input.InputManager;
   import net.play5d.game.bvn.win.utils.FileUtils;
   import net.play5d.game.bvn.win.views.ViewManager;
   
   public class GameInterfaceManager implements IGameInterface
   {
      
      private static var _extendsConfig:ExtendConfig = new ExtendConfig();
      
      public function GameInterfaceManager()
      {
         super();
      }
      
      public static function get config() : ExtendConfig
      {
         return _extendsConfig;
      }
      
      public function initTitleUI(param1:DisplayObject) : void
      {
         var _loc4_:Sprite = (param1 as Sprite).getChildByName("logo_mc") as Sprite;
         if(!_loc4_)
         {
            return;
         }
         _loc4_.visible = true;
         var _loc2_:Sprite = _loc4_.getChildByName("logo_5dplay") as Sprite;
         if(_loc2_)
         {
            _loc2_.buttonMode = true;
            _loc2_.addEventListener("mouseUp",URL.website,false,0,true);
         }
         var _loc3_:Sprite = _loc4_.getChildByName("logo_5dplay_bbs") as Sprite;
         if(_loc3_)
         {
            _loc3_.buttonMode = true;
            _loc3_.addEventListener("mouseUp",URL.bbs,false,0,true);
         }
      }
      
      public function moreGames() : void
      {
         URL.website();
      }
      
      public function submitScore(param1:int) : void
      {
      }
      
      public function showRank() : void
      {
      }
      
      public function saveGame(param1:Object) : void
      {
         var _loc2_:String = JSON.stringify(param1);
         FileUtils.writeAppFloderFile("bvnsave.sav",_loc2_);
         trace("saveData",_loc2_);
      }
      
      public function loadGame() : Object
      {
         var _loc3_:String = FileUtils.getAppFloderFileUrl("bvnsave.sav");
         var _loc1_:String = FileUtils.readTextFile(_loc3_);
         if(!_loc1_)
         {
            return null;
         }
         return JSON.parse(_loc1_);
      }
      
      public function getFighterCtrl(param1:int) : IFighterActionCtrl
      {
         return null;
      }
      
      public function getGameMenu() : Array
      {
         var a:Array = [{
            "txt":"TEAM PLAY",
            "cn":"小队模式",
            "children":[{
               "txt":"TEAM ACRADE",
               "cn":"闯关模式"
            },{
               "txt":"TEAM VS PEOPLE",
               "cn":"2P对战"
            },{
               "txt":"TEAM VS CPU",
               "cn":"对战电脑"
            }]
         },{
            "txt":"SINGLE PLAY",
            "cn":"单人模式",
            "children":[{
               "txt":"SINGLE ACRADE",
               "cn":"闯关模式"
            },{
               "txt":"SINGLE VS PEOPLE",
               "cn":"2P对战"
            },{
               "txt":"SINGLE VS CPU",
               "cn":"对战电脑"
            }]
         },{
            "txt":"LAN PLAY",
            "cn":"局域网对战",
            "func":function():void
            {
               LANGameCtrl.I.goLANGameState();
            }
         },{
            "txt":"OPTION",
            "cn":"游戏设置"
         },{
            "txt":"TRAINING",
            "cn":"练习模式"
         },{
            "txt":"CREDITS",
            "cn":"制作组"
         },{
            "txt":"MORE GAMES",
            "cn":"更多游戏"
         },{
            "txt":"EXIT",
            "cn":"退出游戏",
            "func":function():void
            {
               GameUI.confrim("EXIT GAME","退出游戏？",NativeApplication.nativeApplication.exit);
            }
         }];
         return a;
      }
      
      public function getSettingMenu() : Array
      {
         return [{
            "txt":"P1 KEY SET",
            "cn":"玩家1 按键设置"
         },{
            "txt":"P2 KEY SET",
            "cn":"玩家2 按键设置"
         },{
            "txt":"P1 JOYSTICK SET",
            "cn":"玩家1 手柄设置",
            "select":ViewManager.I.goP1JoyStickSet
         },{
            "txt":"P2 JOYSTICK SET",
            "cn":"玩家2 手柄设置",
            "select":ViewManager.I.goP2JoyStickSet
         },{
            "txt":"COM LEVEL",
            "cn":"电脑等级",
            "options":[{
               "label":"VERY EASY",
               "cn":"非常简单",
               "value":1
            },{
               "label":"EASY",
               "cn":"简单",
               "value":2
            },{
               "label":"NORMAL",
               "cn":"正常",
               "value":3
            },{
               "label":"HARD",
               "cn":"困难",
               "value":4
            },{
               "label":"VERY HARD",
               "cn":"非常困难",
               "value":5
            },{
               "label":"HELL",
               "cn":"地狱",
               "value":6
            }],
            "optoinKey":"AI_level"
         },{
            "txt":"OPERATE MODE",
            "cn":"按键操作模式",
            "options":[{
               "label":"NORMAL",
               "cn":"正常模式",
               "value":0
            },{
               "label":"CLASSIC",
               "cn":"经典模式",
               "value":1
            }],
            "optoinKey":"keyInputMode"
         },{
            "txt":"LIFE",
            "cn":"生命值",
            "options":[{
               "label":"50%",
               "cn":"50%",
               "value":0.5
            },{
               "label":"100%",
               "cn":"100%",
               "value":1
            },{
               "label":"200%",
               "cn":"200%",
               "value":2
            },{
               "label":"300%",
               "cn":"300%",
               "value":3
            },{
               "label":"500%",
               "cn":"500%",
               "value":5
            }],
            "optoinKey":"fighterHP"
         },{
            "txt":"TIME",
            "cn":"对战时间",
            "options":[{
               "label":"30s",
               "cn":"30秒",
               "value":30
            },{
               "label":"60s",
               "cn":"60秒",
               "value":60
            },{
               "label":"90s",
               "cn":"90秒",
               "value":90
            },{
               "label":"∞",
               "cn":"无限制",
               "value":-1
            }],
            "optoinKey":"fightTime"
         },{
            "txt":"QUALITY",
            "cn":"画质等级",
            "options":[{
               "label":"LOW",
               "cn":"低",
               "value":"low"
            },{
               "label":"MEDIUM",
               "cn":"中",
               "value":"medium"
            },{
               "label":"HIGH",
               "cn":"高",
               "value":"high"
            },{
               "label":"BEST",
               "cn":"最高",
               "value":"best"
            }],
            "optoinKey":"quality"
         },{
            "txt":"DISPLAY MODE",
            "cn":"显示模式",
            "options":[{
               "label":"FULLSCREEN",
               "cn":"全屏",
               "value":true
            },{
               "label":"WINDOW",
               "cn":"窗口",
               "value":false
            }],
            "optoinKey":"isFullScreen"
         }];
      }
      
      public function getGameInput(param1:String) : Vector.<IGameInput>
      {
         var _loc2_:Vector.<IGameInput> = new Vector.<IGameInput>();
         switch(param1)
         {
            case "MENU":
               _loc2_.push(InputManager.I.key_menu);
               _loc2_.push(InputManager.I.joy_menu);
               break;
            case "P1":
               _loc2_.push(InputManager.I.key_p1);
               _loc2_.push(InputManager.I.joy_p1);
               _loc2_.push(InputManager.I.socket_input_p1);
               break;
            case "P2":
               _loc2_.push(InputManager.I.key_p2);
               _loc2_.push(InputManager.I.joy_p2);
               _loc2_.push(InputManager.I.socket_input_p2);
               break;
            default:
               return null;
         }
         return _loc2_;
      }
      
      public function getConfigExtend() : IExtendConfig
      {
         return _extendsConfig;
      }
      
      public function afterBuildGame() : void
      {
         var _loc1_:MapMain = GameCtrl.I.gameState.getMap();
         if(_loc1_.mapLayer)
         {
            _loc1_.mapLayer.cacheAsBitmapMatrix = new Matrix();
         }
         if(_loc1_.frontLayer)
         {
            _loc1_.frontLayer.cacheAsBitmapMatrix = new Matrix();
         }
         if(_loc1_.frontFixLayer)
         {
            _loc1_.frontFixLayer.cacheAsBitmapMatrix = new Matrix();
         }
         if(_loc1_.bgLayer)
         {
            _loc1_.bgLayer.cacheAsBitmap = true;
         }
      }
      
      public function updateInputConfig() : Boolean
      {
         if(LANServerCtrl.I.active || LANClientCtrl.I.active)
         {
            InputManager.I.key_menu.enabled = false;
            InputManager.I.key_p1.enabled = false;
            InputManager.I.key_p2.enabled = false;
            InputManager.I.joy_menu.enabled = false;
            InputManager.I.joy_p1.enabled = false;
            InputManager.I.joy_p2.enabled = false;
            InputManager.I.socket_input_p1.enabled = true;
            InputManager.I.socket_input_p2.enabled = true;
            if(LANServerCtrl.I.active)
            {
               InputManager.I.socket_input_p1.setInputers([InputManager.I.key_p1,InputManager.I.joy_p1]);
            }
            if(LANClientCtrl.I.active)
            {
               InputManager.I.key_p2.setConfig(GameData.I.config.key_p1);
               InputManager.I.joy_p2.setConfig(_extendsConfig.joy1Config);
               InputManager.I.socket_input_p2.setInputers([InputManager.I.key_p2,InputManager.I.joy_p2]);
            }
            return true;
         }
         InputManager.I.key_menu.setConfig(GameData.I.config.key_menu);
         InputManager.I.key_p1.setConfig(GameData.I.config.key_p1);
         InputManager.I.key_p2.setConfig(GameData.I.config.key_p2);
         InputManager.I.joy_menu.setConfig(_extendsConfig.joyMenuConfig);
         InputManager.I.joy_p1.setConfig(_extendsConfig.joy1Config);
         InputManager.I.joy_p2.setConfig(_extendsConfig.joy2Config);
         InputManager.I.socket_input_p1.enabled = false;
         InputManager.I.socket_input_p2.enabled = false;
         return true;
      }
      
      public function applyConfig(param1:ConfigVO) : void
      {
         switch(param1.quality)
         {
            case "best":
               MainGame.I.stage.quality = "16x16";
               MainGame.I.setFPS(60);
               GameConfig.FPS_SHINE_EFFECT = 60;
               break;
            case "higher":
               MainGame.I.stage.quality = "8x8";
               MainGame.I.setFPS(60);
               GameConfig.FPS_SHINE_EFFECT = 30;
               break;
            case "high":
               MainGame.I.stage.quality = "high";
               MainGame.I.setFPS(60);
               GameConfig.FPS_SHINE_EFFECT = 30;
               break;
            case "medium":
               MainGame.I.stage.quality = "high";
               MainGame.I.setFPS(45);
               GameConfig.FPS_SHINE_EFFECT = 15;
               break;
            case "low":
               MainGame.I.stage.quality = "high";
               MainGame.I.setFPS(30);
               GameConfig.FPS_SHINE_EFFECT = 10;
         }
         if(_extendsConfig.isFullScreen)
         {
            MainGame.I.stage.displayState = "fullScreenInteractive";
         }
         else
         {
            MainGame.I.stage.displayState = "normal";
         }
      }
      
      public function getCreadits(param1:String) : Sprite
      {
         var alipay:Sprite;
         var weixin:Sprite;
         var creditsInfo:String = param1;
         var payOverHandler:* = function(param1:MouseEvent):void
         {
            if(param1.currentTarget == alipay)
            {
               alipay.alpha = 1;
               weixin.alpha = 0.2;
            }
            if(param1.currentTarget == weixin)
            {
               alipay.alpha = 0.2;
               weixin.alpha = 1;
            }
         };
         var sp:Sprite = new Sprite();
         creditsInfo += "游戏官网 : <a href=\"" + URL.markURL("http://www.5dplay.net/") + "\" target=\"_blank\">www.5dplay.net</a>" + "<br/>";
         creditsInfo += "游戏论坛 : <a href=\"" + URL.markURL("http://bbs.5dplay.net/") + "\" target=\"_blank\">bbs.5dplay.net</a>" + "<br/>";
         creditsInfo += "游戏做到今天非常不易，期待您的捐赠（金额不限），谢谢！";
         var txt:TextField = new TextField();
         var tf:TextFormat = new TextFormat();
         tf.font = "微软雅黑";
         tf.size = 20;
         tf.color = 16776960;
         tf.leading = 15;
         txt.defaultTextFormat = tf;
         txt.multiline = true;
         txt.htmlText = creditsInfo;
         txt.autoSize = "left";
         txt.x = 50;
         txt.y = 30;
         sp.addChild(txt);
         alipay = PayUtils.getPaySp(EmbedAssetUtils.getAlipay());
         alipay.y = 400;
         alipay.x = 430;
         alipay.width = 150;
         alipay.height = 194;
         alipay.alpha = 0.2;
         alipay.addEventListener("mouseOver",payOverHandler);
         sp.addChild(alipay);
         weixin = PayUtils.getPaySp(EmbedAssetUtils.getWeixin());
         weixin.y = 400;
         weixin.x = alipay.x + 200;
         weixin.width = 150;
         weixin.height = 194;
         weixin.addEventListener("mouseOver",payOverHandler);
         sp.addChild(weixin);
         return sp;
      }
   }
}

