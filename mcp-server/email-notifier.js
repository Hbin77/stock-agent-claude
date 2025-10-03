// mcp-server/email-notifier.js
import nodemailer from 'nodemailer';

export class EmailNotifier {
    constructor() {
        // Gmail SMTP 설정
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER, // Gmail 주소
                pass: process.env.EMAIL_APP_PASSWORD // Gmail 앱 비밀번호
            }
        });
    }

    // 주식 가격 알림
    async sendPriceAlert(stockData, recipientEmail) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `📊 ${stockData.symbol} Stock Alert - $${stockData.price}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Stock Price Alert</h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${stockData.symbol} - ${stockData.name}</h3>
                        <p style="font-size: 24px; font-weight: bold; color: ${stockData.change >= 0 ? '#27ae60' : '#e74c3c'};">
                            $${stockData.price}
                        </p>
                        <p style="color: ${stockData.change >= 0 ? '#27ae60' : '#e74c3c'};">
                            ${stockData.change >= 0 ? '▲' : '▼'} ${Math.abs(stockData.change).toFixed(2)} (${stockData.changePercent.toFixed(2)}%)
                        </p>
                    </div>

                    <div style="margin: 20px 0;">
                        <p><strong>Volume:</strong> ${stockData.volume?.toLocaleString()}</p>
                        <p><strong>Market Cap:</strong> $${(stockData.marketCap / 1e9).toFixed(2)}B</p>
                        <p><strong>Day Range:</strong> ${stockData.dayLow} - ${stockData.dayHigh}</p>
                    </div>

                    <p style="color: #7f8c8d; font-size: 12px;">
                        Timestamp: ${new Date(stockData.timestamp).toLocaleString()}
                    </p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent to ${recipientEmail}`);
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    // 기술적 지표 알림
    async sendTechnicalAlert(indicators, recipientEmail) {
        const { symbol, signal, price, ma20, ma50, rsi } = indicators;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `🎯 ${symbol} Technical Signal: ${signal.action}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Technical Analysis Alert</h2>
                    
                    <div style="background: ${this.getSignalColor(signal.action)}; padding: 20px; border-radius: 8px; margin: 20px 0; color: white;">
                        <h3 style="margin-top: 0;">${symbol}</h3>
                        <p style="font-size: 28px; font-weight: bold;">
                            ${this.getSignalEmoji(signal.action)} ${signal.action}
                        </p>
                        <p>${signal.reasoning}</p>
                    </div>

                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <h4>Technical Indicators:</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Current Price:</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${price?.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>MA(20):</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${ma20?.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>MA(50):</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${ma50?.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>RSI(14):</strong></td>
                                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${rsi?.toFixed(2)}</td>
                            </tr>
                        </table>
                    </div>

                    <p style="color: #7f8c8d; font-size: 12px; margin-top: 20px;">
                        Generated at: ${new Date().toLocaleString()}
                    </p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Technical alert sent to ${recipientEmail}`);
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    // NASDAQ-100 시장 개요 알림
    async sendMarketOverview(overview, recipientEmail) {
        const { marketTrend, topGainers, topLosers } = overview;
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `📈 NASDAQ-100 Market Overview - ${marketTrend}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">NASDAQ-100 Daily Summary</h2>
                    
                    <div style="text-align: center; padding: 20px; background: ${marketTrend === 'Bullish' ? '#d4edda' : '#f8d7da'}; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0;">Market Trend: ${marketTrend}</h3>
                    </div>

                    <div style="margin: 20px 0;">
                        <h3 style="color: #27ae60;">📈 Top 5 Gainers</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            ${topGainers.map(stock => `
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;"><strong>${stock.symbol}</strong></td>
                                    <td style="padding: 10px;">${stock.name}</td>
                                    <td style="padding: 10px; text-align: right; color: #27ae60;">
                                        +${stock.changePercent.toFixed(2)}%
                                    </td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>

                    <div style="margin: 20px 0;">
                        <h3 style="color: #e74c3c;">📉 Top 5 Losers</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            ${topLosers.map(stock => `
                                <tr style="border-bottom: 1px solid #ddd;">
                                    <td style="padding: 10px;"><strong>${stock.symbol}</strong></td>
                                    <td style="padding: 10px;">${stock.name}</td>
                                    <td style="padding: 10px; text-align: right; color: #e74c3c;">
                                        ${stock.changePercent.toFixed(2)}%
                                    </td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>

                    <p style="color: #7f8c8d; font-size: 12px; text-align: center;">
                        Report generated at: ${new Date().toLocaleString()}
                    </p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Market overview sent to ${recipientEmail}`);
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    // 포트폴리오 추천 알림
    async sendPortfolioRecommendation(portfolio, recipientEmail) {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: '💼 Your Personalized Portfolio Recommendation',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Portfolio Recommendation</h2>
                    
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Portfolio Summary</h3>
                        <p><strong>Total Value:</strong> $${portfolio.totalValue?.toLocaleString()}</p>
                        <p><strong>Expected Return:</strong> ${portfolio.expectedReturn?.toFixed(2)}%</p>
                        <p><strong>Risk Score:</strong> ${portfolio.riskScore?.toFixed(1)}/10</p>
                    </div>

                    <div style="margin: 20px 0;">
                        <h3>Recommended Stocks</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #e9ecef;">
                                    <th style="padding: 10px; text-align: left;">Symbol</th>
                                    <th style="padding: 10px; text-align: left;">Sector</th>
                                    <th style="padding: 10px; text-align: right;">Shares</th>
                                    <th style="padding: 10px; text-align: right;">Value</th>
                                    <th style="padding: 10px; text-align: center;">Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${portfolio.stocks?.map(stock => `
                                    <tr style="border-bottom: 1px solid #ddd;">
                                        <td style="padding: 10px;"><strong>${stock.symbol}</strong></td>
                                        <td style="padding: 10px;">${stock.sector}</td>
                                        <td style="padding: 10px; text-align: right;">${stock.shares}</td>
                                        <td style="padding: 10px; text-align: right;">$${stock.value?.toFixed(2)}</td>
                                        <td style="padding: 10px; text-align: center;">
                                            <span style="background: ${stock.aiScore >= 70 ? '#27ae60' : '#f39c12'}; color: white; padding: 4px 8px; border-radius: 4px;">
                                                ${stock.aiScore}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin-top: 20px;">
                        This is not financial advice. Please do your own research.
                    </p>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Portfolio recommendation sent to ${recipientEmail}`);
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    // 헬퍼 메서드
    getSignalColor(action) {
        const colors = {
            'STRONG_BUY': '#27ae60',
            'BUY': '#2ecc71',
            'NEUTRAL': '#95a5a6',
            'SELL': '#e67e22',
            'STRONG_SELL': '#e74c3c'
        };
        return colors[action] || '#95a5a6';
    }

    getSignalEmoji(action) {
        const emojis = {
            'STRONG_BUY': '🚀',
            'BUY': '📈',
            'NEUTRAL': '⏸️',
            'SELL': '📉',
            'STRONG_SELL': '⚠️'
        };
        return emojis[action] || '📊';
    }
}

// 스케줄러 - 정기적으로 이메일 전송
export class EmailScheduler {
    constructor(emailNotifier, stockTools) {
        this.notifier = emailNotifier;
        this.stockTools = stockTools;
    }

    // 매일 시장 개장 전 요약 발송 (오전 9시)
    scheduleDailyReport(recipientEmail, symbols = ['AAPL', 'MSFT', 'NVDA']) {
        setInterval(async () => {
            const now = new Date();
            if (now.getHours() === 9 && now.getMinutes() === 0) {
                const overview = await this.stockTools.getNasdaq100Overview();
                await this.notifier.sendMarketOverview(overview, recipientEmail);
            }
        }, 60000); // 매 분마다 체크
    }

    // 특정 주식 실시간 모니터링
    monitorStockRealtime(symbol, recipientEmail, checkIntervalMinutes = 5) {
        setInterval(async () => {
            try {
                const stockData = await this.stockTools.getStockPrice(symbol);
                const indicators = await this.stockTools.getTechnicalIndicators(symbol);
                
                // 강한 매수/매도 신호일 때만 알림
                if (['STRONG_BUY', 'STRONG_SELL'].includes(indicators.signal.action)) {
                    await this.notifier.sendTechnicalAlert(indicators, recipientEmail);
                }
                
                // 급격한 가격 변동 감지 (5% 이상)
                if (Math.abs(stockData.changePercent) >= 5) {
                    await this.notifier.sendPriceAlert(stockData, recipientEmail);
                }
            } catch (error) {
                console.error(`Error monitoring ${symbol}:`, error);
            }
        }, checkIntervalMinutes * 60 * 1000);
    }
}