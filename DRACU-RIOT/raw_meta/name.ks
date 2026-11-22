;
; 名前入力
;

*start_title
	[dialog name="nameinput" fromTitle]
	[syshook name="nameinput.start"]
	[jump target=*page]

*start_option
	[dialog name="nameinput"]
	[syshook name="nameinput.start"]

*page
	[stoptrans]
	[backlay]

	[syshook name="nameinput.page.init"]
	[syspage uiload page=back]

	[systrans name="nameinput.page" method=crossfade time=300]
	[wt]

	[syspage current page=fore]
	[rclick enabled jump storage="" target=*back_rclick]

	[syshook name="nameinput.page.done"]
	[s]

*back_rclick
	; 右クリック効果音
	[sysse name="nameinput.rclick"]
*back
	[syshook name="nameinput.back"]
	[jump target=*start cond=&'Current.propget("fromTitle")']

*option
	[sysjump from="nameinput" to="option" back]

*start
	[sysjump from="nameinput" to="game"]

