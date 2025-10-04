// mcp-server/portfolio-tracker.js
import fs from 'fs/promises';
import path from 'path';

const PORTFOLIO_FILE = path.join(process.cwd(), 'my-portfolio.json');

export class PortfolioTracker {
    constructor() {
        this.portfolio = [];
        this.monitoringActive = false;
    }

    // 포트폴리오 파일 로드
    async loadPortfolio() {
        try {
            const data = await fs.readFile(PORTFOLIO_FILE, 'utf-8');
            this.portfolio = JSON.parse(data);
            console.error(`✅ Loaded ${this.portfolio.length} stocks from portfolio`);
            return this.portfolio;
        } catch (error) {
            // 파일이 없으면 빈 포트폴리오로 시작
            this.portfolio = [];
            console.error('📝 Starting with empty portfolio');
            return this.portfolio;
        }
    }

    // 포트폴리오 파일 저장
    async savePortfolio() {
        try {
            await fs.writeFile(PORTFOLIO_FILE, JSON.stringify(this.portfolio, null, 2));
            console.error('💾 Portfolio saved');
        } catch (error) {
            console.error('❌ Failed to save portfolio:', error.message);
        }
    }

    // 주식 추가
    async addStock(symbol, shares, purchasePrice) {
        const existing = this.portfolio.find(s => s.symbol === symbol.toUpperCase());
        
        if (existing) {
            // 이미 있으면 평균 단가로 업데이트
            const totalShares = existing.shares + shares;
            const totalCost = (existing.shares * existing.purchasePrice) + (shares * purchasePrice);
            existing.shares = totalShares;
            existing.purchasePrice = totalCost / totalShares;
            existing.lastUpdated = new Date().toISOString();
        } else {
            // 새로 추가
            this.portfolio.push({
                symbol: symbol.toUpperCase(),
                shares: shares,
                purchasePrice: purchasePrice,
                addedDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });
        }
        
        await this.savePortfolio();
        return this.portfolio;
    }

    // 주식 제거
    async removeStock(symbol) {
        this.portfolio = this.portfolio.filter(s => s.symbol !== symbol.toUpperCase());
        await this.savePortfolio();
        return this.portfolio;
    }

    // 전체 포트폴리오 조회
    async getPortfolio() {
        return this.portfolio;
    }

    // 포트폴리오 요약 (현재 가치 포함)
    async getPortfolioSummary(stockTools) {
        const summary = [];
        let totalInvested = 0;
        let totalCurrentValue = 0;

        for (const stock of this.portfolio) {
            try {
                const currentData = await stockTools.getStockPrice(stock.symbol);
                const invested = stock.shares * stock.purchasePrice;
                const currentValue = stock.shares * currentData.price;
                const profit = currentValue - invested;
                const profitPercent = (profit / invested) * 100;

                totalInvested += invested;
                totalCurrentValue += currentValue;

                summary.push({
                    symbol: stock.symbol,
                    shares: stock.shares,
                    purchasePrice: stock.purchasePrice,
                    currentPrice: currentData.price,
                    invested: invested,
                    currentValue: currentValue,
                    profit: profit,
                    profitPercent: profitPercent,
                    changeToday: currentData.changePercent
                });
            } catch (error) {
                console.error(`Error getting data for ${stock.symbol}:`, error.message);
            }
        }

        return {
            stocks: summary,
            totalInvested: totalInvested,
            totalCurrentValue: totalCurrentValue,
            totalProfit: totalCurrentValue - totalInvested,
            totalProfitPercent: ((totalCurrentValue - totalInvested) / totalInvested) * 100
        };
    }

    // 포트폴리오 초기화
    async clearPortfolio() {
        this.portfolio = [];
        await this.savePortfolio();
        return { success: true, message: 'Portfolio cleared' };
    }
}

// 포트폴리오 모니터링 시스템
export class PortfolioMonitor {
    constructor(portfolioTracker, stockTools, emailNotifier) {
        this.tracker = portfolioTracker;
        this.stockTools = stockTools;
        this.emailNotifier = emailNotifier;
        this.intervalId = null;
    }

    // 모니터링 시작
    async startMonitoring(options = {}) {
        const {
            checkIntervalMinutes = 5,
            priceAlertThreshold = 5,  // 5% 변동
            profitAlertThreshold = 10, // 10% 수익
            lossAlertThreshold = -5,   // -5% 손실
            email
        } = options;

        console.error('\n🎯 Starting Portfolio Monitoring');
        console.error(`📊 Price alert: ±${priceAlertThreshold}%`);
        console.error(`💰 Profit alert: +${profitAlertThreshold}%`);
        console.error(`⚠️  Loss alert: ${lossAlertThreshold}%`);
        console.error(`⏱️  Check interval: ${checkIntervalMinutes} minutes\n`);

        // 초기 포트폴리오 로드
        await this.tracker.loadPortfolio();

        if (this.tracker.portfolio.length === 0) {
            console.error('⚠️  Portfolio is empty. Add stocks first!');
            return { success: false, message: 'Portfolio is empty' };
        }

        console.error(`📈 Monitoring ${this.tracker.portfolio.length} stocks:`);
        this.tracker.portfolio.forEach(stock => {
            console.error(`   - ${stock.symbol}: ${stock.shares} shares @ $${stock.purchasePrice.toFixed(2)}`);
        });

        // 주기적으로 체크
        this.intervalId = setInterval(async () => {
            await this.checkPortfolio(priceAlertThreshold, profitAlertThreshold, lossAlertThreshold, email);
        }, checkIntervalMinutes * 60 * 1000);

        // 즉시 한 번 체크
        await this.checkPortfolio(priceAlertThreshold, profitAlertThreshold, lossAlertThreshold, email);

        return { 
            success: true, 
            message: `Monitoring ${this.tracker.portfolio.length} stocks`,
            stocks: this.tracker.portfolio.map(s => s.symbol)
        };
    }

    // 포트폴리오 체크
    async checkPortfolio(priceThreshold, profitThreshold, lossThreshold, email) {
        console.error(`\n[${new Date().toLocaleTimeString()}] Checking portfolio...`);

        const summary = await this.tracker.getPortfolioSummary(this.stockTools);

        for (const stock of summary.stocks) {
            const { symbol, currentPrice, changeToday, profitPercent } = stock;
            
            console.error(`📊 ${symbol}: $${currentPrice.toFixed(2)} | Day: ${changeToday >= 0 ? '+' : ''}${changeToday.toFixed(2)}% | Total: ${profitPercent >= 0 ? '+' : ''}${profitPercent.toFixed(2)}%`);

            // 당일 급변동 알림
            if (Math.abs(changeToday) >= priceThreshold) {
                console.error(`🚨 ${symbol} moved ${changeToday.toFixed(2)}% today!`);
                await this.sendStockAlert(stock, 'PRICE_CHANGE', email);
            }

            // 수익 목표 달성 알림
            if (profitPercent >= profitThreshold) {
                console.error(`💰 ${symbol} reached ${profitPercent.toFixed(2)}% profit!`);
                await this.sendStockAlert(stock, 'PROFIT_TARGET', email);
            }

            // 손실 한계 알림
            if (profitPercent <= lossThreshold) {
                console.error(`⚠️ ${symbol} is down ${profitPercent.toFixed(2)}%!`);
                await this.sendStockAlert(stock, 'LOSS_ALERT', email);
            }
        }

        console.error(`\n💼 Portfolio Total: $${summary.totalCurrentValue.toFixed(2)} | P/L: ${summary.totalProfitPercent >= 0 ? '+' : ''}${summary.totalProfitPercent.toFixed(2)}%`);
    }

    // 알림 이메일 발송
    async sendStockAlert(stock, alertType, email) {
        const alertMessages = {
            'PRICE_CHANGE': `🚨 ${stock.symbol} changed ${stock.changeToday.toFixed(2)}% today`,
            'PROFIT_TARGET': `💰 ${stock.symbol} reached ${stock.profitPercent.toFixed(2)}% profit!`,
            'LOSS_ALERT': `⚠️ ${stock.symbol} is down ${stock.profitPercent.toFixed(2)}%`
        };

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: alertMessages[alertType],
            html: this.generatePortfolioAlertEmail(stock, alertType)
        };

        try {
            await this.emailNotifier.transporter.sendMail(mailOptions);
            console.error(`✅ Alert sent: ${alertMessages[alertType]}`);
        } catch (error) {
            console.error(`❌ Failed to send alert: ${error.message}`);
        }
    }

    // 포트폴리오 알림 이메일 HTML
    generatePortfolioAlertEmail(stock, alertType) {
        const isProfit = stock.profit >= 0;
        const color = isProfit ? '#27ae60' : '#e74c3c';
        
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">📈 Portfolio Alert</h2>
                
                <div style="background: ${color}; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">${stock.symbol}</h3>
                    <p style="font-size: 18px; margin: 5px 0;">Current: $${stock.currentPrice.toFixed(2)}</p>
                    <p style="font-size: 16px; margin: 5px 0;">Today: ${stock.changeToday >= 0 ? '+' : ''}${stock.changeToday.toFixed(2)}%</p>
                </div>

                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h4>Your Position</h4>
                    <p><strong>Shares:</strong> ${stock.shares}</p>
                    <p><strong>Purchase Price:</strong> $${stock.purchasePrice.toFixed(2)}</p>
                    <p><strong>Invested:</strong> $${stock.invested.toFixed(2)}</p>
                    <p><strong>Current Value:</strong> $${stock.currentValue.toFixed(2)}</p>
                    <p style="color: ${color}; font-size: 20px; font-weight: bold;">
                        ${isProfit ? 'Profit' : 'Loss'}: ${isProfit ? '+' : ''}$${stock.profit.toFixed(2)} (${isProfit ? '+' : ''}${stock.profitPercent.toFixed(2)}%)
                    </p>
                </div>

                <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin-top: 20px;">
                    Alert sent at ${new Date().toLocaleString()}
                </p>
            </div>
        `;
    }

    // 모니터링 중지
    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.error('⏹️  Portfolio monitoring stopped');
            return { success: true, message: 'Monitoring stopped' };
        }
        return { success: false, message: 'Monitoring was not active' };
    }
}