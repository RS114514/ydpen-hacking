package net.play5d.game.bvn.win.views.lan
{
   import flash.display.DisplayObject;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.text.TextField;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.GameRender;
   import net.play5d.game.bvn.ctrl.SoundCtrl;
   import net.play5d.game.bvn.input.GameInputer;
   import net.play5d.game.bvn.win.ctrls.LANClientCtrl;
   import net.play5d.game.bvn.win.data.HostVO;
   import net.play5d.game.bvn.win.utils.UIAssetUtil;
   import net.play5d.kyo.stage.Istage;
   import net.play5d.kyo.utils.KyoBtnUtils;
   
   public class HostListDialog implements Istage
   {
      
      public var onClose:Function;
      
      private var ui:Sprite;
      
      private var _txtPage:TextField;
      
      private var _txtTotalpage:TextField;
      
      private var _btns:Array;
      
      private var _items:Array = [];
      
      private var _focusIndex:int;
      
      private var _hosts:Vector.<HostVO>;
      
      private var _page:int = 1;
      
      private var _totalPage:int = 1;
      
      private var _perpage:int = 10;
      
      public function HostListDialog()
      {
         super();
         GameRender.add(render,this);
      }
      
      public function findHosts() : void
      {
         removeItems();
         _hosts = new Vector.<HostVO>();
         _page = 1;
         _totalPage = 1;
         LANClientCtrl.I.findHost(findHostHandler);
      }
      
      private function findHostHandler(param1:HostVO) : void
      {
         for each(var _loc2_:HostVO in _hosts)
         {
            if(_loc2_.ip == param1.ip)
            {
               return;
            }
         }
         addHost(param1);
      }
      
      private function addHost(param1:HostVO) : void
      {
         _hosts.push(param1);
         _totalPage = _hosts.length / _perpage + 1;
         if(_items.length < _perpage)
         {
            createItem(param1);
         }
         updatePage();
      }
      
      private function updatePage() : void
      {
         _txtPage.text = _page.toString();
         _txtTotalpage.text = _totalPage.toString() + "页";
      }
      
      private function render() : void
      {
         var _loc2_:HostListItem = null;
         var _loc1_:HostListItem = null;
         if(GameInputer.up("MENU",1))
         {
            _loc2_ = _items[_focusIndex - 1];
            if(_loc2_)
            {
               SoundCtrl.I.sndSelect();
               focusItem(_loc2_);
            }
            else if(prevPage())
            {
               focusItem(_items[_items.length - 1]);
               SoundCtrl.I.sndSelect();
            }
         }
         if(GameInputer.down("MENU",1))
         {
            _loc1_ = _items[_focusIndex + 1];
            if(_loc1_)
            {
               SoundCtrl.I.sndSelect();
               focusItem(_loc1_);
            }
            else if(nextPage())
            {
               SoundCtrl.I.sndSelect();
            }
         }
         if(GameInputer.left("MENU",1))
         {
            if(prevPage())
            {
               SoundCtrl.I.sndSelect();
            }
         }
         if(GameInputer.right("MENU",1))
         {
            if(nextPage())
            {
               SoundCtrl.I.sndSelect();
            }
         }
      }
      
      private function removeItems() : void
      {
         for each(var _loc1_:HostListItem in _items)
         {
            _loc1_.removeMouseListener();
            try
            {
               ui.removeChild(_loc1_.ui);
            }
            catch(e:Error)
            {
            }
         }
         _items = [];
      }
      
      private function createItem(param1:HostVO) : HostListItem
      {
         var _loc2_:HostListItem = new HostListItem();
         _loc2_.setMouseListener(itemMouseHandler);
         _loc2_.setData(param1);
         _loc2_.ui.x = 25;
         _loc2_.ui.y = 96 + _items.length * 40;
         _items.push(_loc2_);
         ui.addChild(_loc2_.ui);
         return _loc2_;
      }
      
      private function updateList() : void
      {
         var _loc3_:int = 0;
         removeItems();
         var _loc1_:int = (_page - 1) * _perpage;
         var _loc2_:int = _loc1_ + _perpage;
         if(_loc2_ > _hosts.length)
         {
            _loc2_ = int(_hosts.length);
         }
         _loc3_ = _loc1_;
         while(_loc3_ < _loc2_)
         {
            createItem(_hosts[_loc3_]);
            _loc3_++;
         }
         focusItem(_items[0]);
      }
      
      private function itemMouseHandler(param1:String, param2:HostListItem) : void
      {
         if(param1 == "mouseOver")
         {
            SoundCtrl.I.sndSelect();
            focusItem(param2);
         }
         if(param1 == "click")
         {
            SoundCtrl.I.sndConfrim();
            showHostDetail(param2.data);
         }
      }
      
      private function showHostDetail(param1:HostVO) : void
      {
         var _loc2_:HostDetailDialog = new HostDetailDialog();
         MainGame.stageCtrl.addLayer(_loc2_,0,0);
         _loc2_.setData(param1);
      }
      
      private function focusItem(param1:HostListItem) : void
      {
         var _loc3_:int = 0;
         var _loc2_:HostListItem = null;
         while(_loc3_ < _items.length)
         {
            _loc2_ = _items[_loc3_];
            if(_loc2_ == param1)
            {
               _loc2_.focus(true);
               _focusIndex = _loc3_;
            }
            else
            {
               _loc2_.focus(false);
            }
            _loc3_++;
         }
      }
      
      public function build() : void
      {
         ui = UIAssetUtil.I.createDisplayObject("game_list_ui");
         _txtPage = ui.getChildByName("txt_page") as TextField;
         _txtTotalpage = ui.getChildByName("txt_totalpage") as TextField;
         initBtns(["btn_back","btn_refresh","btn_prev","btn_next"]);
         LANClientCtrl.I.initlize();
         findHosts();
      }
      
      private function initBtns(param1:Array) : void
      {
         var _loc2_:SimpleButton = null;
         _btns = [];
         for each(var _loc3_:String in param1)
         {
            _loc2_ = ui.getChildByName(_loc3_) as SimpleButton;
            if(_loc2_)
            {
               _loc2_.addEventListener("click",btnHandler);
               KyoBtnUtils.initBtn(_loc2_,btnHandler,_loc2_.name);
               _btns.push(_loc2_);
            }
         }
      }
      
      private function btnHandler(param1:String) : void
      {
         switch(param1)
         {
            case "btn_back":
               close();
               break;
            case "btn_refresh":
               findHosts();
               break;
            case "btn_prev":
               prevPage();
               break;
            case "btn_next":
               nextPage();
         }
      }
      
      private function prevPage() : Boolean
      {
         if(_page <= 1)
         {
            return false;
         }
         _page = _page - 1;
         _txtPage.text = _page.toString();
         updateList();
         updatePage();
         return true;
      }
      
      private function nextPage() : Boolean
      {
         if(_page >= _totalPage)
         {
            return false;
         }
         _page = _page + 1;
         _txtPage.text = _page.toString();
         updateList();
         updatePage();
         return true;
      }
      
      public function close() : void
      {
         MainGame.stageCtrl.removeLayer(this);
         if(onClose != null)
         {
            onClose();
         }
      }
      
      public function afterBuild() : void
      {
      }
      
      public function get display() : DisplayObject
      {
         return ui;
      }
      
      public function destory(param1:Function = null) : void
      {
         GameRender.remove(render,this);
         LANClientCtrl.I.cancelFindHost();
         if(_btns)
         {
            for each(var _loc2_:SimpleButton in _btns)
            {
               _loc2_.removeEventListener("click",btnHandler);
               KyoBtnUtils.disposeBtn(_loc2_);
            }
            _btns = null;
         }
         removeItems();
      }
   }
}

