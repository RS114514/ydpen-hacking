*sysfrom_game
	[locksnapshot]
*start
	[history enabled=false]
;;	[mapdisable layer=0 page=fore]
	[dialog name=sysmenu]

*page
	[stoptrans]
	[backlay]

	[syspage page=back layer=message1]
	[systrans name="sysmenu.page" method=crossfade time=300]
	[wt]

	[current layer=message1 page=fore]
	[rclick enabled jump storage="" target=*back]
	[s]
*back
	[backlay]
	[position page=back width=1 height=1 layer=message1 visible=false]
	[systrans name="sysmenu.close" method=crossfade time=300]
	[wt]

	[sysrestore]
	[unlocksnapshot]
	[return]
