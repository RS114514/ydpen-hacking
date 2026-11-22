[macro name=initscene]
[clearlayers]
[stopquake]
@stopbgm        cond=!mp.nostopbgm
@stopse buf=all cond=!mp.nostopse
[stopvideo]
[sysmovie state=end]
[history enabled=true]
[sysrclick]
[cancelnowaitmode]
[noeffect  enabled=true]
[clickskip enabled=true]
[init nostopbgm=%nostopbgm]
[linemode mode=page]
[craftername mode=true]
[erafterpage mode=true]
;[autoindent mode=true]
[current layer=message0]
;[meswinload page=both]
[meswinchange type=default]
[endmacro]

; ムービー再生のsflagはパースモード時のみ有効
[macro name=movieflag][endmacro]

; parsemacro.ks から呼ばれるポイント
*common_macro

; 旧システム互換用マクロ
[macro name=allchar]
[all * ontype=layer onflag=4]
[endmacro]

[macro name=allimage]
[all * ontype=layer]
[endmacro]


; モノレール演出用
[macro name=モノレール生成]
[mono_base class=event file=sea_bg          zorder=40]
[mono_sea  class=event file=sealoop         zorder=41 ypos=-180]
[mono_win  class=event file=monoloop_motion zorder=42]
[endmacro]

[macro name=モノレール]
[mono_base *]
[mono_sea  *]
[mono_win  *]
[endmacro]


; 背景拡大用

[macro name=背景中]
[stage zoom=200 xpos=0 ypos=-350]
[endmacro]
[macro name=背景左]
[stage zoom=200 xpos=600 ypos=-350]
[endmacro]
[macro name=背景右]
[stage zoom=200 xpos=-600 ypos=-350]
[endmacro]
[macro name=背景左外]
[stage zoom=200 xpos=1200 ypos=-350]
[endmacro]
[macro name=背景右外]
[stage zoom=200 xpos=-1200 ypos=-350]
[endmacro]
[macro name=背景左大外]
[stage zoom=200 xpos=1500 ypos=-350]
[endmacro]
[macro name=背景右大外]
[stage zoom=200 xpos=-1500 ypos=-350]
[endmacro]
[macro name=背景初期]
[stage zoom=100 xpos=0 ypos=0]
[endmacro]
[macro name=背景拡大]
[stage zoom=150 xpos=0 ypos=-200]
[endmacro]


; 集中線用
[macro name=集中線]
[concentration show]
[endmacro]

[macro name=集中解除]
[concentration delete]
[endmacro]


; 回想用
[macro name=回想]
;[layer name=refrain 回想枠 level=6]
[date hide]
[refrain show 1000sec msgoff sync]
[endmacro]

[macro name=回想終了]
;[layer name=refrain delete]
[refrain delete 1000sec]
[date show]
[endmacro]

;視点変化用
[macro name=視点変化]
;[layer name=ano_bar file=bar level=0 hide]
[begintrans]
;[date hide]
[bar_top show ypos=70]
[bar_und show ypos=-720]
[endtrans 0sec msgoff]
[beginskip]
[bar_top ypos=0 time=750 nosync]
[bar_und ypos=-650 time=750 sync]
[endskip]
;[anotherview mode=1]
[meswinchange type=another]
[endmacro]

[macro name=視点通常]
[msgoff]
[beginskip]
[bar_top ypos=70 time=750]
[bar_und ypos=-720 time=750 sync]
[endskip]
[begintrans]
[bar_top delete]
[bar_und delete]
[endtrans 0sec sync]
;[anotherview mode=0]
[meswinchange type=default]
;[date show]
[endmacro]

[macro name=黒半透明]
[msgoff]
[object name=half_trans class=layer file=画面_黒 zorder=60 hide 0sec]
[half_trans show 500sec opacity=100]
[endmacro]

[macro name=白半透明]
[msgoff]
[object name=half_trans class=layer file=画面_白 zorder=60 hide 0sec]
[half_trans show 500sec opacity=100]
[endmacro]

[macro name=透明解除]
[msgoff]
[half_trans hide 500sec]
[begintrans]
[half_trans delete]
[endtrans 0sec]
[endmacro]

;// ------------------------------------------
;// 本編スクリプトで使用するマクロ
;// ------------------------------------------

[macro name="ゲーム終了：タイトル"][exit storage="start.ks" target="*gameend_title"][endmacro]
[macro name="ゲーム終了：ロゴ画面"][exit storage="start.ks" target="*gameend_logo" ][endmacro]
[macro name="シーン回想終了"][set name='&"sf.replay_"+mp.flag' value=1][exit storage="replay.ks" target="*endrecollection" eval="kag.isRecollection"][endmacro]
[macro name="シーン回想フラグ"][set name='&"sf.replay_"+mp.flag' value=1][endmacro]

;//ＯＰを前作からひとまず流用してみる
[macro name=opmovie]
[cancelskip]
[sysmovie file="OP" flag="movie_op" bgmflag=BGM51 begincolor=0x000000 endcolor=0xFFFFFF]
[白画面 notrans sync]
[sysupdate]
[暗転 1000sec sync]
[endmacro]

;//ＥＤも前作からひとまず流用してみる
[macro name=edmovie]
[eval exp="sf.bgm_BGM53=true"]
[lse  stop time=1000]
[lse2 stop time=1000]
[bgm  stop time=1000]
[msgoff]
[date hide]
[cancelskip][env sync]
[noeffect enabled=false]
[beginskip eval="&'sf.'+mp.file.toLowerCase()"]
[endsong file=bgm53]
[begintrans]
[allimage hide delete]
[白画面]
[endtrans fade=3733]
[sysmovie file=%file flag="&mp.file.toLowerCase()" color=0xFFFFFF noaudio]
[白画面 notrans sync]
[noeffect enabled=true]
[cancelskip][env sync]
[endskip]
[endsong stop=1000]
[暗転 1000sec sync]
[endmacro]

[macro name=卑語選択]
[initscene]
【美羽】「な、なら……選べばいいじゃないっ。佑斗が興奮するなら、そうしてあげるからっ」[noer]
[seladd text="おち●ちんで" exp="f.word_flag='a',f.word='おち●ちん', f.wordx='お、'"]
[seladd text="おち●ぽで" exp="f.word_flag='b',f.word='おち●ぽ',f.wordx='お、'"]
[seladd text="ち●ぽで" exp="f.word_flag='c',f.word='ち●ぽ',f.wordx='ち、'"]
[select][msgoff]
[endmacro]

[macro name=お尻選択]
[initscene]
	[seladd text="お尻にも……" exp="f.anus_flag = 1"]
	[seladd text="お尻はいい" exp="f.anus_flag = 0"]
[select][msgoff]
[endmacro]

@return
