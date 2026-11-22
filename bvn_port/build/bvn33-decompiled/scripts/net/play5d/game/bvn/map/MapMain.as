package net.play5d.game.bvn.map
{
   import flash.display.Bitmap;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import net.play5d.game.bvn.GameConfig;
   import net.play5d.game.bvn.data.GameData;
   import net.play5d.game.bvn.data.MapVO;
   import net.play5d.game.bvn.interfaces.IGameSprite;
   import net.play5d.game.bvn.state.GameState;
   import net.play5d.kyo.utils.KyoUtils;
   
   public class MapMain
   {
      
      public var mapLayer:MovieClip;
      
      public var frontLayer:Sprite;
      
      public var frontFixLayer:Sprite;
      
      public var bgLayer:Bitmap;
      
      public var p1pos:Point;
      
      public var p2pos:Point;
      
      public var left:Number = 0;
      
      public var right:Number = 0;
      
      public var bottom:Number = 0;
      
      public var playerBottom:Number = 0;
      
      public var mapMc:Sprite;
      
      public var data:MapVO;
      
      public var gameState:GameState;
      
      private var _defaultFrontPos:Point;
      
      private var _floors:Array;
      
      public function MapMain(param1:Sprite)
      {
         super();
         this.mapMc = param1;
      }
      
      public function destory() : void
      {
         if(mapMc)
         {
            try
            {
               mapMc.stopAllMovieClips();
               mapMc.removeChildren();
            }
            catch(e:Error)
            {
               trace(e);
            }
            mapMc = null;
         }
         if(mapLayer)
         {
            mapLayer = null;
         }
         if(frontLayer)
         {
            frontLayer = null;
         }
         if(frontFixLayer)
         {
            frontFixLayer = null;
         }
         if(bgLayer)
         {
            bgLayer.bitmapData.dispose();
            bgLayer = null;
         }
      }
      
      public function setVisible(param1:Boolean) : void
      {
         if(false && param1)
         {
            return;
         }
         if(mapLayer)
         {
            mapLayer.visible = param1;
         }
         if(frontLayer)
         {
            frontLayer.visible = param1;
         }
         if(frontFixLayer)
         {
            frontFixLayer.visible = param1;
         }
         if(bgLayer)
         {
            bgLayer.visible = param1;
         }
      }
      
      public function initlize() : void
      {
         var _loc7_:DisplayObject = mapMc.getChildByName("line_left");
         var _loc8_:DisplayObject = mapMc.getChildByName("line_right");
         var _loc5_:DisplayObject = mapMc.getChildByName("line_bottom");
         var _loc4_:DisplayObject = mapMc.getChildByName("line_player_bottom");
         var _loc1_:Point = GameConfig.GAME_SIZE;
         if(_loc7_)
         {
            left = _loc7_.x;
         }
         if(_loc8_)
         {
            right = _loc8_.x;
         }
         if(_loc5_)
         {
            bottom = _loc5_.y;
         }
         if(_loc4_)
         {
            playerBottom = _loc4_.y;
         }
         var _loc2_:DisplayObject = mapMc.getChildByName("p1");
         var _loc6_:DisplayObject = mapMc.getChildByName("p2");
         if(_loc2_)
         {
            p1pos = new Point(_loc2_.x,_loc2_.y);
         }
         if(_loc6_)
         {
            p2pos = new Point(_loc6_.x,_loc6_.y);
         }
         mapLayer = mapMc.getChildByName("map") as MovieClip;
         frontLayer = mapMc.getChildByName("front") as Sprite;
         frontFixLayer = mapMc.getChildByName("front_fix") as Sprite;
         bgLayer = drawBitmap("bg",false,0);
         if(bgLayer)
         {
            normalizeLayer(bgLayer);
         }
         var _loc3_:Number = _loc1_.y - bottom;
         if(mapLayer)
         {
            normalizeLayer(mapLayer);
            mapLayer.y += _loc3_;
         }
         if(frontLayer)
         {
            normalizeLayer(frontLayer);
            frontLayer.y += _loc3_;
            _defaultFrontPos = new Point(frontLayer.x,frontLayer.y);
         }
         if(frontFixLayer)
         {
            normalizeLayer(frontFixLayer);
            frontFixLayer.y += _loc3_;
         }
         playerBottom += _loc3_;
         bottom += _loc3_;
         if(p1pos)
         {
            p1pos.y += _loc3_;
         }
         if(p2pos)
         {
            p2pos.y += _loc3_;
         }
         initFloor(_loc3_);
      }
      
      private function drawBitmap(param1:String, param2:Boolean = true, param3:uint = 0) : Bitmap
      {
         var _loc4_:* = null;
         var _loc5_:DisplayObject = mapMc.getChildByName(param1);
         if(_loc5_)
         {
            return KyoUtils.drawDisplay(_loc5_,true,param2,param3);
         }
         return null;
      }
      
      private function normalizeLayer(param1:DisplayObject) : void
      {
         var _loc3_:Sprite = null;
         var _loc5_:int = 0;
         var _loc2_:DisplayObject = null;
         var _loc4_:DisplayObject = null;
         if(param1 is Bitmap)
         {
            (param1 as Bitmap).smoothing = GameData.I.config.quality == "best";
         }
         if(param1 is Sprite)
         {
            _loc3_ = param1 as Sprite;
            while(_loc5_ < _loc3_.numChildren)
            {
               _loc2_ = _loc3_.getChildAt(_loc5_);
               if(_loc2_ is Bitmap)
               {
                  (_loc2_ as Bitmap).smoothing = GameData.I.config.quality == "best";
               }
               _loc5_++;
            }
            if(GameConfig.MAP_LOGO_STATE != 1)
            {
               _loc4_ = _loc3_.getChildByName("logo4399");
               if(_loc4_)
               {
                  _loc4_.visible = false;
               }
            }
         }
      }
      
      public function getStageSize() : Point
      {
         return new Point(mapLayer.width,GameConfig.GAME_SIZE.y);
      }
      
      public function getMapBottomDistance() : Number
      {
         return bottom - playerBottom;
      }
      
      private function initFloor(param1:Number) : void
      {
         var _loc5_:int = 0;
         var _loc2_:DisplayObject = null;
         var _loc4_:FloorVO = null;
         _floors = [];
         var _loc3_:Sprite = mapMc.getChildByName("floor") as Sprite;
         if(!_loc3_)
         {
            return;
         }
         while(_loc5_ < _loc3_.numChildren)
         {
            _loc2_ = _loc3_.getChildAt(_loc5_);
            if(_loc2_)
            {
               _loc4_ = new FloorVO();
               _loc4_.xFrom = _loc3_.x + _loc2_.x;
               _loc4_.xTo = _loc3_.x + _loc2_.x + _loc2_.width;
               _loc4_.y = _loc3_.y + _loc2_.y + param1;
               _floors.push(_loc4_);
            }
            _loc5_++;
         }
      }
      
      public function getFloorHitTest(param1:Number, param2:Number, param3:Number) : FloorVO
      {
         var _loc5_:int = 0;
         var _loc4_:FloorVO = null;
         while(_loc5_ < _floors.length)
         {
            _loc4_ = _floors[_loc5_];
            if(_loc4_.hitTest(param1,param2,param3))
            {
               return _loc4_;
            }
            _loc5_++;
         }
         return null;
      }
      
      public function render(param1:Number, param2:Number, param3:Number) : void
      {
         var _loc5_:Number = NaN;
         var _loc4_:Number = NaN;
         var _loc6_:Number = NaN;
         if(frontLayer)
         {
            _loc5_ = param1;
            _loc4_ = param2 + bottom;
            frontLayer.x = _loc5_ * 0.1 + _defaultFrontPos.x;
            _loc6_ = _defaultFrontPos.y;
            _loc6_ = _loc4_ * 0.1 + _defaultFrontPos.y;
            _loc6_ < _defaultFrontPos.y && (_loc6_);
            frontLayer.y = _loc6_;
            renderOptical(frontLayer);
         }
         if(frontFixLayer)
         {
            renderOptical(frontFixLayer);
         }
      }
      
      private function renderOptical(param1:Sprite) : void
      {
         var _loc3_:Rectangle = null;
         var _loc2_:DisplayObject = null;
         var _loc6_:int = 0;
         if(!gameState)
         {
            return;
         }
         var _loc5_:int = param1.numChildren;
         if(_loc5_ < 1)
         {
            return;
         }
         var _loc4_:Vector.<IGameSprite> = gameState.getGameSprites();
         if(!_loc4_ || _loc4_.length < 1)
         {
            return;
         }
         while(_loc6_ < _loc5_)
         {
            _loc2_ = param1.getChildAt(_loc6_);
            if(_loc2_ is MovieClip != false)
            {
               _loc3_ = _loc2_.getBounds(param1);
               _loc3_.x += param1.x;
               _loc3_.y += param1.y;
               _loc2_.alpha = checkHitGameSprite(_loc3_,_loc4_) ? 0.5 : 1;
            }
            _loc6_++;
         }
      }
      
      private function checkHitGameSprite(param1:Rectangle, param2:Vector.<IGameSprite>) : Boolean
      {
         var _loc4_:int = 0;
         var _loc6_:IGameSprite = null;
         var _loc5_:Boolean = false;
         var _loc3_:Rectangle = null;
         while(_loc4_ < param2.length)
         {
            _loc6_ = param2[_loc4_];
            if(_loc6_)
            {
               _loc3_ = _loc6_.getArea();
               if(_loc3_)
               {
                  _loc5_ = param1.intersects(_loc3_);
                  if(_loc5_)
                  {
                     return true;
                  }
               }
            }
            _loc4_++;
         }
         return false;
      }
   }
}

