;
; EXTRA•‚©`•…
;

*start
	[rclick enabled=false jump=false]
	[dialog name=extramode fromTitle]
	[syshook name="extramode.start.fromtitle"]
	[jump target=*page]

; •∑©`•ÛªÿœÎ§´§ÈèÕé¢§π§Î
*restore
	[rclick enabled=false jump=false]
	[dialog name=extramode restore=&tf.recollect]
	[eval exp=tf.recollect=0]
	[syshook name="extramode.start.restore"]
;;	[jump target=*page]

*page
	[begintrans]
	[allimage hide]
	[clearlayers page=back]
	[extramode_bg]

	[syshook name="extramode.page.init"]
	[syspage uiload page=back]

	[systrans env name="extramode.page" method=crossfade time=300]
	[wt]
*page_done
	;[dialog action=cgHideView]
	[syspage current page=fore]
	[dialog action=soundWheel]
	[rclick enabled jump storage="extra.ks" target=*back_rclick]

	[syshook name="extramode.page.done"]
*wait
	[s]

*view_scene
	[syshook name="extramode.scene.init"]
	[rclick enabled=false jump=false]
	[locklink]

	[begintrans]
	[clearlayers page=back]
	[allimage hide delete]
	[systrans env name="extramode.scene" method=crossfade time=300]
	[wt]
	[syshook name="extramode.scene.done"]
	[resetbgmvol]
	[historyopt uiload]
	[sysinit]
	[eval exp='tf.recollect=Current.action("sceneView")']
	[s]

*view_cg
	[syshook name="extramode.cg.init"]
	[rclick enabled=false jump=false]
	[locklink]

*viewloop
	[jump target=*page cond=Current.propget("cgIsQuitViewLoop")]
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

*back_rclick
	; ”“•Ø•Í•√•ØÑøπ˚“Ù
	[sysse name="extramode.rclick"]
*back
	[dialog action=cgHideBack]
	[syshook name="extramode.back"]
	[sysjump from="extramode" to="title" back]

*exchview
	[sysjump from="extramode" to="exchview"]

