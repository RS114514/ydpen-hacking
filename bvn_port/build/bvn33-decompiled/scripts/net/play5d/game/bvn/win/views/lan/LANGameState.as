package net.play5d.game.bvn.win.views.lan
{
   import flash.display.DisplayObject;
   import flash.display.Sprite;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.AssetManager;
   import net.play5d.game.bvn.ctrl.SoundCtrl;
   import net.play5d.game.bvn.events.SetBtnEvent;
   import net.play5d.game.bvn.ui.SetBtnGroup;
   import net.play5d.game.bvn.win.utils.UIAssetUtil;
   import net.play5d.kyo.stage.Istage;
   
   public class LANGameState implements Istage
   {
      
      private var _ui:Sprite;
      
      private var _btnGroup:SetBtnGroup;
      
      private var _hostList:HostListDialog;
      
      public function LANGameState()
      {
         super();
      }
      
      public function get display() : DisplayObject
      {
         return _ui;
      }
      
      public function build() : void
      {
         _ui = UIAssetUtil.I.createDisplayObject("spr_lan");
         _btnGroup = new SetBtnGroup();
         _btnGroup.setBtnData([{
            "label":"JOIN GAME",
            "cn":"加入游戏"
         },{
            "label":"BUILD GAME",
            "cn":"创建游戏"
         },{
            "label":"PROFILE",
            "cn":"个人信息"
         },{
            "label":"EXIT",
            "cn":"退出"
         }]);
         _btnGroup.addEventListener("SELECT",btnHandler);
         _ui.addChild(_btnGroup);
         SoundCtrl.I.BGM(AssetManager.I.getSound("continue"));
      }
      
      public function showHostList() : void
      {
         _btnGroup.keyEnable = false;
         _hostList = new HostListDialog();
         _hostList.onClose = onDialogClose;
         MainGame.stageCtrl.addLayer(_hostList,10,10);
      }
      
      private function btnHandler(param1:SetBtnEvent) : void
      {
         var _loc3_:LANHostCreateDialog = null;
         var _loc2_:ProfileDialog = null;
         switch(param1.selectedLabel)
         {
            case "JOIN GAME":
               showHostList();
               break;
            case "BUILD GAME":
               _btnGroup.keyEnable = false;
               _loc3_ = new LANHostCreateDialog();
               _loc3_.onCreate = onCreateHost;
               _loc3_.onClose = onDialogClose;
               MainGame.stageCtrl.addLayer(_loc3_,0,0);
               break;
            case "PROFILE":
               _btnGroup.keyEnable = false;
               _loc2_ = new ProfileDialog();
               _loc2_.onClose = onDialogClose;
               MainGame.stageCtrl.addLayer(_loc2_,0,0);
               break;
            case "EXIT":
               MainGame.I.goMenu();
         }
      }
      
      private function onDialogClose() : void
      {
         if(_btnGroup)
         {
            _btnGroup.keyEnable = true;
         }
      }
      
      private function onCreateHost() : void
      {
         var _loc1_:LANRoomState = new LANRoomState();
         MainGame.stageCtrl.goStage(_loc1_);
         _loc1_.hostMode();
      }
      
      public function afterBuild() : void
      {
      }
      
      public function destory(param1:Function = null) : void
      {
         if(_btnGroup)
         {
            _btnGroup.destory();
            _btnGroup = null;
         }
      }
   }
}

