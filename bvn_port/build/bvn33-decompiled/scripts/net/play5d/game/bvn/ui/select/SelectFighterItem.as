package net.play5d.game.bvn.ui.select
{
   import flash.display.DisplayObject;
   import flash.events.Event;
   import flash.events.EventDispatcher;
   import flash.geom.Point;
   import net.play5d.game.bvn.ctrl.AssetManager;
   import net.play5d.game.bvn.data.FighterVO;
   import net.play5d.game.bvn.data.SelectCharListItemVO;
   import net.play5d.game.bvn.utils.ResUtils;
   
   public class SelectFighterItem extends EventDispatcher
   {
      
      public var selectData:SelectCharListItemVO;
      
      public var fighterData:FighterVO;
      
      public var ui:slt_item_mc = ResUtils.I.createDisplayObject(ResUtils.I.select,"slt_item_mc");
      
      public var position:Point = new Point();
      
      private var faceSize:Point = new Point(50,50);
      
      private var _listeners:Object = {};
      
      public function SelectFighterItem(param1:FighterVO, param2:SelectCharListItemVO)
      {
         super();
         this.selectData = param2;
         this.fighterData = param1;
         var _loc3_:DisplayObject = AssetManager.I.getFighterFace(param1);
         if(_loc3_)
         {
            ui.ct.addChild(_loc3_);
         }
         ui.mouseChildren = false;
         ui.buttonMode = true;
      }
      
      override public function addEventListener(param1:String, param2:Function, param3:Boolean = false, param4:int = 0, param5:Boolean = false) : void
      {
         if(ui.hasEventListener(param1))
         {
            return;
         }
         ui.addEventListener(param1,selfHandler,param3,param4,param5);
         _listeners[param1] = param2;
      }
      
      public function removeAllEventListener() : void
      {
         for(var _loc1_:String in _listeners)
         {
            ui.removeEventListener(_loc1_,_listeners[_loc1_]);
         }
         _listeners = {};
      }
      
      private function selfHandler(param1:Event) : void
      {
         _listeners[param1.type](param1.type,this);
      }
      
      public function destory() : void
      {
         if(ui)
         {
            removeAllEventListener();
         }
         if(ui && ui.parent)
         {
            try
            {
               ui.parent.removeChild(ui);
            }
            catch(e:Error)
            {
            }
            ui = null;
         }
      }
   }
}

