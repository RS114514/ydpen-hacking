*start|
[initscene]
[quickmenu fadein]

;アフター選択分岐（ tf.afterstory にそれぞれ設定 1:miu 2:azusa 3:rio 4:erina 5:nicola）
@next target=*miu_after eval="tf.afterstory==1" exp="tf.afterstory=void"
@next target=*azu_after eval="tf.afterstory==2" exp="tf.afterstory=void"
@next target=*rio_after eval="tf.afterstory==3" exp="tf.afterstory=void"
@next target=*eri_after eval="tf.afterstory==4" exp="tf.afterstory=void"
@next target=*nic_after eval="tf.afterstory==5" exp="tf.afterstory=void"
;念のため削除
@eval exp="tf.afterstory=void"

; ソレ以外は通常


; 開始シナリオを下記に記入
[eval exp='tf.start_storage="★プロローグA（始まり）.ks", tf.start_target=void']

; コンバートモードかどうかで挙動を変更
*switch|
[jump target=*envstart cond=world_object.playerExecMode]
[next storage=&tf.start_storage target=&tf.start_target]


*envstart|
[initscene]
[syscurrent name="game"]
[scenestart storage=&tf.start_storage target=&tf.start_target]
*envplay|
[sceneplay]
[exit storage="start.ks" target="*gameend_title"]

*gameend_title
[cancelskip]
[cancelautomode]
[initscene]
[sysjump from="game" to="title"]

*gameend_logo
[cancelskip]
[cancelautomode]
[initscene]
[sysjump to="logo"]

*miu_after|
		[eval exp='tf.start_storage="美羽－その１１（おまけ）.ks",           tf.start_target="*Miu_after"'][jump target=*switch]
*azu_after|
		[eval exp='tf.start_storage="梓シナリオ_fix9（台詞数調整後）.ks",    tf.start_target="*Azu_after"'][jump target=*switch]
*rio_after|
		[eval exp='tf.start_storage="莉音－第Ｘ話（恥ずかしいこと）ver5.ks", tf.start_target="*Rio_after"'][jump target=*switch]
*eri_after|
		[eval exp='tf.start_storage="エリナ－その１０（マンネリ）.ks",       tf.start_target="*Eri_after"'][jump target=*switch]
*nic_after|
		[eval exp='tf.start_storage="ニコラ－その６（ネコだにゃ）.ks",       tf.start_target="*nic_after"'][jump target=*switch]
