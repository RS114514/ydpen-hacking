*
	; 選択肢配置領域の指定
	;[selopt left=0 top=60 width=800 height=360 shadow bold shadowColor=0 color=0xCBCACB overColor=0xFFFFFF]
	;[selopt left=0 top=60 width=1280 height=600]
	;normal="select_normal" over="select_over" entersebuf=8 clicksebuf=9
	;enterse='' clickse=''
	[selopt msgon left=0 top=60 width=1280 height=500 motion=select.psb chara=SELECT shadow size=26]

	; ヒストリレイヤの uipsd
	;[historyopt storage=backlog]

	; ゲーム中の右クリックメニューのデフォルト設定を変更
	; [sysrclickopt enabled=true call=true storage=sysmenu.ks target=""]

	; メッセージウィンドウの uipsd
	; メッセージウィンドウのオプション
	;[meswinopt layer=message0 storage=text_window opacity=255 faceLeft=0 faceTop=0 faceWidth=150 faceHeight=150 nameLeft=181 nameTop=24 nameWidth=166 nameHeight=26 nameAlign=0 marginL=181 marginT=46 marginR=70 marginB=20 transparent=true visible=false]
	[meswinopt  layer=message0 storage=window visible=false transparent=true fix=true nameAlign=-1 nameVAlign=0 nameabsolute=2 textabsolute=3]

	; 辞書
	;;[encyclopedia color=0xFFC0C0]

	[addSysScript name="game" storage="start"]
	[addSysScript name="extramode" storage="extra.ks"]

	[addSysHook   name="first.logo"  call storage="custom.ks" target=*logo]
	[addSysHook   name="title.loop"  call storage="custom.ks" target=*title]
	[addSysHook   name="title.extra" jump storage="custom.ks" target=*extra]

	[addSysScript name="title.from.option"    storage="custom.ks" target=*title_restore]
	[addSysScript name="title.from.load"      storage="custom.ks" target=*title_restore]
	[addSysScript name="title.from.save"      storage="custom.ks" target=*title_restore]
	[addSysScript name="title.from.game"      storage="custom.ks" target=*title]
	[addSysScript name="title.from.exchview"  storage="custom.ks" target=*title_restore]
	[addSysScript name="title.from.extramode" storage="custom.ks" target=*title_restore]
	[addSysScript name="scenemode.from.game"  storage="custom.ks" target=*extra_restore]

	[addSysHook   name="title.game" call storage="custom.ks" target=*title_game]
	[addSysHook   name="option.start" jump storage="custom.ks" target=*option_start]
	[addSysHook   name="option.back" call storage="custom.ks" target=*common_back]
	[addSysHook   name="load.start" jump storage="custom.ks" target=*load_start]
	[addSysHook   name="load.back" call storage="custom.ks" target=*common_back]
	[addSysHook   name="save.start" jump storage="custom.ks" target=*save_start]
	[addSysHook   name="save.back" call storage="custom.ks" target=*common_back]
	[addSysHook   name="backlog.start" jump storage="custom.ks" target=*backlog_start]
	[addSysHook   name="backlog.back" jump storage="custom.ks" target=*backlog_back]

	[addSysHook   name="extramode.start.fromTitle"  jump storage="custom.ks" target=*extra_start]
	[addSysHook   name="extramode.back" jump storage="custom.ks" target=*extra_back]
	[addSysHook   name="extramode.page.init" call storage="custom.ks" target=*setflag_extra]
	[addSysHook   name="extramode.cg.init" jump storage="custom.ks" target=*view_cg]
	[addSysHook   name="extramode.cg.done" jump storage="custom.ks" target=*view_cg_done]

	[addSysHook   name="exchview.start" jump storage="custom.ks" target=*exchview_start]
	[addSysHook   name="exchview.back" jump storage="custom.ks" target=*exchview_back]
	[addSysHook   name="exchview.page.init" call storage="custom.ks" target=*setflag_chview]

	[addSysScript name="game.from.option"  storage="custom.ks" target=*option_return]
	[addSysScript name="game.from.load"  storage="custom.ks" target=*load_return]
	[addSysScript name="game.from.save"  storage="custom.ks" target=*save_return]

	[addSysScript name="save.from.load"  storage="custom.ks" target=*load_to_save]
	[addSysScript name="load.from.save"  storage="custom.ks" target=*save_to_load]

	[syscover visible color=0xFFFFFF]
	[return]

*caution
	;諸注意表示
	[stoptrans]
	[clearlayers]
	[backlay]
	[ev file=諸注意 notrans]
	[sysupdate]

	[clickskip enabled=true]

	[beginskip]
	[syscover time=500 visible=false]
	[wait time=9000]
	[endskip]

	[stage 白画面 trans=normal time=500 sync]
	[return]

*logo
	@call target=*caution
	[ev storage=yuzulogo.psb chara=LOGO motion=yuzulogo notrans]
	[ev waitmovie]
	[ev storage=m2logo.psb chara=m2cheeseware_logo motion=back_white notrans]
	[ev waitmovie]
	[begintrans]
	[all ontype=layer delete]
	[endtrans normal time=500 sync]
	@return

; ---------------------------------------------------------

*title_bgm
	; エクストラでのbgm音量変更を戻す
	;
	[resetbgmvol]
	;
	;kag機能なので注意
	[updatebgm storage=bgm51]
	;
	[eval exp="sf.bgm_BGM51=true"]
	[eval exp="sf.bgm_BGM52=true"]
	@return

*title_common
	[eval exp="CheckAllClearFlag()"]
	[call target=*title_bgm]
	[rclick enabled=false]
	[clickskip enabled=true]
	[dialog name=title]
	[return]

*title
	[call target=*title_common]
	[syspage layer=message0 page=fore]
	[motionload layer=message0 storage=title.psb chara=&tf.anyclear||tf.allseen?"TITLE2":"TITLE" motion=show wait]
	[jump target=*title_wait]

*title_restore
	; 前の画面を消す
	[call target=*common_back]
	; タイトルを出す
	[call target=*title_common]
	[syspage layer=message0 page=fore]
	[motionload layer=mesaage0 storage=title.psb chara=&tf.anyclear||tf.allseen?"TITLE2":"TITLE" motion=show2 wait]
	[jump target=*title_wait]

*title_wait
	[eval exp="CheckAllClearFlag()"]
	[syspage current page=fore]
	[eval exp="tf.afterstory=void"]
	[jump storage=title.ks target=*wait]

*title_game
	[clickskip enabled=false]
	[fadeoutbgm time=1000]
	[motionopt layer=message0 motion=hide wait]
	[motiondone layer=message0]
	[wait time=500]
	[return]

*title_clear
	@return cond='!Current.propget("fromTitle")'
*title_clear_extra
	[motionopt layer=message0 motion=hide wait]
	[motiondone layer=message0]
	@return

; ---------------------------------------------------------

*after
	@call target=*title_clear
	[syspage current layer=message0 page=fore]
	[motionload layer=message0 storage=after.psb chara=AFTER motion=show separate=false wait]
	[rclick enabled jump storage=custom.ks target=*after_back]
	[jump storage=title.ks target=*wait]

*after_back
	[sysse name=cancel]
	;タイトルに戻る
	[motionopt  layer=message0 motion=hide wait]
	[motiondone layer=message0]
	[jump target=*title]

*after_select
	;選択 tf.afterstory にそれぞれ設定 1:miu 2:azusa 3:rio 4:erina 5:nicola
	[jump storage=title.ks target=*game]
	;↑*title_gameに飛んでmotionopt(hide), motiondoneが呼ばれる

; ---------------------------------------------------------
; システム系共通のクリア処理

*common_back
	[motionopt  layer=message1 motion=hide wait]
	;[layopt layer=message1 page=fore visible=false]
	[motiondone layer=message1]
	@return

; ---------------------------------------------------------
; load画面

*load_start
	@call target=*title_clear
	[syspage current layer=message1 page=fore]
	[motionload layer=message1 storage=save_ui.psb chara=&Current.action("getMotionChara") motion=show separate=false wait]
	[jump storage=load.ks target=*page_done]

; load/qload の切り替え時用
*load_page
	[motionframemask visible=true]
	[motionopt  layer=message1 motion=hide2 wait]
	[motionload layer=message1 storage=save_ui.psb chara=&Current.action("getMotionChara") motion=show separate=false wait]
	[motionframemask visible=false]
	[jump storage=load.ks target=*page_done]

*load_return
	[syspage free]
	[jump storage=load.ks target=*return_done]

; ---------------------------------------------------------
; 遷移用

*to_quickload
	[syscurrent name="load"]
	[history enabled=false]
	[dialog name=load load askload page=0]
	[jump target="*load_page"]

*save_to_load
	[history enabled=false]
	[dialog name=load load askload]
	[jump target="*load_page"]

*load_to_save
	[history enabled=false]
	[dialog name=save save]
	[jump target="*save_page"]


; ---------------------------------------------------------
; save画面

*save_start
	@call target=*title_clear
	[syspage current layer=message1 page=fore]
	[motionload layer=message1 storage=save_ui.psb chara=SAVE motion=show separate=false wait]
	[jump storage=save.ks target=*page_done]

*save_page
	[begintrans]
	[motionframemask visible=true]
	[motionopt  layer=message1 motion=hide2 wait]
	[motionload layer=message1 storage=save_ui.psb chara=SAVE motion=show separate=false wait]
	[motionframemask visible=false]
	[jump storage=save.ks target=*page_done]

*save_return
	[syspage free]
	[jump storage=save.ks target=*return_done]

; ---------------------------------------------------------
; option画面

*option_start
	@call target=*title_clear
	[syspage current layer=message1 page=fore]
	[motionload layer=message1 storage=config.psb chara=&Current.action("getInitialPage") motion=show wait]
	[jump storage=option.ks target=*page_done]

*option_page
	[motionopt layer=message1 motion=hide2 wait]
	[motionload layer=message1 storage=config.psb chara=&tf.configPage motion=show2 wait]
	[jump storage=option.ks target=*page_done]

*option_return
	[syspage free]
;;	[motionredraw layer=messaage0 page=fore]
	[eval exp="kag.forEachEventHook('onConfigUpdate')"]
	[jump storage=option.ks target=*return_done]

; ---------------------------------------------------------
; backlog画面

*backlog_start
	[sysse    name="backlog.open"]
	[syspage current layer=message1 page=fore]
	[motionload layer=message1 storage=backlog.psb chara=BACKLOG motion=show separate=false wait]
	[dialog action="onShow"]
	[jump storage=backlog.ks target=*page_done]

*backlog_back
	[call target=*common_back]
	[syspage free]
	[dialog   action="onHide"]
	[sysjump  from="backlog" to="game" back]

; ---------------------------------------------------------
; extra画面関係


; 起動切り替え
*extra
	[jump target=*exchview cond='sf.lastExtraModeIsChView && (tf.allclear||tf.allseen)']
	[sysjump from="title" to="extramode"]
	[sysupdate]
	[gotostart]

*exchview
	@call target=*title_clear_extra
	[sysjump from="title" to="exchview"]
	[sysupdate]
	[gotostart]

*setflag_extra
		[set name=sf.lastExtraModeIsChView value=0][return]
*setflag_chview
		[set name=sf.lastExtraModeIsChView value=1][return]

; CG/SCENE観賞
*extra_start
	@call target=*title_clear_extra
	[syspage current layer=message1 page=fore]
	[motionload layer=message1 storage=extra.psb chara=&sf.extraPageIsScene?"SCENE":"CG" motion=show separate=false wait]
	[syshook name="extramode.page.init"]
	[jump storage="extra.ks" target=*page_done]

*extra_restore
	[rclick enabled=false jump=false]
	[dialog name=extramode]
	[syspage current layer=message1 page=fore]
	[motionload layer=message1 storage=extra.psb chara=&sf.extraPageIsScene?"SCENE":"CG" motion=show separate=false wait]
	;音楽再生復活させる。モーション画面が無いとエラーになるので後で
	[dialog action=replay]
	;[dialog restore=&tf.recollect]
	[eval exp=tf.recollect=0]
	[syshook name="extramode.page.init"]
	[jump storage="extra.ks" target=*page_done]

*extra_scene
	[motionopt layer=message1 motion=hide2 wait]
	[dialog command=changeMode/true]
	[jump target="*extra_page"]

*extra_cg
	[motionopt layer=message1 motion=hide2 wait]
	[dialog command=changeMode/false]
	[jump target="*extra_page"]

*extra_page
	[dialog command=doneMotion]
	[motionload layer=message1 storage=extra.psb chara=&sf.extraPageIsScene?"SCENE":"CG" motion=show2 separate=false wait]
	[syshook name="extramode.page.init"]
	[jump storage=extra.ks target=*page_done]

*extra_back
	[motionopt  layer=message1 motion=hide wait]
	[motiondone layer=message1]
	[syspage free]
	;[dialog   action="onHide"]
	[sysjump from="extramode" to="title" back]

*view_cg
	[waitrclickup withleft]
	[motionopt  layer=message1 motion=hide wait]
	[motiondone layer=message1]
	[rclick enabled=false jump=false]
	[locklink]
	[cancelskip]

*viewloop
	[eval exp="dm('cg view loop')"]
	[jump target=*view_cg_done cond=Current.propget("cgIsQuitViewLoop")]
	[stoptrans]
	[backlay]
	[syspage current page=back]
	[dialog action=cgView]
	[systrans name="extramode.cg" method=crossfade time=300]
	[wt]
	[syspage current page=fore]
	[dialog action=cgFocusView]
	[waittrig name=&Current.propget("cgTriggerName")]
	[sysse name="extramode.cg.next"  cond=!Current.propget("cgIsCancelView")]
	[sysse name="extramode.cg.cancel" cond=Current.propget("cgIsCancelView")]
	[jump target=*viewloop]

*view_cg_done
	;ゆっくり消せないか？
	[dialog action=cgHideView]
	[motionload layer=message1 storage=extra.psb chara=&sf.extraPageIsScene?"SCENE":"CG" motion=show separate=false wait]
	[jump storage=extra.ks target=*page_done]

; 立ち絵鑑賞
*exchview_start
	[eval exp="dm('exchview_start')"]
	[call target=*common_back]
	[begintrans]
	[allimage hide]
	[dialog action="redraw"]
	[endtrans crossfade time=300 sync]
	[syspage current layer=message1 page=fore]
	[motionload layer=message1 storage=extra.psb chara=CHAR motion=show separate=false wait]
	[syshook name="exchview.page.init"]
	[jump storage="exchview.ks" target=*page_done]

*exchview_page
	[eval exp="dm('exchview_page')"]
	[begintrans]
	[motionframemask visible=true]
	[motionopt  layer=message1 motion=hide2 wait]
	[begintrans]
	[allimage hide]
	[dialog action="redraw"]
	[endtrans crossfade time=300 sync]
	[motionload layer=message1 storage=extra.psb chara=CHAR motion=show separate=false wait]
	[motionframemask visible=false]
	[syshook name="exchview.page.init"]
	[jump storage=exchview.ks target=*page_done]

*exchview_update
	[eval exp="dm('exchview_update')"]
	[locklink]
	[begintrans]
	[allimage hide]
	[dialog action="redraw"]
	[endtrans crossfade time=300 sync]
	[syspage current page=fore]
	[unlocklink]
	[sysupdate]
	[jump storage=exchview.ks target=*wait]

*exchview_back
	[eval exp="dm('exchview_back')"]
	[motionopt  layer=message1 motion=hide wait]
	[motiondone layer=message1]
	[begintrans]
	[allimage delete]
	[endtrans crossfade time=300 sync]
	[syspage free]
	[sysjump from="exchview" to="title" back]

