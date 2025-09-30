// scripts/test-technical-indicators.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;

async function getTechnicalIndicators(symbol) {
    console.log(`📈 Technical Analysis for ${symbol}\n`);
    
    // RSI (Relative Strength Index)
    const rsiUrl = `https://www.alphavantage.co/query?function=RSI&symbol=${symbol}&interval=daily&time_period=14&series_type=close&apikey=${ALPHA_VANTAGE_KEY}`;
    const rsiResponse = await axios.get(rsiUrl);
    const latestRSI = Object.values(rsiResponse.data['Technical Analysis: RSI'])[0];
    console.log(`RSI (14): ${parseFloat(latestRSI.RSI).toFixed(2)}`);
    
    // MACD
    const macdUrl = `https://www.alphavantage.co/query?function=MACD&symbol=${symbol}&interval=daily&series_type=close&apikey=${ALPHA_VANTAGE_KEY}`;
    const macdResponse = await axios.get(macdUrl);
    const latestMACD = Object.values(macdResponse.data['Technical Analysis: MACD'])[0];
    console.log(`MACD: ${parseFloat(latestMACD.MACD).toFixed(2)}`);
    console.log(`Signal: ${parseFloat(latestMACD.MACD_Signal).toFixed(2)}`);
    
    // 해석
    const rsiValue = parseFloat(latestRSI.RSI);
    if (rsiValue > 70) console.log('⚠️ RSI indicates: Overbought');
    else if (rsiValue < 30) console.log('⚠️ RSI indicates: Oversold');
    else console.log('✅ RSI indicates: Neutral');
}

// 테스트
getTechnicalIndicators('AAPL').catch(console.error);