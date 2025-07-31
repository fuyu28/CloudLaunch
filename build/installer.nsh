!macro preInit
  ; 一時フォルダーの名前を設定
  !define MUI_TEMP "CloudLaunch"
!macroend

!macro customUnInstall
  ; アンインストール時にユーザーデータ削除の確認ダイアログを表示
  MessageBox MB_YESNO|MB_ICONQUESTION "CloudLaunchのユーザーデータ（ゲーム情報、設定、ログなど）も削除しますか？$\r$\n$\r$\n「はい」を選択すると、すべてのゲームデータと設定が完全に削除されます。" \
    IDYES delete_userdata IDNO skip_userdata

  delete_userdata:
    ; AppDataフォルダのcloud_launchディレクトリを削除
    RMDir /r "$APPDATA\cloud_launch"
    ; ログファイルなどが保存されている可能性のあるLocalフォルダも削除
    RMDir /r "$LOCALAPPDATA\cloud_launch"
    DetailPrint "ユーザーデータを削除しました"
    Goto done_userdata

  skip_userdata:
    DetailPrint "ユーザーデータは保持されます"

  done_userdata:
!macroend