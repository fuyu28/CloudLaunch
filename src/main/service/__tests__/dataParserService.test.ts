/**
 * @fileoverview dataParserService.tsのテスト
 *
 * データパーサーサービスの動作を網羅的にテストします。
 * ファイル形式の判定から解析処理、バリデーション機能までをカバーしています。
 *
 * テスト対象：
 * - ファイル形式の自動判定（拡張子・内容解析）
 * - JSON/CSV/SQL形式のファイル解析
 * - ファイル分析と統計情報取得
 * - エラーハンドリングとバリデーション機能
 */

/// <reference types="jest" />

import type { ImportFormat } from "../../ipcHandlers/dataExportHandlers"
import { DataParserService } from "../dataParserService"

describe("DataParserService", () => {
  let dataParserService: DataParserService

  beforeEach(() => {
    dataParserService = new DataParserService()
  })

  describe("detectFormat", () => {
    it("ファイル拡張子からJSON形式を判定する", () => {
      const result = dataParserService.detectFormat("/path/to/data.json", "")
      expect(result).toBe("json")
    })

    it("ファイル拡張子からCSV形式を判定する", () => {
      const result = dataParserService.detectFormat("/path/to/data.csv", "")
      expect(result).toBe("csv")
    })

    it("ファイル拡張子からSQL形式を判定する", () => {
      const result = dataParserService.detectFormat("/path/to/data.sql", "")
      expect(result).toBe("sql")
    })

    it("内容からJSON形式を推測する", () => {
      const jsonContent = '{"data": {"games": []}}'
      const result = dataParserService.detectFormat("/path/to/data.txt", jsonContent)
      expect(result).toBe("json")
    })

    it("内容からSQL形式を推測する", () => {
      const sqlContent = "INSERT INTO games (id) VALUES (1);"
      const result = dataParserService.detectFormat("/path/to/data.txt", sqlContent)
      expect(result).toBe("sql")
    })

    it("内容からCSV形式を推測する", () => {
      const csvContent = "id,title\n1,Game1\n2,Game2"
      const result = dataParserService.detectFormat("/path/to/data.txt", csvContent)
      expect(result).toBe("csv")
    })

    it("判定不可の場合はnullを返す", () => {
      const result = dataParserService.detectFormat("/path/to/data.unknown", "invalid content")
      expect(result).toBe(null)
    })
  })

  describe("parseFile", () => {
    describe("JSON形式の解析", () => {
      it("正常にJSONファイルを解析できる", async () => {
        const jsonData = JSON.stringify({
          data: {
            games: [
              { id: "1", title: "Game1" },
              { id: "2", title: "Game2" }
            ],
            playSessions: [{ id: "1", gameId: "1" }]
          }
        })

        const result = await dataParserService.parseFile(jsonData, "json")

        expect(result.format).toBe("json")
        expect(result.data.games).toHaveLength(2)
        expect(result.data.playSessions).toHaveLength(1)
        expect(result.data.games[0]).toEqual({ id: "1", title: "Game1" })
      })

      it("メタデータ付きJSON形式を解析できる", async () => {
        const jsonData = JSON.stringify({
          exportedAt: "2024-01-01T00:00:00.000Z",
          version: "1.0",
          data: {
            games: [{ id: "1", title: "Game1" }]
          }
        })

        const result = await dataParserService.parseFile(jsonData, "json")

        expect(result.format).toBe("json")
        expect(result.metadata?.exportedAt).toBe("2024-01-01T00:00:00.000Z")
        expect(result.metadata?.version).toBe("1.0")
        expect(result.data.games).toHaveLength(1)
      })

      it("無効なJSON形式でエラーを投げる", async () => {
        const invalidJson = "{ invalid json }"

        await expect(dataParserService.parseFile(invalidJson, "json")).rejects.toThrow()
      })
    })

    describe("CSV形式の解析", () => {
      it("正常にCSVファイルを解析できる", async () => {
        const csvData = `# games
id,title,publisher
1,Game1,Publisher1
2,Game2,Publisher2

# playSessions
id,gameId,duration
1,1,3600`

        const result = await dataParserService.parseFile(csvData, "csv")

        expect(result.format).toBe("csv")
        expect(result.data.games).toHaveLength(2)
        expect(result.data.playsessions).toHaveLength(1)
        expect(result.data.games[0]).toEqual({
          id: "1",
          title: "Game1",
          publisher: "Publisher1"
        })
      })

      it("空の値をnullとして処理する", async () => {
        const csvData = `# games
id,title,publisher,imagePath
1,Game1,,`

        const result = await dataParserService.parseFile(csvData, "csv")

        expect(result.format).toBe("csv")
        expect(result.data.games).toHaveLength(1)
        expect(result.data.games[0]).toEqual({
          id: "1",
          title: "Game1",
          publisher: null,
          imagePath: null
        })
      })

      it("引用符とエスケープを適切に処理する", async () => {
        const csvData = `# games
id,title,description
1,"Game, With Comma","Description with ""quotes"""`

        const result = await dataParserService.parseFile(csvData, "csv")

        expect(result.format).toBe("csv")
        expect(result.data.games[0]).toEqual({
          id: "1",
          title: "Game, With Comma",
          description: 'Description with "quotes"'
        })
      })

      it("無効なCSV形式でエラーを投げる", async () => {
        const invalidCsv = "no valid csv content"

        await expect(dataParserService.parseFile(invalidCsv, "csv")).rejects.toThrow(
          "有効なCSV形式ではありません"
        )
      })
    })

    describe("SQL形式の解析", () => {
      it("正常にSQLファイルを解析できる", async () => {
        const sqlData = `
INSERT INTO games (id, title, publisher) VALUES ('1', 'Game1', 'Publisher1');
INSERT INTO games (id, title, publisher) VALUES ('2', 'Game2', 'Publisher2');
INSERT INTO playSessions (id, gameId, duration) VALUES ('1', '1', 3600);
`

        const result = await dataParserService.parseFile(sqlData, "sql")

        expect(result.format).toBe("sql")
        expect(result.data.games).toHaveLength(2)
        expect(result.data.playsessions).toHaveLength(1)
        expect(result.data.games[0]).toEqual({
          id: "1",
          title: "Game1",
          publisher: "Publisher1"
        })
      })

      it("NULL値を適切に処理する", async () => {
        const sqlData = `
INSERT INTO games (id, title, publisher, imagePath) VALUES ('1', 'Game1', NULL, NULL);
`

        const result = await dataParserService.parseFile(sqlData, "sql")

        expect(result.format).toBe("sql")
        expect(result.data.games[0]).toEqual({
          id: "1",
          title: "Game1",
          publisher: null,
          imagePath: null
        })
      })

      it("シングルクォートのエスケープを処理する", async () => {
        const sqlData = `
INSERT INTO games (id, title) VALUES ('1', 'Game''s Title');
`

        const result = await dataParserService.parseFile(sqlData, "sql")

        expect(result.format).toBe("sql")
        expect(result.data.games[0]).toEqual({
          id: "1",
          title: "Game's Title"
        })
      })

      it("無効なSQL形式でエラーを投げる", async () => {
        const invalidSql = "no valid sql content"

        await expect(dataParserService.parseFile(invalidSql, "sql")).rejects.toThrow(
          "有効なSQL形式ではありません"
        )
      })
    })

    it("サポートされていない形式でエラーを投げる", async () => {
      const content = "some content"

      await expect(dataParserService.parseFile(content, "xml" as ImportFormat)).rejects.toThrow(
        "サポートされていない形式です: xml"
      )
    })
  })

  describe("analyzeFile", () => {
    it("JSON形式のファイルを正しく分析する", async () => {
      const jsonData = JSON.stringify({
        data: {
          games: [{ id: "1" }, { id: "2" }],
          playSessions: [{ id: "1" }]
        }
      })

      const result = await dataParserService.analyzeFile(jsonData, "json")

      expect(result.format).toBe("json")
      expect(result.hasValidStructure).toBe(true)
      expect(result.recordCounts).toEqual({
        games: 2,
        playSessions: 1
      })
    })

    it("CSV形式のファイルを正しく分析する", async () => {
      const csvData = `# games
id,title
1,Game1
2,Game2

# playSessions
id,gameId
1,1`

      const result = await dataParserService.analyzeFile(csvData, "csv")

      expect(result.format).toBe("csv")
      expect(result.hasValidStructure).toBe(true)
      expect(result.recordCounts).toEqual({
        games: 2,
        playsessions: 1
      })
    })

    it("SQL形式のファイルを正しく分析する", async () => {
      const sqlData = `
INSERT INTO games (id, title) VALUES ('1', 'Game1');
INSERT INTO games (id, title) VALUES ('2', 'Game2');
INSERT INTO playSessions (id, gameId) VALUES ('1', '1');
`

      const result = await dataParserService.analyzeFile(sqlData, "sql")

      expect(result.format).toBe("sql")
      expect(result.hasValidStructure).toBe(true)
      expect(result.recordCounts).toEqual({
        games: 2,
        playsessions: 1
      })
    })

    it("無効なデータの場合にfalseを返す", async () => {
      const invalidData = "invalid data"

      const result = await dataParserService.analyzeFile(invalidData, "json")

      expect(result.format).toBe("json")
      expect(result.hasValidStructure).toBe(false)
      expect(result.recordCounts).toEqual({})
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it("形式がnullの場合にfalseを返す", async () => {
      const jsonData = '{"data": {}}'

      const result = await dataParserService.analyzeFile(jsonData, null)

      expect(result.format).toBe(null)
      expect(result.hasValidStructure).toBe(false)
      expect(result.recordCounts).toEqual({})
      expect(result.errors).toEqual(["ファイル形式を判定できませんでした"])
    })
  })
})
