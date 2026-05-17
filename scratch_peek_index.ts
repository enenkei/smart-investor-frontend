import { prisma } from './lib/prisma'

async function main() {
  const data = await prisma.index_data.findFirst()
  console.log(JSON.stringify(data, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
