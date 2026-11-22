;
; ロード画面
;

*start_title
	[dialog name=load load fromTitle]
	[syshook name="load.start"]
	[jump target=*open]

; セーブ画面からの遷移
*start_save
	[history enabled=false]
	[dialog name=load load askload]
	[syshook name="load.start"]

*open
	[stoptrans]
	[backlay]

	[syshook name="load.open.init"]
	[syspage uiload page=back]

	[systrans name="load.open" method=crossfade time=300]
	[wt]
	[jump target=*page_done]

*page
	[stoptrans]
	[backlay]

	[syshook name="load.page.init"]
	[syspage uiload page=back]

	[systrans name="load.page" method=crossfade time=300]
	[wt]
*page_done
	[syspage current page=fore]
	[rclick enabled jump storage="" target=*back_rclick]

	[syshook name="load.page.done"]
*wait
	[s]
	[s]

*load
	[syshook name="load.select"]
	[dialog  action=invokeLoad]

;	[rclick enabled=false jump=false]
;	[locklink]
;	[stoptrans]
;	[backlay]

;	[clearlayers page=back]
;	[systrans name="load.action" method=crossfade time=300]
;	[wt]


; セーブ画面へ
*save
	[sysjump to="save" from="load"]

*back_rclick
	; 右クリック効果音
	[sysse name="load.rclick"]
*back
	[syshook name="load.back"]
	[jump target=*title cond=&Current.propget("fromTitle")]

; ゲームに戻る
*game
	[sysjump from="load" to="game" back]

*return
	[backlay]
	[syspage free page=back]
	[syshook name="load.close.init"]

	[systrans name="load.close" method=crossfade time=300]
	[wt]
*return_done
	[syshook name="load.close.done"]
	[sysrestore]
	[freesnapshot]

	[return]

; タイトルに戻る
*title
	[sysjump from="load" to="title" back]


; ゲーム中の startLoad() からの呼び出し
*sysfrom_game
	[locksnapshot]
	[sysjump from="game" to="load"]

; タイトル画面中のウィンドウメニューからの呼び出し
*sysfrom_title
	[sysjump from="title" to="load"]
