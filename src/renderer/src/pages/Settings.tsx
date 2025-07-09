/**
 * @fileoverview 設定ページ
 *
 * アプリケーションの各種設定を管理するページです。
 * タブ形式で一般設定とR2/S3設定を分けています。
 *
 * 主な機能：
 * - タブナビゲーション
 * - 一般設定（テーマ変更等）
 * - R2/S3設定（クラウドストレージ）
 *
 * 使用技術：
 * - React Hooks（useState）
 * - DaisyUI タブコンポーネント
 * - 分離されたコンポーネント
 */

import React, { useState } from "react"
import GeneralSettings from "@renderer/components/GeneralSettings"
import R2S3Settings from "@renderer/components/R2S3Settings"

type TabType = "general" | "r2s3"

/**
 * 設定ページコンポーネント
 *
 * タブ形式で一般設定とR2/S3設定を提供します。
 *
 * @returns 設定ページ要素
 */
export default function Settings(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>("general")

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-6">設定</h1>

      {/* タブナビゲーション */}
      <div className="tabs tabs-lifted mb-6">
        <button
          className={`tab tab-lifted ${activeTab === "general" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("general")}
        >
          一般設定
        </button>
        <button
          className={`tab tab-lifted ${activeTab === "r2s3" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("r2s3")}
        >
          R2/S3 設定
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="bg-base-100 p-6 rounded-lg shadow">
        {activeTab === "general" && <GeneralSettings />}
        {activeTab === "r2s3" && <R2S3Settings />}
      </div>
    </div>
  )
}
