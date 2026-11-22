;; シーン鑑賞用

;	*xxx_H_?|
;	　：
;	[シーン回想終了 flag="xxx_H_?"]

; 美羽Ｈ１～５
*miu_H_1|
		[scenestart storage="美羽－その４（初体験）.ks" target="*miu_H_1"][jump target=*envplay]
*miu_H_2|
		[卑語選択][scenestart storage="美羽－その６（囮）.ks" target="*miu_H_2"][jump target=*envplay]
*miu_H_3|
		[卑語選択][scenestart storage="美羽－その７（誘拐）.ks" target="*miu_H_3"][jump target=*envplay]
*miu_H_4|
		[卑語選択][scenestart storage="美羽－その１０（エピ）.ks" target="*miu_H_4"][jump target=*envplay]
*miu_H_5|
		[卑語選択][scenestart storage="美羽－その１１（おまけ）.ks" target="*miu_H_5"][jump target=*envplay]
; 梓Ｈ１～５
*azu_H_1|
		[scenestart storage="梓シナリオ_５話Hシーンスキップ.ks" target="*azu_H_1"][jump target=*envplay]
*azu_H_2|
		[scenestart storage="梓シナリオ_５話Hシーンスキップ.ks" target="*azu_H_2"][jump target=*envplay]
*azu_H_3|
		[scenestart storage="梓シナリオ_fix6（台詞数調整後）.ks" target="*azu_H_3"][jump target=*envplay]
*azu_H_4|
		[scenestart storage="梓シナリオ_fix6（台詞数調整後）.ks" target="*azu_H_4"][jump target=*envplay]
*azu_H_5|
		[お尻選択][scenestart storage="梓シナリオ_fix9（台詞数調整後）.ks" target="*azu_H_5"][jump target=*envplay]
; 莉音Ｈ１～４
*rio_H_1|
		[scenestart storage="莉音－第４話（はじめての）ver5.ks" target="*rio_H_1"][jump target=*envplay]
*rio_H_2|
		[scenestart storage="莉音－第５話（献身）ver5.ks" target="*rio_H_2"][jump target=*envplay]
*rio_H_3|
		[scenestart storage="莉音－第８話（失踪）ver5.ks" target="*rio_H_3"][jump target=*envplay]
*rio_H_4|
		[scenestart storage="莉音－第Ｘ話（恥ずかしいこと）ver5.ks" target="*rio_H_4"][jump target=*envplay]
; エリナＨ１～５
*eri_H_1|
		[scenestart storage="エリナ－その４_θ（初体験）.ks" target="*eri_H_1"][jump target=*envplay]
*eri_H_2|
		[scenestart storage="エリナ－その５_θ（来訪者）.ks" target="*eri_H_2"][jump target=*envplay]
*eri_H_3|
		[scenestart storage="エリナ－その６_β（邂逅）.ks" target="*eri_H_3"][jump target=*envplay]
*eri_H_4|
		[scenestart storage="エリナ－その７_β（デートと急変）.ks" target="*eri_H_4"][jump target=*envplay]
*eri_H_5|
		[scenestart storage="エリナ－その１０（マンネリ）.ks" target="*eri_H_5"][jump target=*envplay]
; ニコラＨ１～６？
*nic_H_1|
		[scenestart storage="ニコラ－その４_β（既成事実）.ks" target="*nic_H_1"][jump target=*envplay]
*nic_H_2|
		[scenestart storage="ニコラ－その５（説得_軽量化）.ks" target="*nic_H_2"][jump target=*envplay]
*nic_H_3|
		[scenestart storage="ニコラ－その６（ネコだにゃ）.ks" target="*nic_H_3"][jump target=*envplay]
*nic_H_4|
		[scenestart storage="ニコラ－その４_β（既成事実）.ks" target="*nic_H_4"][jump target=*envplay]
*nic_H_5|
		[scenestart storage="ニコラ－その５（説得_軽量化）.ks" target="*nic_H_5"][jump target=*envplay]
*nic_H_6|
		[scenestart storage="ニコラ－その６（ネコだにゃ）.ks" target="*nic_H_6"][jump target=*envplay]


; シーンプレイ処理
*envplay|
		[meswinload page=both]
		[sceneplay]

; 終了時演出
*endrecollection|
		[cancelskip]
		[cancelautomode]
		[all ontype=sound stop=1000]
		[bgm stop=1000]
		[begintrans]
		[allimage hide delete]
		[endtrans crossfade time=1000]
		[endrecollection]

*search_jump|
		[meswinload page=both]
		[dialog  action=invokeJump]
		[s]

; ムービー類

*opmovie|
		[opmovie][endrecollection]
*edmovie_miu|
		[scenestart storage="美羽－その９（ラスト）.ks" target="*edmovie"][jump target=*envplay]
*edmovie_azu|
		[scenestart storage="梓シナリオ_fix7（台詞数調整後）.ks" target="*edmovie"][jump target=*envplay]
*edmovie_rio|
		[scenestart storage="莉音－第１０話（運命を重ねて）ver5.ks" target="*edmovie"][jump target=*envplay]
*edmovie_eri|
		[scenestart storage="エリナ－その８_β（逃亡者）.ks" target="*edmovie"][jump target=*envplay]
*edmovie_nic|
		[scenestart storage="ニコラ－その５（説得_軽量化）.ks" target="*edmovie"][jump target=*envplay]
