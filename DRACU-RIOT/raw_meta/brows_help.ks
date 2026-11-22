; ヘルプ表示テキスト
; 同じフォーマットで data/main/helpover.ks ファイルを作るとテキストを上書きできる
;
;----------------------------------------------------------------
*index|テストトップ|キーワード|短い版
@_begin
	@_usage
	@if exp='getExistImageName(aboutDialogConfig.storage)!=""'
		@_cimg file=&"aboutDialogConfig.storage" 
	@else
		@r
	@endif
	@ul
	@if exp='brows.getEnabledMenuItem("helpReadmeMenuItem")'
		[li][_readme]
		
	@endif
	[li][_link tag=faq]

	[li][_link tag=menu]

	[li][_link tag=conf]

	[li][_link tag=support]
	@/ul

@_end

;----------------------------------------------------------------
*faq|よくある質問
@_begin

	@ul
	[li][_link tag=faq.slow]

	[li][_link tag=faq.wide]

	[li][_link tag=faq.movie]

	[li][_link tag=faq.tier]

	[li][_link tag=faq.fullscr]
	@/ul

@_end

;----------------------------------------------------------------
*faq.slow|ゲームの動作が重い（遅い）
@_begin

	お使いのPCのスペック（CPUクロックや搭載メモリなど）が要求スペックを満たしていない場合、
	ゲームの動作が極端に遅くなる場合があります。

	[_text game=このゲーム]の要求スペックの詳細については[_homepage text=ホームページ]からご確認ください。
	もしスペックを満たしていても動作が遅い場合は、以下の項目についてお試しください。

	@ul
	[li]空きメモリが足りない場合があるので、他に起動しているソフトがあればすべて終了する

	[li][_link tag=menu.lowmem]に[_click tag=memusage text=チェック]を入れてゲームを再起動する

	[li]PCの動作を重くするような常駐ソフト（例えばウィルス対策ソフトなど）が動いていないか確認する
	@/ul

	それでも動作が改善されない場合は[_link tag=support text=サポートへお問い合わせ]ください。

@_end
;----------------------------------------------------------------
*faq.wide|表示が横長または縦長になる
@_begin

	フルスクリーン表示時に画面が縦方向や横方向に引き伸ばされて表示されることがあります。
	こちらの問題は、お使いのPCに接続されたモニタやビデオカードの種類や設定により起こります。
	[_cimg file=help_aspect]
	以下のいずれかの項目をお試しください。

	@ul
	[li][_link tag=menu.fsres]を「[_click tag=fsres.nochange]」にする

	[li]モニタやビデオカードの設定を「アスペクト比固定拡大表示」に設定する
	　（こちらの設定方法についてはお使いのPCやモニタのマニュアルをご確認ください。
	　　メーカーや機種によっては設定できなかったり、用語が多少異なる場合があります）
	@/ul


	※[indent]フルスクリーンでなくウィンドウ表示でこの問題が起こる場合は、Windowsの[_exec text=モニタ解像度 exec="control.exe" param="desk.cpl @3"]の設定を
	お使いのモニタに合ったものに変更してみてください。[endindent]

	※ブラウン管モニタをご利用の方は[_link tag=faq.wide.crt text=こちらもご確認ください]。

@_end
*faq.wide.crt|画面が横長または縦長になる／ブラウン管モニタ
@_begin

	ブラウン管モニタ(CRT)をご利用の方は、モニタ本体が正しく調整されていないと
	この問題が起こる場合があります。

	ピクセルアスペクト比が１：１の正方形になるようにモニタ本体を調整してください。
	詳しくはお使いのモニタのマニュアルをご確認ください。

@_end
;----------------------------------------------------------------
*faq.movie|ムービーが再生されない、あるいは表示がおかしい
@_begin

	以下の項目についてご確認ください。

	@ul
	[li]Windows Media Playerを最新版にアップデートする

	[li][_link tag=menu.vomstyle]の設定を変更する

	[li]DVD再生ソフトで使っていないものがあればアンインストールする
	@/ul

	それでも再生されない場合は[_link tag=support text=サポートへお問い合わせ]ください。

@_end
;----------------------------------------------------------------
*faq.tier|画面が動くと表示がチラチラする
@_begin

	ゲームの画面が激しく動くと、画面の表示がチラチラする場合があります。
	大抵の場合はWindowsベースのPCでの表示上の制限によるものですが、どうしても気になる場合は、
	以下の項目についてご確認ください。

	@ul
	[li]お使いのPCのビデオドライバを最新のものにアップデートする
	　（こちらの方法についてはお使いのPCのメーカーにお問い合わせください）

	[li][_link tag=menu.dbuf]の「[_click tag=dbstyle.d3d]」または「[_click tag=dbstyle.ddraw]」を選択する

	[li][_link tag=menu.fps]を「[_click tag=contfreq.0]」を選択する
	　（こちらの設定でゲームの動作が重くなる場合があります）

	[li][_link tag=menu.vsync]に[_click tag=waitVSyncMenuItem text=チェック]を入れる
	　（こちらの設定でゲームの動作が重くなる場合があります）
	@/ul

@_end
;----------------------------------------------------------------
*faq.fullscr|フルスクリーンの表示方式について
@_begin

	フルスクリーン表示は、ひとつのモニタを占有して[_text game=このゲーム]のみを表示するモードです。
	近年の液晶モニタの普及やワイド表示解像度の規格などにより、このモードの表示がうまくいかないことがあります。
	例としては、[_link tag=faq.wide]などがあります。

	マルチモニタ環境でフルスクリーンにする場合
	@ul
	[li][_text name=fullscreenmode.auto]」
	[li][_text name=fullscreenmode.primaryonly]」
	[li][_text name=fullscreenmode.usepseudo]」
	[li][_text name=fullscreenmode.pseudoall]」
	@/ul

@_end
;----------------------------------------------------------------
*menu|メニューの設定項目の詳細
@_begin

	ゲーム本編の機能（[_text name=storeMenu]や[_text name=restoreMenu]など）については[_text game=このゲーム]のマニュアルをご確認ください。
	ここでは[_text pos=displayMenu]などの高度な設定の機能について説明します。

	@ul
	[li][_link tag=menu.winres]
	[li][_link tag=menu.fsres]
	[li][_link tag=menu.dbuf]
	[li][_link tag=menu.smooth]
	[li][_link tag=menu.effect]
	[li][_link tag=menu.fps]
	[li][_link tag=menu.vomstyle]
	[li][_link tag=menu.fsmode]
	[li][_link tag=menu.fsmethod]
	[li][_link tag=menu.vsync]
	[li][_link tag=menu.wheel]
	[li][_link tag=menu.joypad]
	[li][_link tag=menu.lowmem]
	@/ul

@_end

*menu.winres|&brows.getText("pos","winResMenu")
@_begin

	@ul
	[li][indent]「[_text name=winResNormalMenuItem]」と「縦サイズ x 横サイズ」
	ウィンドウ表示時のサイズを変更します。
	「[_text name=winResNormalMenuItem]」以外のサイズでは画像を拡大または縮小して表示します。[endindent]
	[ul]
	[li][indent]「[_click tag=winResizeableMenuItem]」
	@_rimg file=help_resize
	チェックを入れるとウィンドウ枠のドラッグによるリサイズを禁止します。
	不用意にサイズを変更したくない時に使用してください。

	この設定はウィンドウ枠によるサイズ変更が禁止になるだけで、
	[_text pos=winResMenu]のメニューでのサイズ変更は常に有効です。

	サイズ固定状態では、ウィンドウタイトルバーの最大化ボタンは
	フルスクリーン表示動作になります。
	[endindent]
	@/ul

@_end
*menu.fsres|&brows.getText("pos","fsres")
@_begin

	フルスクリーンに切り替える時にモニタの解像度を変更するかどうかを以下で選択できます。

	@ul
	[li]「[_fullsel tag=fsres.auto]」は自動で適切な解像度を選択します。
	[li]「[_fullsel tag=fsres.nochange]」は解像度を変更せずにソフトウェアで拡大して表示します。
	[li]「[_fullsel tag=fsres.nearest]」はゲームの画面サイズに最も近い解像度に変更します。
	[li]「[_fullsel tag=fsres.proportional]」はゲーム画面の縦横比と同じ解像度で最も近いものに変更します。
	@/ul


	縦横比の違いでモニタ画面にフィットしない場合、どのように表示するかを以下で選択できます。
	設定内容は下の図を参考にしてください。

	@ul
	[li]「[_fullsel tag=fszoom.inner]」
	[li]「[_fullsel tag=fszoom.outer]」
	[li]「[_fullsel tag=fszoom.no]」
	@/ul
	[_cimg file=help_fszoom]
	※状態によっては設定を変更できない場合があります。詳しくは[_link tag=faq.fullscr text=こちらをご覧ください]。
@_end
*menu.dbuf|&brows.getText("pos","dbstyle")
@_begin

	@ul
	[li][_text pos=dbstyle]
	　画面の表示方式を変更します。
	　「[_text name=dbstyle.auto]」は最適なパフォーマンスが出るような方式を自動で選択します。

	[li][_text name=usedb]
	　ウィンドウサイズが標準の時など、表示の拡大や縮小が無い場合には
	　DIB方式（バッファリングなしの画像転送）を使用するようにします。
	　この項目は[_text pos=dbstyle]が「[_text name=dbstyle.d3d]」や「[_text name=dbstyle.ddraw]」では常に無効となります。
	@/ul

@_end
*menu.smooth|&brows.getText("pos","smoothzoom")
@_begin

	[_click tag=smoothzoom text=チェック]を入れるとソフトウェアによる拡大表示が行われたときに、
	画像のスムージング（引き伸ばしの補間処理）を行います。

	ウィンドウのサイズを変更した時や、解像度を変更しないフルスクリーンにした時に意味を持ちます。
	[_text pos=dbstyle]や[_text pos=fsres]の設定によっては効果がない場合があります。

@_end
*menu.effect|&brows.getText("pos","effectCheckMenuItem")
@_begin

	チェックを入れると画面のフェード切り替えなどの演出をカットします。

@_end
*menu.fps|&brows.getText("pos","contfreq")
@_begin

	画面の更新の間隔を指定します。
	「[_text name=contfreq.0]」や「[_text name=contfreq.60]」にすると表示がなめらかになりますが、CPUへの負担が大きくなります。

@_end
*menu.vomstyle|&brows.getText("pos","vomstyle.")
@_begin

	ムービーの表示方式を変更します。
	表示されない場合や拡大表示が綺麗でない場合に変更してください。

	@ul
	[li]「[_click tag=vomstyle.auto]」はWindowsのバージョンで最適な方法を自動で選択します。

	[li]「[_click tag=vomstyle.overlay]」は旧来のオーバレイ方式を使用します。

	[li]「[_click tag=vomstyle.mixer]」はDirectX9以降が必要です。表示に失敗すると「[_text name=vomstyle.overlay]」方式が使用されます。

	[li][indent]「[_click tag=vomstyle.layer]」は大抵の場合に正しく表示されますが、
	動きの激しいムービーでは[_link tag=faq.tier text=画面がチラチラする]ことがあります。
	@endindent

@_end
*menu.fsmode|&brows.getText("pos","fullscreenmode.")
@_begin

	マルチモニタ環境での[_link tag=faq.fullscr text=フルスクリーン動作]を設定します。

	@ul
	[li][indent]「[_fullsel tag=fullscreenmode.auto]」
	シングルモニタ環境では「[_text name=fullscreenmode.primaryonly]」が、
	マルチモニタ環境では「[_text name=fullscreenmode.pseudoall]」が、自動で選択されます。[endindent]
	[ul]
	[li]「[_fullsel tag=fullscreenmode.primaryonly]」は

	[li]「[_fullsel tag=fullscreenmode.usepseudo]」は

	[li]「[_fullsel tag=fullscreenmode.pseudoall]」は
	@/ul

@_end
*menu.fsmethod|&brows.getText("pos","fsmethod")
@_begin

	解像度を切り替えるのにDirectXの機能を使わないようにする設定です。
	チェックを入れるとWindows標準の解像度切り替え方法を使用します。

@_end
*menu.vsync|&brows.getText("pos","waitvsync")
@_begin

	モニタの垂直同期を待ってから描画するかどうかの設定です。
	チェックを入れて有効にすると描画のパフォーマンスが低下することがあります。
	また、有効にした場合[_link tag=menu.fps]の設定は無視されます。

@_end
*menu.wheel|&brows.getText("pos","wheel")
@_begin

	マウスのホイール入力にDirectInputを使用しないようにする設定です。
	チェックを入れるとDirectInputの代わりにウィンドウメッセージを使用します。
	マウスのホイールが反応しない場合にこちらを試してみてください。

@_end
*menu.joypad|&brows.getText("pos","joypad")
@_begin

	ゲームパッドの反応を無効にするかどうかの設定です。
	チェックを入れて無効にすると、ゲームパッドが接続されていても無視します。
	ゲームパッドをキーボード入力に割り当てるソフトを使っている場合にご使用ください。

@_end
*menu.lowmem|&brows.getText("pos","memusage")
@_begin

	[_click tag=memusage text=チェック]を入れて再起動すると、できるだけ少ないメモリで動作するようになります。

	メモリの少ない環境ではゲーム全般の動作速度が改善される場合がありますが、
	メモリの十分ある環境では（画像キャッシュなどが無効になるため）逆に動作が遅くなります。

	@ul
	[li][_text section=faq]の[_link tag=faq.slow]を参照してください。
	@/ul

@_end
;----------------------------------------------------------------
*support|お問い合わせについて
@_begin

	[_text pos=helpWebMenuItem default=メニュー]から[_homepage text=ホームページ]を開き、\
	[_text game=このゲーム]のサポートページからお問い合わせください。

	@if exp='brows.getEnabledMenuItem("helpReadmeMenuItem")'
		ホームページが開けない場合は「[_readme]」か[_text game=このゲーム]のマニュアルをご確認ください。
		
	@endif
	初回のお問い合わせの際には[_text pos=helpSupportToolsMenuItem]から[_sptool text=サポートツール]を起動し、
	『環境情報保存』を選んで表示されたテキストをコピーしてお知らせください。

	@_cimg file=help_env

@_end
;----------------------------------------------------------------
