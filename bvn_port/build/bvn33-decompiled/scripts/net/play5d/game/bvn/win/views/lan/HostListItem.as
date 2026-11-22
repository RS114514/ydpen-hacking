package net.play5d.game.bvn.win.views.lan
{
   import flash.display.MovieClip;
   import flash.events.Event;
   import net.play5d.game.bvn.win.data.HostVO;
   import net.play5d.game.bvn.win.utils.LANUtils;
   import net.play5d.game.bvn.win.utils.UIAssetUtil;
   
   public class HostListItem
   {
      
      public var ui:MovieClip;
      
      public var data:HostVO;
      
      private var _mouseListener:Function;
      
      private var _focus:Boolean;
      
      public function HostListItem()
      {
         super();
         ui = UIAssetUtil.I.createDisplayObject("hostlist_item");
         ui.mouseChildren = false;
         ui.buttonMode = true;
      }
      
      public function setData(param1:HostVO) : void
      {
         this.data = param1;
         ui.txt_name.text = param1.getListName();
         ui.txt_mode.text = param1.getGameModeStr();
         ui.txt_time.text = LANUtils.getTimeStr(param1.updateTime);
         ui.lock.visible = param1.password != null && param1.password != "";
      }
      
      public function focus(param1:Boolean) : void
      {
         if(_focus == param1)
         {
            return;
         }
         _focus = param1;
         if(param1)
         {
            ui.focusmc.gotoAndPlay("loop");
         }
         else
         {
            ui.focusmc.gotoAndStop(1);
         }
      }
      
      public function setMouseListener(param1:Function) : void
      {
         _mouseListener = param1;
         ui.addEventListener("mouseOver",mouseHandler);
         ui.addEventListener("click",mouseHandler);
      }
      
      public function removeMouseListener() : void
      {
         _mouseListener = null;
         ui.removeEventListener("mouseOver",mouseHandler);
         ui.removeEventListener("click",mouseHandler);
      }
      
      private function mouseHandler(param1:Event) : void
      {
         if(_mouseListener != null)
         {
            _mouseListener(param1.type,this);
         }
      }
   }
}

