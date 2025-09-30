import yahooFinance from 'yahoo-finance2';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

async function analyzeNasdaq100() {
    // 나스닥 100 리스트 로드
    const data = await fs.readFile('./data/nasdaq100.json', 'utf-8');
    const { symbols } = JSON.parse(data);
    
    console.log('🚀 NASDAQ-100 Analysis Starting...\n');
    
    // 1. 전체 시장 개요
    console.log('📊 Market Overview:');
    const marketData = [];
    
    // 배치로 처리 (10개씩)
    for (let i = 0; i < symbols.length; i += 10) {
        const batch = symbols.slice(i, i + 10);
        const quotes = await yahooFinance.quote(batch);
        marketData.push(...quotes);
        
        // API 부하 방지
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 상승/하락 통계
    const gainers = marketData.filter(s => s.regularMarketChangePercent > 0);
    const losers = marketData.filter(s => s.regularMarketChangePercent < 0);
    
    console.log(`✅ Gainers: ${gainers.length}`);
    console.log(`❌ Losers: ${losers.length}`);
    console.log(`➖ Unchanged: ${marketData.length - gainers.length - losers.length}`);
    
    // 2. Top 5 Gainers
    console.log('\n📈 Top 5 Gainers:');
    const topGainers = [...marketData]
        .sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent)
        .slice(0, 5);
    
    topGainers.forEach(stock => {
        console.log(`  ${stock.symbol}: +${stock.regularMarketChangePercent.toFixed(2)}% ($${stock.regularMarketPrice})`);
    });
    
    // 3. Top 5 Losers
    console.log('\n📉 Top 5 Losers:');
    const topLosers = [...marketData]
        .sort((a, b) => a.regularMarketChangePercent - b.regularMarketChangePercent)
        .slice(0, 5);
    
    topLosers.forEach(stock => {
        console.log(`  ${stock.symbol}: ${stock.regularMarketChangePercent.toFixed(2)}% ($${stock.regularMarketPrice})`);
    });
    
    // 4. Volume Leaders
    console.log('\n💹 Top 5 Volume:');
    const topVolume = [...marketData]
        .sort((a, b) => b.regularMarketVolume - a.regularMarketVolume)
        .slice(0, 5);
    
    topVolume.forEach(stock => {
        console.log(`  ${stock.symbol}: ${(stock.regularMarketVolume / 1000000).toFixed(2)}M shares`);
    });
    
    return marketData;
}

// 실행
analyzeNasdaq100()
    .then(() => console.log('\n✅ Analysis Complete!'))
    .catch(console.error);