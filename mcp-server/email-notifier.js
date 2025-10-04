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

    // 📊 종합 일일 포트폴리오 리포트
    async sendDailyPortfolioReport(reportData, recipientEmail) {
        const { portfolio, recommendations, rebalancing, topPicks, marketOverview, actionItems, date } = reportData;

        const reportDate = new Date(date);
        const formattedDate = reportDate.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `📈 포트폴리오 데일리 리포트 - ${reportDate.toLocaleDateString('ko-KR')}`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; background: #f5f5f5; padding: 20px;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
                        <h1 style="margin: 0; font-size: 28px;">📊 포트폴리오 데일리 리포트</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">${formattedDate}</p>
                    </div>

                    ${this.generatePortfolioSummaryHTML(portfolio)}
                    ${this.generateHoldingsAnalysisHTML(portfolio)}
                    ${this.generateTopPicksHTML(topPicks)}
                    ${this.generateRebalancingHTML(rebalancing)}
                    ${this.generateMarketOverviewHTML(marketOverview)}
                    ${this.generateActionItemsHTML(actionItems)}

                    <!-- Footer -->
                    <div style="text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 30px; padding: 20px; background: white; border-radius: 10px;">
                        <p style="margin: 5px 0;">⚠️ This is not financial advice. Please do your own research.</p>
                        <p style="margin: 5px 0;">Report generated at ${new Date().toLocaleString('ko-KR')}</p>
                        <p style="margin: 5px 0;">Powered by NASDAQ-100 Stock MCP Server</p>
                    </div>
                </div>
            `
        };

        try {
            await this.transporter.sendMail(mailOptions);
            console.error(`✅ Daily portfolio report sent to ${recipientEmail}`);
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            return false;
        }
    }

    // 포트폴리오 요약 HTML
    generatePortfolioSummaryHTML(portfolio) {
        if (portfolio.isEmpty) {
            return `
                <div style="background: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; text-align: center;">
                    <h2 style="color: #e67e22;">📭 포트폴리오가 비어있습니다</h2>
                    <p style="color: #7f8c8d;">주식을 추가하여 포트폴리오를 시작하세요!</p>
                </div>
            `;
        }

        const isProfit = portfolio.totalProfit >= 0;
        const profitColor = isProfit ? '#27ae60' : '#e74c3c';
        const profitIcon = isProfit ? '📈' : '📉';
        const yesterdayChange = 0; // TODO: 전날 대비 계산

        return `
            <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px;">📊 포트폴리오 요약</h2>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                    <div style="background: #ecf0f1; padding: 15px; border-radius: 8px;">
                        <div style="color: #7f8c8d; font-size: 12px; margin-bottom: 5px;">총 투자액</div>
                        <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">$${portfolio.totalInvested.toFixed(2)}</div>
                    </div>
                    <div style="background: #ecf0f1; padding: 15px; border-radius: 8px;">
                        <div style="color: #7f8c8d; font-size: 12px; margin-bottom: 5px;">현재 가치</div>
                        <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">$${portfolio.totalCurrentValue.toFixed(2)}</div>
                    </div>
                    <div style="background: ${profitColor}15; padding: 15px; border-radius: 8px;">
                        <div style="color: #7f8c8d; font-size: 12px; margin-bottom: 5px;">총 수익 ${profitIcon}</div>
                        <div style="font-size: 24px; font-weight: bold; color: ${profitColor};">
                            ${isProfit ? '+' : ''}$${portfolio.totalProfit.toFixed(2)}
                        </div>
                        <div style="font-size: 16px; color: ${profitColor}; margin-top: 5px;">
                            (${isProfit ? '+' : ''}${portfolio.totalProfitPercent.toFixed(2)}%)
                        </div>
                    </div>
                    <div style="background: #ecf0f1; padding: 15px; border-radius: 8px;">
                        <div style="color: #7f8c8d; font-size: 12px; margin-bottom: 5px;">승률</div>
                        <div style="font-size: 24px; font-weight: bold; color: #2c3e50;">
                            ${portfolio.performanceSummary ? portfolio.performanceSummary.winRate.toFixed(0) : 0}%
                        </div>
                        <div style="font-size: 12px; color: #7f8c8d; margin-top: 5px;">
                            ${portfolio.performanceSummary ? portfolio.performanceSummary.winners : 0}승 / ${portfolio.performanceSummary ? portfolio.performanceSummary.losers : 0}패
                        </div>
                    </div>
                </div>

                ${portfolio.performanceSummary && portfolio.performanceSummary.bestPerformer ? `
                    <div style="margin-top: 15px; padding: 12px; background: #d4edda; border-left: 4px solid #27ae60; border-radius: 4px;">
                        <strong style="color: #27ae60;">🏆 최고 수익:</strong> ${portfolio.performanceSummary.bestPerformer.symbol} (+${portfolio.performanceSummary.bestPerformer.profitPercent.toFixed(2)}%)
                    </div>
                ` : ''}

                ${portfolio.performanceSummary && portfolio.performanceSummary.worstPerformer && portfolio.performanceSummary.worstPerformer.profitPercent < 0 ? `
                    <div style="margin-top: 10px; padding: 12px; background: #f8d7da; border-left: 4px solid #e74c3c; border-radius: 4px;">
                        <strong style="color: #e74c3c;">📉 최대 손실:</strong> ${portfolio.performanceSummary.worstPerformer.symbol} (${portfolio.performanceSummary.worstPerformer.profitPercent.toFixed(2)}%)
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 보유 종목 분석 HTML
    generateHoldingsAnalysisHTML(portfolio) {
        if (portfolio.isEmpty || !portfolio.stocks || portfolio.stocks.length === 0) {
            return '';
        }

        const stockRows = portfolio.stocks.map(stock => {
            const profitColor = stock.profit >= 0 ? '#27ae60' : '#e74c3c';
            const aiColor = stock.aiRecommendation?.color || '#95a5a6';

            return `
                <tr style="border-bottom: 1px solid #ecf0f1;">
                    <td style="padding: 15px;">
                        <div style="font-weight: bold; font-size: 16px; color: #2c3e50;">${stock.symbol}</div>
                        <div style="font-size: 12px; color: #7f8c8d; margin-top: 3px;">AI Score: ${stock.aiScore || 'N/A'}/100</div>
                    </td>
                    <td style="padding: 15px; text-align: right;">
                        <div style="font-size: 16px; font-weight: bold;">$${stock.currentPrice.toFixed(2)}</div>
                        <div style="font-size: 12px; color: ${stock.changeToday >= 0 ? '#27ae60' : '#e74c3c'};">
                            ${stock.changeToday >= 0 ? '+' : ''}${stock.changeToday.toFixed(2)}%
                        </div>
                    </td>
                    <td style="padding: 15px; text-align: right;">
                        <div style="font-size: 14px; color: ${profitColor}; font-weight: bold;">
                            ${stock.profit >= 0 ? '+' : ''}${stock.profitPercent.toFixed(2)}%
                        </div>
                        <div style="font-size: 12px; color: #7f8c8d;">
                            ${stock.profit >= 0 ? '+' : ''}$${stock.profit.toFixed(2)}
                        </div>
                    </td>
                    <td style="padding: 15px; text-align: center;">
                        <span style="background: ${aiColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                            ${stock.aiRecommendation?.emoji || '❓'} ${stock.aiRecommendation?.action || 'UNKNOWN'}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px;">🔍 보유 종목 분석</h2>

                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <thead>
                        <tr style="background: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                            <th style="padding: 12px; text-align: left; color: #7f8c8d; font-size: 12px;">종목</th>
                            <th style="padding: 12px; text-align: right; color: #7f8c8d; font-size: 12px;">현재가</th>
                            <th style="padding: 12px; text-align: right; color: #7f8c8d; font-size: 12px;">수익률</th>
                            <th style="padding: 12px; text-align: center; color: #7f8c8d; font-size: 12px;">추천</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stockRows}
                    </tbody>
                </table>

                ${portfolio.sectorAnalysis && portfolio.sectorAnalysis.length > 0 ? `
                    <div style="margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                        <h3 style="color: #2c3e50; font-size: 16px; margin: 0 0 15px 0;">📊 섹터 분포</h3>
                        ${portfolio.sectorAnalysis.slice(0, 3).map(sector => `
                            <div style="margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="font-size: 14px; color: #2c3e50;">${sector.sector}</span>
                                    <span style="font-size: 14px; font-weight: bold; color: #2c3e50;">${sector.percentage.toFixed(1)}%</span>
                                </div>
                                <div style="background: #dee2e6; height: 8px; border-radius: 4px; overflow: hidden;">
                                    <div style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: ${sector.percentage}%; transition: width 0.3s;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // TOP 5 추천 종목 HTML
    generateTopPicksHTML(topPicks) {
        if (!topPicks || topPicks.length === 0) {
            return '';
        }

        const pickRows = topPicks.map((pick, index) => {
            const rec = pick.recommendation || { emoji: '📊', action: 'N/A', color: '#95a5a6' };
            return `
                <tr style="border-bottom: 1px solid #ecf0f1;">
                    <td style="padding: 12px;">
                        <div style="background: #667eea; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${index + 1}
                        </div>
                    </td>
                    <td style="padding: 12px;">
                        <div style="font-weight: bold; font-size: 15px; color: #2c3e50;">${pick.symbol}</div>
                        <div style="font-size: 12px; color: #7f8c8d;">${pick.name || ''}</div>
                    </td>
                    <td style="padding: 12px; text-align: center;">
                        <div style="font-size: 20px; font-weight: bold; color: ${rec.color || '#95a5a6'};">
                            ${pick.aiScore || 'N/A'}
                        </div>
                        <div style="font-size: 11px; color: #7f8c8d;">AI Score</div>
                    </td>
                    <td style="padding: 12px; text-align: right;">
                        <div style="font-size: 16px; font-weight: bold;">$${pick.price ? pick.price.toFixed(2) : 'N/A'}</div>
                        <div style="font-size: 12px; color: ${pick.changePercent >= 0 ? '#27ae60' : '#e74c3c'};">
                            ${pick.changePercent ? (pick.changePercent >= 0 ? '+' : '') + pick.changePercent.toFixed(2) + '%' : 'N/A'}
                        </div>
                    </td>
                    <td style="padding: 12px; text-align: center;">
                        <span style="font-size: 24px;">${rec.emoji}</span>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px;">🚀 오늘의 TOP 5 추천 종목</h2>

                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tbody>
                        ${pickRows}
                    </tbody>
                </table>
            </div>
        `;
    }

    // 리밸런싱 제안 HTML
    generateRebalancingHTML(rebalancing) {
        if (!rebalancing.needed || (!rebalancing.suggestions.length && !rebalancing.risks.length)) {
            return `
                <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
                    <h2 style="color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px;">💡 포트폴리오 조정 제안</h2>
                    <div style="text-align: center; padding: 30px; color: #27ae60;">
                        <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                        <p style="font-size: 18px; margin: 0;">포트폴리오가 양호한 상태입니다!</p>
                    </div>
                </div>
            `;
        }

        const suggestionHTML = rebalancing.suggestions.map(suggestion => {
            const priorityColors = {
                'HIGH': { bg: '#fee', border: '#e74c3c', icon: '🚨' },
                'MEDIUM': { bg: '#fef3e0', border: '#f39c12', icon: '⚠️' },
                'LOW': { bg: '#e8f5e9', border: '#27ae60', icon: '💡' }
            };
            const style = priorityColors[suggestion.priority] || priorityColors['LOW'];

            return `
                <div style="background: ${style.bg}; border-left: 4px solid ${style.border}; padding: 12px; border-radius: 4px; margin-bottom: 10px;">
                    <div style="font-weight: bold; color: #2c3e50; margin-bottom: 5px;">
                        ${style.icon} ${suggestion.type}
                    </div>
                    <div style="color: #7f8c8d; font-size: 14px;">
                        ${suggestion.message}
                    </div>
                </div>
            `;
        }).join('');

        const riskHTML = rebalancing.risks.map(risk => {
            return `
                <div style="background: #fee; border-left: 4px solid #e74c3c; padding: 12px; border-radius: 4px; margin-bottom: 10px;">
                    <div style="font-weight: bold; color: #e74c3c; margin-bottom: 5px;">
                        ⚠️ ${risk.type}
                    </div>
                    <div style="color: #7f8c8d; font-size: 14px;">
                        ${risk.message}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px;">💡 포트폴리오 조정 제안</h2>

                ${riskHTML ? `
                    <div style="margin-top: 20px;">
                        <h3 style="color: #e74c3c; font-size: 16px; margin-bottom: 10px;">⚠️ 리스크</h3>
                        ${riskHTML}
                    </div>
                ` : ''}

                ${suggestionHTML ? `
                    <div style="margin-top: 20px;">
                        <h3 style="color: #2c3e50; font-size: 16px; margin-bottom: 10px;">✅ 추천 액션</h3>
                        ${suggestionHTML}
                    </div>
                ` : ''}
            </div>
        `;
    }

    // 시장 개요 HTML
    generateMarketOverviewHTML(marketOverview) {
        if (!marketOverview) return '';

        const trendColor = marketOverview.marketTrend === 'Bullish' ? '#27ae60' : '#e74c3c';
        const trendIcon = marketOverview.marketTrend === 'Bullish' ? '🟢' : '🔴';

        return `
            <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px;">📈 NASDAQ-100 시장 개요</h2>

                <div style="text-align: center; padding: 20px; background: ${trendColor}15; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0; color: ${trendColor}; font-size: 24px;">
                        시장 트렌드: ${marketOverview.marketTrend} ${trendIcon}
                    </h3>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h3 style="color: #27ae60; font-size: 16px; margin-bottom: 10px;">📈 Top 5 Gainers</h3>
                        ${marketOverview.topGainers.slice(0, 5).map(stock => `
                            <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #ecf0f1;">
                                <span style="font-weight: bold;">${stock.symbol}</span>
                                <span style="color: #27ae60;">+${stock.changePercent.toFixed(2)}%</span>
                            </div>
                        `).join('')}
                    </div>

                    <div>
                        <h3 style="color: #e74c3c; font-size: 16px; margin-bottom: 10px;">📉 Top 5 Losers</h3>
                        ${marketOverview.topLosers.slice(0, 5).map(stock => `
                            <div style="display: flex; justify-content: space-between; padding: 8px; border-bottom: 1px solid #ecf0f1;">
                                <span style="font-weight: bold;">${stock.symbol}</span>
                                <span style="color: #e74c3c;">${stock.changePercent.toFixed(2)}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // 액션 아이템 HTML
    generateActionItemsHTML(actionItems) {
        if (!actionItems || actionItems.length === 0) {
            return '';
        }

        const priorityIcons = {
            'HIGH': '🔥',
            'MEDIUM': '⚡',
            'LOW': '💡'
        };

        const itemHTML = actionItems.map(item => {
            const icon = priorityIcons[item.priority] || '📌';
            return `
                <li style="padding: 10px; border-left: 3px solid #667eea; margin-bottom: 10px; background: #f8f9fa; border-radius: 4px;">
                    <div style="font-weight: bold; color: #2c3e50; margin-bottom: 5px;">
                        ${icon} ${item.action}
                    </div>
                    <div style="font-size: 13px; color: #7f8c8d;">
                        ${item.reason}
                    </div>
                </li>
            `;
        }).join('');

        return `
            <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 20px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #ecf0f1; padding-bottom: 10px;">📋 오늘의 액션 아이템</h2>
                <ul style="list-style: none; padding: 0; margin-top: 20px;">
                    ${itemHTML}
                </ul>
            </div>
        `;
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