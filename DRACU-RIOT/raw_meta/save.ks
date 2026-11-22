;
; セーブ画面
;

*start_title

; ロード画面からの遷移
*start_load
	[history enabled=false]
	[dialog name=save save]
	[syshook name="save.start"]

; UI読み込み
*open
	[stoptrans]
	[backlay]

	[syshook name="save.open.init"]
	[syspage uiload page=back]

	[systrans name="save.open" method=crossfade time=300]
	[wt]
	[jump target=*page_done]

*page
	[stoptrans]
	[backlay]

	[syshook name="save.page.init"]
	[syspage uiload page=back]

	[systrans name="save.page" method=crossfade time=300]
	[wt]
*page_done
	[syspage current page=fore]
	[rclick enabled jump storage="" target=*back_rclick]

	[syshook name="save.page.done"]
*wait
	[s]
	[s]

; ロード画面へ
*load
	[sysjump to="load" from="save"]

*back_rclick
	; 右クリック効果音
	[sysse name="save.rclick"]
*back
	[syshook name="save.back"]

; ゲームに戻る
*game
	[sysjump from="save" to="game" back]

*return
	[backlay]
	[syspage free page=back]
	[syshook name="save.close.init"]

	[systrans name="save.close" method=crossfade time=300]
	[wt]
*return_done
	[syshook name="save.close.done"]
	[sysrestore]
	[freesnapshot]

	[return]

; startSave() からの呼び出し
*sysfrom_game
	[locksnapshot]
	[sysjump from="game" to="save"]
