import { PrismaClient } from "@prisma/client"
import { faker } from "@faker-js/faker"

const prisma = new PrismaClient()

type DummyType = {
  title: string
  publisher: string
}

const DUMMY_DATA: DummyType[] = [
  { title: "WHITE ALBUM2", publisher: "Leaf" },
  { title: "Summer Pockets REFLECTION BLUE", publisher: "Key" },
  { title: "オトメ＊ドメイン", publisher: "ぱれっとクトリア" },
  { title: "きまぐれテンプテーション2 ゆうやみ廻奇譚", publisher: "シルキーズプラスWASABI" },
  { title: "9-nine- ここのつここのかここのいろ", publisher: "ぱれっと" }
]

async function main(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    const dummy = DUMMY_DATA[i]
    const game = await prisma.game.create({
      data: {
        title: dummy.title,
        publisher: dummy.publisher,
        saveFolderPath: `D:\\game\\Novel\\${i}`,
        exePath: `D:\\game\\Novel\\${i}\\game.exe`,
        imagePath: `D:\\game\\Novel\\${i}\\image.png`
      }
    })

    const sessionCount = faker.number.int({ min: 1, max: 5 })
    for (let j = 0; j < sessionCount; j++) {
      await prisma.playSession.create({
        data: {
          gameId: game.id,
          playedAt: faker.date.past(),
          duration: faker.number.int({ min: 600, max: 1000 })
        }
      })
    }
  }
  console.log("Set data created!")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
