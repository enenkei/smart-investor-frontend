import { prisma } from './lib/prisma'

async function main() {
  const columns = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'fundamental_scores'
  `
  console.log('Columns in fundamental_scores:')
  console.log(columns)

  const sample = await prisma.$queryRaw`
    SELECT ticker, current_price, prev_close, one_day_change, price_history 
    FROM fundamental_scores 
    WHERE price_history IS NOT NULL 
    LIMIT 1
  `
  console.log('\nSample row with price history:')
  console.log(JSON.stringify(sample, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())

