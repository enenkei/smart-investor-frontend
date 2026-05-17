
const { PrismaClient } = require('../generated/prisma/client');
const prisma = new PrismaClient();

async function main() {
    const indicators = await prisma.economicIndicator.findMany({
        select: { indicator: true, name: true }
    });
    const commodities = await prisma.commodities.findMany({
        select: { commodity: true, name: true }
    });

    console.log('Indicators:');
    console.log(JSON.stringify(indicators, null, 2));
    console.log('Commodities:');
    console.log(JSON.stringify(commodities, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
