*loadinit
[eval exp='tf.loadinit="loadinit"']
[eval exp='tf.noclearhistory=false']
[jump target=*doload]
;
*noclearhistory
[eval exp='tf.loadinit="previnit"']
[eval exp='tf.noclearhistory=true']
[jump target=*doload]
;
*exec
[syscurrent name="game"]
[historyopt uiload]
[freesnapshot]
[initscene]
[sysupdate]
[return]
;
*doload
; •Ì©`•…ÑI¿Ì
[linemode]
[clickskip enabled=false]
[video visible=false]
[locklink]
;
[eval exp='tf.fadetime=1000']
[syshook name=&'tf.loadinit+".start"']
;
; ª≠√Ê?BGM•’•ß©`•…•¢•¶•»
[fadeoutbgm time=&tf.fadetime]
[delaycancel]
[stoptrans]
[eval exp=terminator.invoke()]
[begintrans]
[clearlayers page=back]
;[allimage hide]
[all ontype=layer delete]
[systrans env name=&tf.loadinit method=crossfade time=&tf.fadetime]
[wt]
;
[syshook name=&'tf.loadinit+".end"']
[syscurrent name="game"]
[historyopt uiload]
[clearhistory cond="!tf.noclearhistory"]
[initscene]
[eval exp="doLoad()"]
[sysupdate]
*exit
