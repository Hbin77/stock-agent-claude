import yahooFinance from 'yahoo-finance2';

// NASDAQ 100 주요 종목 리스트
const NASDAQ_100_SYMBOLS = [
    'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'GOOG', 'TSLA',
    'AVGO', 'PEP', 'COST', 'ASML', 'AZN', 'CSCO', 'TMUS', 'ADBE',
    'NFLX', 'QCOM', 'INTC', 'AMD', 'INTU', 'AMGN', 'ISRG', 'AMAT'
];

export const stockTools = {
    // 1. 실시간 주식 가격 조회
    async getStockPrice(symbol) {
        try {
            const quote = await yahooFinance.quote(symbol.toUpperCase());
            return {
                symbol: quote.symbol,
                name: quote.longName || quote.shortName,
                price: quote.regularMarketPrice,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                volume: quote.regularMarketVolume,
                marketCap: quote.marketCap,
                dayHigh: quote.regularMarketDayHigh,
                dayLow: quote.regularMarketDayLow,
                previousClose: quote.regularMarketPreviousClose,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to fetch price for ${symbol}: ${error.message}`);
        }
    },

    // 2. 여러 종목 동시 조회
    async getMultipleStockPrices(symbols) {
        try {
            const upperSymbols = symbols.map(s => s.toUpperCase());
            const quotes = await yahooFinance.quote(upperSymbols);
            
            return quotes.map(quote => ({
                symbol: quote.symbol,
                name: quote.longName || quote.shortName,
                price: quote.regularMarketPrice,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                volume: quote.regularMarketVolume
            }));
        } catch (error) {
            throw new Error(`Failed to fetch multiple stocks: ${error.message}`);
        }
    },

    // 3. 과거 가격 데이터 조회
    async getHistoricalData(symbol, period = '1mo') {
        try {
            const validPeriods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'];
            if (!validPeriods.includes(period)) {
                period = '1mo';
            }

            const result = await yahooFinance.chart(symbol.toUpperCase(), {
                period: period,
                interval: period === '1d' ? '5m' : '1d'
            });

            return {
                symbol: symbol.toUpperCase(),
                period: period,
                data: result.quotes.map(q => ({
                    date: new Date(q.date * 1000).toISOString(),
                    open: q.open,
                    high: q.high,
                    low: q.low,
                    close: q.close,
                    volume: q.volume
                }))
            };
        } catch (error) {
            throw new Error(`Failed to fetch historical data for ${symbol}: ${error.message}`);
        }
    },

    // 4. 기술적 지표 계산
    async getTechnicalIndicators(symbol) {
        try {
            // 날짜 계산
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 3); // 3개월 전
            
            // period1과 period2 사용
            const historical = await yahooFinance.chart(symbol.toUpperCase(), {
                period1: startDate.toISOString().split('T')[0], // 'YYYY-MM-DD' 형식
                period2: endDate.toISOString().split('T')[0],
                interval: '1d'
            });

            const prices = historical.quotes.map(q => q.close).filter(p => p != null);
            
            // 이동평균 계산
            const ma20 = this.calculateMA(prices, 20);
            const ma50 = this.calculateMA(prices, 50);
            
            // RSI 계산
            const rsi = this.calculateRSI(prices, 14);
            
            // 볼륨 분석
            const volumes = historical.quotes.map(q => q.volume).filter(v => v != null);
            const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
            const currentVolume = volumes[volumes.length - 1];
            
            return {
                symbol: symbol.toUpperCase(),
                price: prices[prices.length - 1],
                ma20: ma20,
                ma50: ma50,
                rsi: rsi,
                volumeRatio: currentVolume / avgVolume,
                signal: this.generateSignal(prices[prices.length - 1], ma20, ma50, rsi),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to calculate indicators for ${symbol}: ${error.message}`);
        }
    },

    // 5. 나스닥 100 시장 전체 개요
    async getNasdaq100Overview() {
        try {
            const topSymbols = NASDAQ_100_SYMBOLS.slice(0, 10); // 상위 10개만
            const quotes = await yahooFinance.quote(topSymbols);
            
            const gainers = [];
            const losers = [];
            
            quotes.forEach(quote => {
                const data = {
                    symbol: quote.symbol,
                    name: quote.shortName,
                    price: quote.regularMarketPrice,
                    changePercent: quote.regularMarketChangePercent
                };
                
                if (quote.regularMarketChangePercent > 0) {
                    gainers.push(data);
                } else {
                    losers.push(data);
                }
            });
            
            // 정렬
            gainers.sort((a, b) => b.changePercent - a.changePercent);
            losers.sort((a, b) => a.changePercent - b.changePercent);
            
            return {
                marketTrend: gainers.length > losers.length ? 'Bullish' : 'Bearish',
                topGainers: gainers.slice(0, 5),
                topLosers: losers.slice(0, 5),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to fetch NASDAQ 100 overview: ${error.message}`);
        }
    },

    // 6. 재무 정보 조회
    async getFinancialInfo(symbol) {
        try {
            const stock = await yahooFinance.quoteSummary(symbol.toUpperCase(), {
                modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail']
            });

            return {
                symbol: symbol.toUpperCase(),
                financialData: {
                    currentPrice: stock.financialData?.currentPrice,
                    targetMeanPrice: stock.financialData?.targetMeanPrice,
                    recommendationMean: stock.financialData?.recommendationMean,
                    recommendationKey: stock.financialData?.recommendationKey,
                    numberOfAnalystOpinions: stock.financialData?.numberOfAnalystOpinions
                },
                keyStatistics: {
                    peRatio: stock.summaryDetail?.trailingPE,
                    forwardPE: stock.summaryDetail?.forwardPE,
                    pegRatio: stock.defaultKeyStatistics?.pegRatio,
                    priceToBook: stock.defaultKeyStatistics?.priceToBook,
                    profitMargins: stock.financialData?.profitMargins,
                    beta: stock.defaultKeyStatistics?.beta
                },
                valuation: this.getValuationSignal(
                    stock.summaryDetail?.trailingPE,
                    stock.defaultKeyStatistics?.pegRatio
                )
            };
        } catch (error) {
            throw new Error(`Failed to fetch financial info for ${symbol}: ${error.message}`);
        }
    },

    // 보조 함수들
    calculateMA(prices, period) {
        if (prices.length < period) return null;
        const relevantPrices = prices.slice(-period);
        return relevantPrices.reduce((a, b) => a + b, 0) / period;
    },

    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return null;
        
        let gains = 0;
        let losses = 0;
        
        for (let i = prices.length - period; i < prices.length; i++) {
            const change = prices[i] - prices[i - 1];
            if (change > 0) gains += change;
            else losses += Math.abs(change);
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        
        if (avgLoss === 0) return 100;
        
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    },

    generateSignal(price, ma20, ma50, rsi) {
        let signal = 'NEUTRAL';
        let strength = 0;
        
        // 이동평균 신호
        if (ma20 && ma50) {
            if (price > ma20 && ma20 > ma50) {
                signal = 'BUY';
                strength += 2;
            } else if (price < ma20 && ma20 < ma50) {
                signal = 'SELL';
                strength -= 2;
            }
        }
        
        // RSI 신호
        if (rsi) {
            if (rsi < 30) {
                signal = signal === 'BUY' ? 'STRONG_BUY' : 'BUY';
                strength += 1;
            } else if (rsi > 70) {
                signal = signal === 'SELL' ? 'STRONG_SELL' : 'SELL';
                strength -= 1;
            }
        }
        
        return {
            action: signal,
            strength: Math.abs(strength),
            reasoning: this.getSignalReasoning(price, ma20, ma50, rsi)
        };
    },

    getSignalReasoning(price, ma20, ma50, rsi) {
        const reasons = [];
        
        if (ma20 && price > ma20) reasons.push('Price above 20-day MA');
        if (ma20 && price < ma20) reasons.push('Price below 20-day MA');
        if (ma20 && ma50 && ma20 > ma50) reasons.push('Golden cross pattern');
        if (ma20 && ma50 && ma20 < ma50) reasons.push('Death cross pattern');
        if (rsi && rsi < 30) reasons.push('RSI indicates oversold');
        if (rsi && rsi > 70) reasons.push('RSI indicates overbought');
        
        return reasons.join(', ') || 'Neutral market conditions';
    },

    getValuationSignal(pe, peg) {
        if (!pe) return 'Unknown';
        
        if (pe < 15) return 'Undervalued';
        if (pe > 30) return 'Overvalued';
        if (peg && peg < 1) return 'Good value';
        if (peg && peg > 2) return 'Expensive';
        
        return 'Fair value';
    }
};