package net.play5d.game.bvn.ctrl
{
   import flash.display.DisplayObject;
   import flash.display.Loader;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import net.play5d.game.bvn.Debugger;
   import net.play5d.game.bvn.data.AssisterModel;
   import net.play5d.game.bvn.data.FighterModel;
   import net.play5d.game.bvn.data.FighterVO;
   import net.play5d.game.bvn.data.MapModel;
   import net.play5d.game.bvn.data.MapVO;
   import net.play5d.game.bvn.fighter.Assister;
   import net.play5d.game.bvn.fighter.FighterMain;
   import net.play5d.game.bvn.map.MapMain;
   
   public class GameLoader
   {
      
      private static var _loaderCache:Vector.<Loader> = new Vector.<Loader>();
      
      public function GameLoader()
      {
         super();
      }
      
      public static function loadFighter(param1:String, param2:Function, param3:Function = null, param4:Function = null, param5:Object = null) : void
      {
         var fighterId:String = param1;
         var back:Function = param2;
         var fail:Function = param3;
         var process:Function = param4;
         var customBackParam:Object = param5;
         var loadComplete:* = function(param1:DisplayObject):void
         {
            var _loc2_:FighterMain = new FighterMain(param1 as MovieClip);
            _loc2_.data = fv;
            if(back != null)
            {
               if(customBackParam)
               {
                  back(_loc2_,customBackParam);
               }
               else
               {
                  back(_loc2_);
               }
               back = null;
            }
         };
         var fv:FighterVO = FighterModel.I.getFighter(fighterId,true);
         if(!fv)
         {
            trace("GameLoader.loadFighter :: ID不存在:",fighterId);
            if(fail != null)
            {
               fail("角色ID错误");
            }
            return;
         }
         loadSWF(fv.fileUrl,loadComplete,fail,process);
      }
      
      public static function loadAssister(param1:String, param2:Function, param3:Function = null, param4:Function = null, param5:Object = null) : void
      {
         var fighterId:String = param1;
         var back:Function = param2;
         var fail:Function = param3;
         var process:Function = param4;
         var customBackParam:Object = param5;
         var loadComplete:* = function(param1:DisplayObject):void
         {
            var _loc2_:Assister = new Assister(param1 as MovieClip);
            _loc2_.data = fv;
            if(back != null)
            {
               if(customBackParam)
               {
                  back(_loc2_,customBackParam);
               }
               else
               {
                  back(_loc2_);
               }
               back = null;
            }
         };
         var fv:FighterVO = AssisterModel.I.getAssister(fighterId,true);
         if(!fv)
         {
            trace("GameLoader.loadAssister :: ID不存在:",fighterId);
            if(fail != null)
            {
               fail("角色ID错误");
            }
            return;
         }
         loadSWF(fv.fileUrl,loadComplete,fail,process);
      }
      
      public static function loadMap(param1:String, param2:Function, param3:Function = null, param4:Function = null, param5:Object = null) : void
      {
         var mapId:String = param1;
         var back:Function = param2;
         var fail:Function = param3;
         var process:Function = param4;
         var customBackParam:Object = param5;
         var loadComplete:* = function(param1:DisplayObject):void
         {
            var _loc2_:MapMain = new MapMain(param1 as Sprite);
            _loc2_.data = mv;
            if(back != null)
            {
               if(customBackParam)
               {
                  back(_loc2_,customBackParam);
               }
               else
               {
                  back(_loc2_);
               }
               back = null;
            }
         };
         var mv:MapVO = MapModel.I.getMap(mapId);
         if(!mv)
         {
            trace("GameLoader.loadMap :: ID不存在:",mapId);
            if(fail != null)
            {
               fail("场景ID错误");
            }
            return;
         }
         loadSWF(mv.fileUrl,loadComplete,fail,process);
      }
      
      public static function dispose() : void
      {
         var _loc1_:Loader = null;
         while(_loaderCache.length)
         {
            _loc1_ = _loaderCache.shift();
            try
            {
               _loc1_.unloadAndStop(true);
            }
            catch(e:Error)
            {
               trace("GameLoader ::",e);
               _loc1_.unload();
            }
         }
      }
      
      private static function loadSWF(param1:String, param2:Function, param3:Function = null, param4:Function = null) : void
      {
         var url:String = param1;
         var back:Function = param2;
         var fail:Function = param3;
         var process:Function = param4;
         var loadComplete:* = function(param1:Loader):void
         {
            if(back != null)
            {
               back(param1.content);
               back = null;
            }
            _loaderCache.push(param1);
         };
         var loadIOError:* = function():void
         {
            Debugger.log("GameLoader.loadSWF :: 找不到文件:",url);
            if(fail != null)
            {
               fail("加载场景文件错误");
            }
         };
         AssetManager.I.loadSWF(url,loadComplete,loadIOError,process);
      }
   }
}

