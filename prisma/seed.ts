import { PrismaClient } from "@prisma/client"
import { faker } from "@faker-js/faker"

const prisma = new PrismaClient()

async function main(): Promise<void> {
  for (let i = 0; i < 5; i++) {
    const game = await prisma.game.create({
      data: {
        title: faker.lorem.words(3),
        publisher: faker.company.name(),
        folderPath: faker.system.directoryPath(),
        exePath: faker.system.filePath(),
        imagePath: faker.system.filePath()
      }
    })

    const sessionCount = faker.number.int({ min: 1, max: 5 })
    for (let j = 0; j < sessionCount; j++) {
      await prisma.playSession.create({
        data: {
          gameId: game.id,
          playedAt: faker.date.past(),
          duration: faker.number.int({ min: 10, max: 150 })
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
