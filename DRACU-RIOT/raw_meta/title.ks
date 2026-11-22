*init|•ø•§•»•Î
	[eval exp='tf.recollect = 0']
	[startanchor cond=!kag.startAnchorEnabled]
*start|
	[eval exp='tf.playmovie = false']
	[sysinit]
	[syscurrent name="title"]
	[syshook name="title.init"]

	[clickskip enabled]

	[init]
	[clearlayers page=fore]
	[backlay]
	[stopbgm]
	[stopvideo]
	[video visible=false]
*restore
	; ªÿœÎ•‚©`•…§Àèä÷∆ﬂw“∆
	[sysjump from="game" to="scenemode" cond=tf.recollect]

	[syshook name="title.start"]

*logo
	[syshook name="title.logo"]

*movie
	[syshook name="title.movie"]

*loop
	[syshook name="title.loop"]

*wait
	[s]
	[s]

*extra
	[syshook name="title.extra"]
	[s]
	[s]

*load
	[sysjump from="title" to="load"]
	[jump target=*wait]

*option
	[sysjump from="title" to="option"]
	[jump target=*wait]

*cgmode
	[sysjump from="title" to="cgmode"]
	[jump target=*wait]

*scenemode
	[sysjump from="title" to="scenemode"]
	[jump target=*wait]

*soundmode
	[sysjump from="title" to="soundmode"]
	[jump target=*wait]

; §œ§∏§·§´§È
*game
	[syshook name="title.game"]
	[clearvar]
	[historyopt uiload]
	[sysinit]
	[sysjump from="title" to="game"]
	[jump target=*wait]
