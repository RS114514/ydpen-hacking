;
; •µ•¶•Û•…•‚©`•…
;

*start
	[syshook name="soundmode.start"]
	[rclick enabled=false jump=false]
	[dialog name=soundmode]
;;	[jump target=*open]

*open
	[stoptrans]
	[backlay]

	[syshook name="soundmode.open.init"]
	[syspage uiload page=back]

	[systrans name="soundmode.open" method=crossfade time=300]
	[wt]
	[jump target=*page_done]

*page
	[stoptrans]
	[backlay]

	[syshook name="soundmode.page.init"]
	[syspage uiload page=back]

	[systrans name="soundmode.page" method=crossfade time=300]
	[wt]
*page_done
	[syspage current page=fore]
	[rclick enabled jump storage="" target=*back_rclick]

	[syshook name="soundmode.page.done"]
*wait
	[s]
	[s]

*back_rclick
	; ”“•Ø•Í•√•ØÑøπ˚“Ù
	[sysse name="soundmode.rclick"]
*back
	[sysjump from="soundmode" to="title" back]

*cgmode
	[sysjump from="soundmode" to="cgmode"]

*scenemode
	[sysjump from="soundmode" to="scenemode"]
