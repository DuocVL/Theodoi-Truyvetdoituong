import { prisma } from "./configs/prisma.js";

async function main() {
  // Create a new user with a post
  const role = await prisma.role.create({
    data: {
      name: "Alice3",
      
    },
  });
  console.log("Created role:", role);


}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });