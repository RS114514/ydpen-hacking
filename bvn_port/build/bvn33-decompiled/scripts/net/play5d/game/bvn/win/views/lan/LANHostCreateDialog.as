package net.play5d.game.bvn.win.views.lan
{
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.events.Event;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.SoundCtrl;
   import net.play5d.game.bvn.ui.GameUI;
   import net.play5d.game.bvn.win.ctrls.LANServerCtrl;
   import net.play5d.game.bvn.win.data.HostVO;
   import net.play5d.game.bvn.win.data.LanGameModel;
   import net.play5d.game.bvn.win.utils.UIAssetUtil;
   import net.play5d.kyo.stage.Istage;
   import net.play5d.kyo.utils.KyoBtnUtils;
   
   public class LANHostCreateDialog implements Istage
   {
      
      private var _ui:MovieClip;
      
      public var onCreate:Function;
      
      public var onClose:Function;
      
      public function LANHostCreateDialog()
      {
         super();
      }
      
      public function get display() : DisplayObject
      {
         return _ui;
      }
      
      public function close() : void
      {
         if(onClose != null)
         {
            onClose();
         }
         MainGame.stageCtrl.removeLayer(this);
      }
      
      public function build() : void
      {
         _ui = UIAssetUtil.I.createDisplayObject("build_win_mc");
         _ui.check_pass.addEventListener("change",checkHandler);
         KyoBtnUtils.initBtn(_ui.btn_ok,btnHandler);
         KyoBtnUtils.initBtn(_ui.btn_close,close);
         _ui.txt_pass.visible = false;
         _ui.comb_mode.addItem({
            "label":"TEAM VS - 小队模式",
            "data":1
         });
      }
      
      private function btnHandler() : void
      {
         SoundCtrl.I.sndConfrim();
         var _loc2_:String = _ui.txt_hostname.text;
         var _loc4_:String = "";
         var _loc3_:int = int(_ui.comb_mode.selectedItem.data);
         if(_loc2_ == "")
         {
            GameUI.alert("ERROR","请输入主机名称");
            return;
         }
         if(_ui.check_pass.selected)
         {
            _loc4_ = _ui.txt_pass.text;
         }
         var _loc1_:HostVO = new HostVO();
         _loc1_.name = _loc2_;
         _loc1_.gameMode = _loc3_;
         _loc1_.password = _loc4_;
         _loc1_.ownerName = LanGameModel.I.playerName;
         _loc1_.tcpPort = 17511;
         _loc1_.udpPort = 17477;
         LANServerCtrl.I.startServer(_loc1_);
         if(onCreate != null)
         {
            onCreate();
         }
         close();
      }
      
      private function checkHandler(param1:Event) : void
      {
         _ui.txt_pass.visible = _ui.check_pass.selected;
      }
      
      public function afterBuild() : void
      {
      }
      
      public function destory(param1:Function = null) : void
      {
         _ui.btn_ok.removeEventListener("click",btnHandler);
         _ui.check_pass.removeEventListener("change",checkHandler);
         KyoBtnUtils.disposeBtn(_ui.btn_ok);
         KyoBtnUtils.disposeBtn(_ui.btn_close);
      }
   }
}

