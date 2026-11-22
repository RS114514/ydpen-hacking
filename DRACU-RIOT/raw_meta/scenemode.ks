;
; シーンモード
;

*start
	[syshook name="scenemode.start"]
	[syshook name="scenemode.start.fromtitle"]
	[rclick enabled=false jump=false]
	[dialog name=scenemode fromTitle]
	[jump target=*open]

; シーン回想から復帰する
*restore
	[syshook name="scenemode.start"]
	[syshook name="scenemode.start.restore"]
	[rclick enabled=false jump=false]
	[dialog name=scenemode restore=&tf.recollect]
	[eval exp=tf.recollect=0]
;;	[jump target=*open]

*open
	[stoptrans]
	[backlay cond=Current.propget('fromTitle')]

	[syshook name="scenemode.open.init"]
	[syspage uiload page=back]

	[systrans name="scenemode.open" method=crossfade time=300]
	[wt]
	[jump target=*page_done]

*page
	[stoptrans]
	[backlay cond=Current.propget('fromTitle')]

	[syshook name="scenemode.page.init"]
	[syspage uiload page=back]

	[systrans name="scenemode.page" method=crossfade time=300]
	[wt]
*page_done
	[syspage current page=fore]
	[rclick enabled jump storage="" target=*back_rclick]

	[syshook name="scenemode.page.done"]
*wait
	[s]
	[s]

*view
	[syshook name="scenemode.view.init"]
	[rclick enabled=false jump=false]
	[locklink]

	[clearlayers page=back]
	[systrans name="scenemode.view" method=crossfade time=300]
	[wt]
*view_start
	[syshook name="scenemode.view.done"]
	[historyopt uiload]
	[sysinit]
	[eval exp='tf.recollect=Current.action("view")']
	[s]

*back_rclick
	; 右クリック効果音
	[sysse name="scenemode.rclick"]
*back
	[sysjump from="scenemode" to="title" back]

*cgmode
	[sysjump from="scenemode" to="cgmode"]

*soundmode
	[sysjump from="scenemode" to="soundmode"]

; シーン回想再生からの復帰処理
*endrecollection
	[cancelskip]
	[cancelautomode]
	[syshook name="scenemode.restore"]
	[sysjump from="recollection" to="scenemode"]

