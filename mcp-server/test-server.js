import { stockTools } from './stock-tools.js';

async function testAllTools() {
    console.log('🧪 Testing MCP Server Tools\n');
    
    // 1. 단일 주식 테스트
    console.log('1. Testing get_stock_price:');
    const price = await stockTools.getStockPrice('AAPL');
    console.log(`AAPL: $${price.price} (${price.changePercent.toFixed(2)}%)\n`);
    
    // 2. 다중 주식 테스트
    console.log('2. Testing get_multiple_stocks:');
    const multiple = await stockTools.getMultipleStockPrices(['MSFT', 'NVDA', 'GOOGL']);
    multiple.forEach(s => console.log(`${s.symbol}: $${s.price}`));
    console.log();
    
    // 3. 기술적 지표 테스트
    console.log('3. Testing technical indicators:');
    const indicators = await stockTools.getTechnicalIndicators('NVDA');
    console.log(`NVDA - RSI: ${indicators.rsi?.toFixed(2)}, Signal: ${indicators.signal.action}\n`);
    
    // 4. 시장 개요 테스트
    console.log('4. Testing market overview:');
    const overview = await stockTools.getNasdaq100Overview();
    console.log(`Market: ${overview.marketTrend}`);
    console.log(`Top Gainer: ${overview.topGainers[0]?.symbol} (+${overview.topGainers[0]?.changePercent.toFixed(2)}%)`);
    
    console.log('\n✅ All tests completed!');
}

testAllTools().catch(console.error);