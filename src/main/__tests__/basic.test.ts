/**
 * @fileoverview 基本テスト
 */

/// <reference types="jest" />

describe("基本テスト", () => {
  it("基本的な計算が動作する", () => {
    expect(1 + 1).toBe(2)
  })

  it("文字列の結合が動作する", () => {
    expect("Hello" + " World").toBe("Hello World")
  })
})
