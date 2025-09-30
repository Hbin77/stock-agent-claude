import yahooFinance from 'yahoo-finance2';

// 나스닥 100 주요 종목 리스트
const NASDAQ_100_SYMBOLS = [
    'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'GOOG', 'TSLA',
    'AVGO', 'PEP', 'COST', 'ASML', 'AZN', 'CSCO', 'TMUS', 'ADBE',
    'NFLX', 'QCOM', 'INTC', 'AMD', 'INTU', 'AMGN', 'ISRG', 'AMAT'
    // ... 실제로는 100개 전체 리스트
];

async function testNasdaq100Data() {
    console.log('📊 Testing NASDAQ-100 Data Access\n');
    
    // 1. 단일 종목 상세 정보
    console.log('1️⃣ Single Stock Quote (AAPL):');
    const quote = await yahooFinance.quote('AAPL');
    console.log({
        symbol: quote.symbol,
        name: quote.longName,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        pe: quote.trailingPE,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow
    });
    
    // 2. 다중 종목 동시 조회 (상위 5개)
    console.log('\n2️⃣ Multiple Stocks (Top 5):');
    const top5Symbols = NASDAQ_100_SYMBOLS.slice(0, 5);
    const quotes = await yahooFinance.quote(top5Symbols);
    
    quotes.forEach(stock => {
        console.log(`${stock.symbol}: $${stock.regularMarketPrice} (${stock.regularMarketChangePercent?.toFixed(2)}%)`);
    });
    
    // 3. 과거 가격 데이터
    console.log('\n3️⃣ Historical Data (NVDA - Last 5 days):');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);
    
    const historical = await yahooFinance.chart('NVDA', {
        period1: startDate,
        period2: endDate,
        interval: '1d'
    });
    
    historical.quotes.slice(-5).forEach(day => {
        const date = new Date(day.date * 1000).toLocaleDateString();
        console.log(`${date}: Open=$${day.open?.toFixed(2)}, Close=$${day.close?.toFixed(2)}, Volume=${day.volume}`);
    });
    
    // 4. 기술적 지표용 데이터
    console.log('\n4️⃣ Technical Indicators Data (MSFT):');
    const technicalData = await yahooFinance.chart('MSFT', {
        period1: '2024-01-01',
        period2: new Date(),
        interval: '1d'
    });
    
    // 20일 이동평균 계산 예시
    const closes = technicalData.quotes.slice(-20).map(q => q.close);
    const ma20 = closes.reduce((a, b) => a + b, 0) / closes.length;
    console.log(`20-day MA: $${ma20.toFixed(2)}`);
    console.log(`Current Price: $${closes[closes.length - 1].toFixed(2)}`);
    console.log(`Signal: ${closes[closes.length - 1] > ma20 ? 'Above MA (Bullish)' : 'Below MA (Bearish)'}`);
}

// 실행
testNasdaq100Data().catch(console.error);