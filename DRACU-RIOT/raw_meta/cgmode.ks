;
; CG•‚©`•…
;

*start
	[syshook name="cgmode.start"]
	[rclick enabled=false jump=false]
	[dialog name=cgmode]
;;	[jump target=*open]

*open
	[stoptrans]
	[backlay]

	[syshook name="cgmode.open.init"]
	[syspage uiload page=back]

	[systrans name="cgmode.open" method=crossfade time=300]
	[wt]
	[jump target=*page_done]

*page
	[stoptrans]
	[backlay]

	[syshook name="cgmode.page.init"]
	[syspage uiload page=back]

	[systrans name="cgmode.page" method=crossfade time=300]
	[wt]
*page_done
	[dialog action=hideView]
	[syspage current page=fore]
	[rclick enabled jump storage="" target=*back_rclick]

	[syshook name="cgmode.page.done"]
*wait
	[s]
	[s]

*view
	[syshook name="cgmode.view.init"]
	[rclick enabled=false jump=false]
	[locklink]

*viewloop
	[jump target=*page cond=Current.propget("isQuitViewLoop")]
	[stoptrans]
	[backlay]

	[dialog action=view]
	[systrans name="cgmode.view" method=crossfade time=300]
	[wt]

	[syspage current page=fore]
	[dialog action=focusView]
	[waittrig name=&Current.propget("triggerName")]

	[syshook name="cgmode.view.next"]
	[sysse name="cgmode.next"  cond=!Current.propget("isCancelView")]
	[sysse name="cgmode.cancel" cond=Current.propget("isCancelView")]
	[jump target=*viewloop]

*back_rclick
	; ”“•Ø•Í•√•ØÑøπ˚“Ù
	[sysse name="cgmode.rclick"]
*back
	[dialog action=hideBack]
	[sysjump from="cgmode" to="title" back]

*scenemode
	[sysjump from="cgmode" to="scenemode"]

*soundmode
	[sysjump from="cgmode" to="soundmode"]
