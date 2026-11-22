;
; •—©`•π•≥•Û•–©`•»”√§Œ•–•√•Ø•Ì•∞
;

*start
	[dialog   name="backlog"]
	[syshook  name="backlog.start"]
	[sysse    name="backlog.open"]

*open
	[stoptrans]
	[backlay]

	[syshook  name="backlog.open.init"]
	[syspage current page=back]
	[syspage  uiload page=back]

	[dialog   action="onShow"]
	[systrans name="backlog.open" method=crossfade time=300]
	[wt]
	[jump target=*page_done]

*page
	[stoptrans]
	[backlay]

	[syshook  name="backlog.page.init"]
	[syspage current page=back]
	[syspage  uiload page=back]

	[dialog   action="onShow"]
	[systrans name="backlog.page" method=crossfade time=300]
	[wt]
*page_done
	[syspage  current page=fore]
	[rclick   enabled jump storage="" target=*back_rclick]

	[syshook  name="backlog.page.done"]
*wait
	[s]
	[s]

*jump
	[locklink]
	[stoptrans]
	[begintrans]
	[syspage  free page=back]
	[dialog   action="onHide"]
	[syshook  name="backlog.jump.init"]
	[clearlayers page=back]
;;	[allimage hide delete]
	[all ontype=layer delete]
	[systrans env name="backlog.jump" method=crossfade time=1000]
	[syshook  name="backlog.jump.done"]

	[syscurrent name="game"]
	[sysrestore]

	[syshook  name="backlog.jump"]
	[dialog  action=invokeJump]
	[s]

*back_rclick
	[syshook  name="backlog.rclick"]
*back
	[sysse    name="backlog.close"]
	[syshook  name="backlog.back"]

; •≤©`•‡§Àë¯§Î
*game
	[locklink]
	[stoptrans]
	[backlay]
	[syspage  free page=back]
	[syshook  name="backlog.close.init"]

	[dialog   action="onHide"]
	[systrans name="backlog.close" method=crossfade time=300]
	[wt]

	[syshook  name="backlog.close.done"]
	[sysjump  from="backlog" to="game" back]

; èÕé¢ÑI¿Ì
*return
	[sysrestore]
	[return]

*sysfrom_game
	[sysjump  from="game" to="backlog"]
