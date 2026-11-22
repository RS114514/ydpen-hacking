;
; Á¢¤Á½}èaÙp¥â©`¥É
;

*start
	[rclick enabled=false jump=false]
	[dialog name=exchview]
	[syshook name="exchview.start"]

*page
	[begintrans]
	[allimage hide]
	[clearlayers page=back]

	[syshook name="exchview.page.init"]
	[syspage uiload  page=back]
	[syspage current page=back]
	[dialog action="redraw"]
	[dialog action="updateButton"]

	[systrans env name="exchview.page" method=crossfade time=300]
	[wt]
*page_done
	[syspage current page=fore]
	[rclick enabled jump storage="" target=*back_rclick]

	[syshook name="exchview.page.done"]
*wait
	[s]

*update
	[locklink]
	[begintrans]
	[allimage hide]
	[dialog action="redraw"]
	[endtrans notrans sync]

	[syspage current page=fore]
	[unlocklink]
	[dialog action="updateButton"]
	[sysupdate]
	[jump target=*wait]

*view
	[locklink]
	[syshook name="exchview.view.init"]
	[jump target=*view_done cond=!kag.current.visible]

	[rclick enabled jump storage="" target=*view]
	[dialog action=onViewStart]
	[s]

*view_done
	[sysse name="exchview.view.done"]
	[dialog action=onViewEnd]
	[rclick enabled jump storage="" target=*back_rclick]
	[jump target=*update]


*back_rclick
	; ÓÒ¥¯¥ê¥Ã¥¯„¿¹ûÒô
	[sysse name="exchview.rclick"]
*back
	[syshook name="exchview.back"]
	[sysjump from="exchview" to="title" back]

*cgmode
	;¥³¥Ô¥Ú
	[eval exp="dm('exchview_back')"]
	[motionopt  layer=message1 motion=hide wait]
	[motiondone layer=message1]
	[begintrans]
	[allimage delete]
	[endtrans crossfade time=300 sync]
	[syspage free]

	[eval exp="sf.extraPageIsScene=false"]
	[sysjump from="exchview" to="extramode"]

*scenemode
	;¥³¥Ô¥Ú
	[eval exp="dm('exchview_back')"]
	[motionopt  layer=message1 motion=hide wait]
	[motiondone layer=message1]
	[begintrans]
	[allimage delete]
	[endtrans crossfade time=300 sync]
	[syspage free]

	[eval exp="sf.extraPageIsScene=true"]
	[sysjump from="exchview" to="extramode"]

