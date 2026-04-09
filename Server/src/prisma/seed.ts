import { prismaClient } from "../configs/prisma.js"

async function main() {
  await prismaClient.role.createMany({
    data: [
      { name: "ADMIN", description: "Quản trị hệ thống" },
      { name: "USER", description: "Người sử dụng" }
    ],
    skipDuplicates: true
  })
}

main()
  .then(() => console.log("Seed done"))
  .catch(e => console.error(e))
  .finally(() => prismaClient.$disconnect())