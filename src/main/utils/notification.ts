/**
 * @fileoverview システム通知機能のユーティリティ
 * Electronのnotificationを使用してシステム通知を表示する
 */

import { Notification } from "electron"

/**
 * システム通知を表示
 * @param title 通知のタイトル
 * @param body 通知の本文
 */
export const showNotification = (title: string, body: string): void => {
  try {
    if (Notification.isSupported()) {
      new Notification({
        title,
        body,
        icon: process.platform === "win32" ? "assets/icon.ico" : "assets/icon.png"
      }).show()
    }
  } catch (error) {
    console.error("通知の表示に失敗:", error)
  }
}
