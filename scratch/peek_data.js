
const { getMacroData } = require('../controllers/stock-data-controller');

async function main() {
    const data = await getMacroData();
    console.log('Indicators:', data.indicators.map(i => ({ indicator: i.indicator, name: i.name })));
    console.log('Commodities:', data.commodities.map(c => ({ commodity: c.commodity, name: c.name })));
}

main().catch(console.error);
