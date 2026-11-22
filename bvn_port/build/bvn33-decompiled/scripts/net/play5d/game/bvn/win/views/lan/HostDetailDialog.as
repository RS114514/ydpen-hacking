package net.play5d.game.bvn.win.views.lan
{
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import net.play5d.game.bvn.MainGame;
   import net.play5d.game.bvn.ctrl.SoundCtrl;
   import net.play5d.game.bvn.ui.GameUI;
   import net.play5d.game.bvn.win.ctrls.LANClientCtrl;
   import net.play5d.game.bvn.win.data.HostVO;
   import net.play5d.game.bvn.win.utils.LANUtils;
   import net.play5d.game.bvn.win.utils.UIAssetUtil;
   import net.play5d.kyo.stage.Istage;
   
   public class HostDetailDialog implements Istage
   {
      
      private var _ui:MovieClip;
      
      private var _data:HostVO;
      
      public function HostDetailDialog()
      {
         super();
      }
      
      public function get display() : DisplayObject
      {
         return _ui;
      }
      
      public function build() : void
      {
         _ui = UIAssetUtil.I.createDisplayObject("detail_win_mc");
         _ui.btn_join.addEventListener("click",joinHandler);
         _ui.btn_close.addEventListener("click",close);
      }
      
      public function setData(param1:HostVO) : void
      {
         _data = param1;
         _ui.txt_name.text = param1.name;
         _ui.txt_mode.text = "游戏模式：" + param1.getGameModeStr();
         _ui.txt_time.text = "创建时间：" + LANUtils.getTimeStr(param1.updateTime);
         if(param1.password)
         {
            initPass();
         }
         else
         {
            _ui.pass.visible = false;
         }
      }
      
      private function initPass() : void
      {
         _ui.pass.visible = true;
         _ui.pass.correct.visible = false;
         _ui.pass.txt.addEventListener("change",passChangeHandler);
      }
      
      private function passChangeHandler(param1:Event) : void
      {
         if(_ui.pass.txt.text == _data.password)
         {
            _ui.pass.correct.visible = true;
         }
         else
         {
            _ui.pass.correct.visible = false;
         }
      }
      
      private function joinHandler(param1:MouseEvent) : void
      {
         SoundCtrl.I.sndConfrim();
         if(_data.password)
         {
            if(_ui.pass.txt.text != _data.password)
            {
               GameUI.alert("FAIL","密码不正确");
               return;
            }
         }
         close();
         LANClientCtrl.I.join(_data,joinHostBack);
      }
      
      private function joinHostBack(param1:Boolean, param2:String) : void
      {
         var _loc3_:LANRoomState = null;
         if(param1)
         {
            _loc3_ = new LANRoomState();
            MainGame.stageCtrl.removeAllLayer();
            MainGame.stageCtrl.goStage(_loc3_);
            _loc3_.clientMode(_data);
         }
         else if(param2)
         {
            GameUI.alert("FAILED",param2);
         }
      }
      
      private function close(... rest) : void
      {
         MainGame.stageCtrl.removeLayer(this);
      }
      
      public function afterBuild() : void
      {
      }
      
      public function destory(param1:Function = null) : void
      {
         try
         {
            _ui.btn_join.removeEventListener("click",joinHandler);
            _ui.btn_close.removeEventListener("click",close);
         }
         catch(e:Error)
         {
         }
      }
   }
}

