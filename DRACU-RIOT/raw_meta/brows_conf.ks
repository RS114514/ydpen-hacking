*_init|
	@macro name=_confindex
	@brows mode=link pillar=conf width=100 step=4 text=カテゴリ
	@endmacro
	@_endinit
	@s

*conf|設定
@_begin
@_confindex
	[li][_link tag=conf.01scr]
	
	
	
@_end

;----------------------------------------------------------------
*conf.01scr|画面設定
@_begin
@_confindex
	
	[_fontsec]▼表示方式[_reset][brows mode=draw hline noreline]\
	　[indent]画面の表示方式を変更します。

	[_click tag=dbstyle.auto]
	[_click tag=dbstyle.d3d]
	[_click tag=dbstyle.ddraw]
	[_click tag=dbstyle.gdi]

	[_click tag=usedb]
	@endindent

	?スムージング
	?フレームレート
	?垂直同期
@_end

;----------------------------------------------------------------
*conf.01scr.01window|ウィンドウ
@_begin
@_confindex
	?ウィンドウサイズ変更
	?リサイズ禁止
@_end

;----------------------------------------------------------------
*conf.01scr.02full|フルスクリーン
@_begin
@_confindex
	?解像度変更
	?拡大設定
	?複数モニタ
	?解像度切り替え方法
@_end

;----------------------------------------------------------------
*conf.01scr.03movie|ムービー
@_begin
@_confindex
	?ムービー再生方式
@_end

;----------------------------------------------------------------
*conf.02text|テキスト設定
@_begin
@_confindex
	
@_end

;----------------------------------------------------------------
*conf.03input|入力設定
@_begin
@_confindex
	
@_end

;----------------------------------------------------------------
*conf.04sound|サウンド設定
@_begin
@_confindex
	
@_end
