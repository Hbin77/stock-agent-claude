// mcp-server/backtesting.js
export class BacktestingEngine {
    async backtest(symbol, strategy, period = '1y') {
        const historical = await this.getHistoricalData(symbol, period);
        const trades = [];
        let position = null;
        let capital = 10000;
        
        for (let i = 20; i < historical.length; i++) {
            const currentData = historical.slice(0, i);
            const aiScore = await this.calculateHistoricalScore(currentData);
            
            if (!position && aiScore >= 70) {
                // 매수 신호
                position = {
                    entry: historical[i].close,
                    shares: Math.floor(capital / historical[i].close),
                    date: historical[i].date
                };
                trades.push({ type: 'BUY', ...position });
            } else if (position && aiScore <= 40) {
                // 매도 신호
                const exitPrice = historical[i].close;
                const profit = (exitPrice - position.entry) * position.shares;
                capital += profit;
                
                trades.push({
                    type: 'SELL',
                    exit: exitPrice,
                    profit,
                    returnPct: ((exitPrice - position.entry) / position.entry) * 100
                });
                
                position = null;
            }
        }
        
        return {
            trades,
            totalReturn: ((capital - 10000) / 10000) * 100,
            winRate: this.calculateWinRate(trades),
            sharpeRatio: this.calculateSharpeRatio(trades)
        };
    }
}