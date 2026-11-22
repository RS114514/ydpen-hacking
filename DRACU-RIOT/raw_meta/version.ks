; バージョン番号を指定
; パッチをあてる場合はこのファイルも更新する
[eval exp='global.software_version = "1.0"']
[eval exp='global.software_version += " / rev:"+Scripts.evalStorage("currev.ini")' cond='Storages.isExistentStorage("currev.ini")']
[return]
