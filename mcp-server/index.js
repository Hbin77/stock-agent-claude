#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { stockTools } from './stock-tools.js';
import { EmailNotifier } from './email-notifier.js';
import { PortfolioTracker, PortfolioMonitor } from './portfolio-tracker.js';
import dotenv from 'dotenv';

dotenv.config();

// 이메일 알림 시스템 초기화
const emailNotifier = new EmailNotifier();
const recipientEmail = process.env.NOTIFICATION_EMAIL;

// 포트폴리오 시스템 초기화
const portfolioTracker = new PortfolioTracker();
const portfolioMonitor = new PortfolioMonitor(portfolioTracker, stockTools, emailNotifier);

// MCP 서버 생성
const server = new Server(
    {
        name: 'nasdaq-100-stock-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        }
    }
);

// 도구 목록 정의 (이메일 도구 추가)
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'get_stock_price',
            description: 'Get current stock price and basic info for a NASDAQ-100 symbol',
            inputSchema: {
                type: 'object',
                properties: {
                    symbol: { 
                        type: 'string', 
                        description: 'Stock symbol (e.g., AAPL, MSFT, NVDA)' 
                    }
                },
                required: ['symbol']
            }
        },
        {
            name: 'get_multiple_stocks',
            description: 'Get prices for multiple stocks at once',
            inputSchema: {
                type: 'object',
                properties: {
                    symbols: { 
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Array of stock symbols' 
                    }
                },
                required: ['symbols']
            }
        },
        {
            name: 'get_historical_data',
            description: 'Get historical price data for a stock',
            inputSchema: {
                type: 'object',
                properties: {
                    symbol: { type: 'string' },
                    period: { 
                        type: 'string',
                        enum: ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y'],
                        description: 'Time period for historical data'
                    }
                },
                required: ['symbol']
            }
        },
        {
            name: 'get_technical_indicators',
            description: 'Get technical indicators (MA, RSI) for a stock',
            inputSchema: {
                type: 'object',
                properties: {
                    symbol: { type: 'string' }
                },
                required: ['symbol']
            }
        },
        {
            name: 'get_nasdaq100_overview',
            description: 'Get NASDAQ-100 market overview with top gainers and losers',
            inputSchema: {
                type: 'object',
                properties: {}
            }
        },
        {
            name: 'get_financial_info',
            description: 'Get financial metrics and valuation for a stock',
            inputSchema: {
                type: 'object',
                properties: {
                    symbol: { type: 'string' }
                },
                required: ['symbol']
            }
        },
        // 🆕 이메일 도구들
        {
            name: 'send_stock_alert_email',
            description: 'Send stock price alert via email to configured recipient',
            inputSchema: {
                type: 'object',
                properties: {
                    symbol: { 
                        type: 'string',
                        description: 'Stock symbol to get alert for'
                    }
                },
                required: ['symbol']
            }
        },
        {
            name: 'send_technical_alert_email',
            description: 'Send technical analysis alert via email',
            inputSchema: {
                type: 'object',
                properties: {
                    symbol: { type: 'string' }
                },
                required: ['symbol']
            }
        },
        {
            name: 'send_market_overview_email',
            description: 'Send NASDAQ-100 market overview via email',
            inputSchema: {
                type: 'object',
                properties: {}
            }
        },
        {
            name: 'schedule_daily_report',
            description: 'Schedule daily market report at specified hour (24-hour format, 0-23)',
            inputSchema: {
                type: 'object',
                properties: {
                    hour: { 
                        type: 'number',
                        description: 'Hour in 24-hour format (e.g., 20 for 8 PM)',
                        minimum: 0,
                        maximum: 23
                    }
                },
                required: ['hour']
            }
        },
        {
            name: 'monitor_stock_changes',
            description: 'Monitor stocks for significant price changes (5%+) and send email alerts automatically',
            inputSchema: {
                type: 'object',
                properties: {
                    symbols: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Array of stock symbols to monitor (e.g., ["AAPL", "MSFT", "NVDA"])'
                    },
                    threshold: {
                        type: 'number',
                        description: 'Price change threshold percentage (default: 5)',
                        default: 5
                    },
                    checkInterval: {
                        type: 'number',
                        description: 'Check interval in minutes (default: 5)',
                        default: 5
                    }
                },
                required: ['symbols']
            }
        }
    ]
}));

// 도구 실행 핸들러 (이메일 기능 추가)
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
        let result;
        
        switch (name) {
            case 'get_stock_price':
                result = await stockTools.getStockPrice(args.symbol);
                break;
                
            case 'get_multiple_stocks':
                result = await stockTools.getMultipleStockPrices(args.symbols);
                break;
                
            case 'get_historical_data':
                result = await stockTools.getHistoricalData(args.symbol, args.period);
                break;
                
            case 'get_technical_indicators':
                result = await stockTools.getTechnicalIndicators(args.symbol);
                break;
                
            case 'get_nasdaq100_overview':
                result = await stockTools.getNasdaq100Overview();
                break;
                
            case 'get_financial_info':
                result = await stockTools.getFinancialInfo(args.symbol);
                break;
            
            // 🆕 이메일 도구 핸들러
            case 'send_stock_alert_email':
                const stockData = await stockTools.getStockPrice(args.symbol);
                await emailNotifier.sendPriceAlert(stockData, recipientEmail);
                result = { 
                    success: true, 
                    message: `Stock alert for ${args.symbol} sent to ${recipientEmail}`,
                    data: stockData
                };
                break;
                
            case 'send_technical_alert_email':
                const indicators = await stockTools.getTechnicalIndicators(args.symbol);
                await emailNotifier.sendTechnicalAlert(indicators, recipientEmail);
                result = { 
                    success: true, 
                    message: `Technical alert for ${args.symbol} sent to ${recipientEmail}`,
                    signal: indicators.signal.action
                };
                break;
                
            case 'send_market_overview_email':
                const overview = await stockTools.getNasdaq100Overview();
                await emailNotifier.sendMarketOverview(overview, recipientEmail);
                result = { 
                    success: true, 
                    message: `Market overview sent to ${recipientEmail}`,
                    trend: overview.marketTrend
                };
                break;
                
            case 'schedule_daily_report':
                scheduleDailyReport(args.hour, recipientEmail);
                result = { 
                    success: true, 
                    message: `Daily report scheduled at ${args.hour}:00 (24-hour format) for ${recipientEmail}` 
                };
                break;
                
            case 'monitor_stock_changes':
                const threshold = args.threshold || 5;
                const interval = args.checkInterval || 5;
                monitorStockChanges(args.symbols, threshold, interval, recipientEmail);
                result = { 
                    success: true, 
                    message: `Now monitoring ${args.symbols.join(', ')} for ${threshold}%+ changes every ${interval} minutes`,
                    symbols: args.symbols,
                    threshold: threshold,
                    checkInterval: interval
                };
                break;
                
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }
            ]
        };
    } catch (error) {
        console.error(`Error in ${name}:`, error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${error.message}`
                }
            ],
            isError: true
        };
    }
});

// 📅 매일 리포트 스케줄러
function scheduleDailyReport(hour, email) {
    console.error(`📅 Daily report scheduled at ${hour}:00 for ${email}`);
    
    setInterval(async () => {
        const now = new Date();
        if (now.getHours() === hour && now.getMinutes() === 0) {
            console.error(`⏰ Sending daily report at ${hour}:00...`);
            try {
                const overview = await stockTools.getNasdaq100Overview();
                await emailNotifier.sendMarketOverview(overview, email);
                console.error('✅ Daily report sent!');
            } catch (error) {
                console.error('❌ Failed to send daily report:', error.message);
            }
        }
    }, 60000); // 매 1분마다 체크
}

// 🔔 실시간 주식 변동 모니터링
const monitoredStocks = new Map(); // 이전 가격 저장

function monitorStockChanges(symbols, threshold, checkIntervalMinutes, email) {
    console.error(`\n🔔 Starting real-time monitoring for ${symbols.join(', ')}`);
    console.error(`📊 Alert threshold: ${threshold}% change`);
    console.error(`⏱️  Check interval: ${checkIntervalMinutes} minutes\n`);
    
    // 초기 가격 저장
    symbols.forEach(async (symbol) => {
        try {
            const data = await stockTools.getStockPrice(symbol);
            monitoredStocks.set(symbol, {
                previousPrice: data.price,
                lastChecked: new Date()
            });
            console.error(`✓ ${symbol}: Initial price ${data.price.toFixed(2)}`);
        } catch (error) {
            console.error(`✗ ${symbol}: Failed to get initial price - ${error.message}`);
        }
    });
    
    // 주기적으로 체크
    setInterval(async () => {
        for (const symbol of symbols) {
            try {
                const currentData = await stockTools.getStockPrice(symbol);
                const stored = monitoredStocks.get(symbol);
                
                if (!stored) continue;
                
                const previousPrice = stored.previousPrice;
                const changePercent = Math.abs(currentData.changePercent);
                
                console.error(`[${new Date().toLocaleTimeString()}] ${symbol}: ${currentData.price.toFixed(2)} (${currentData.changePercent >= 0 ? '+' : ''}${currentData.changePercent.toFixed(2)}%)`);
                
                // 임계값 초과 시 이메일 발송
                if (changePercent >= threshold) {
                    console.error(`🚨 ALERT! ${symbol} changed ${changePercent.toFixed(2)}% - Sending email...`);
                    
                    await emailNotifier.sendPriceAlert(currentData, email);
                    
                    // 중복 알림 방지: 현재 가격을 새로운 기준점으로 업데이트
                    monitoredStocks.set(symbol, {
                        previousPrice: currentData.price,
                        lastChecked: new Date()
                    });
                    
                    console.error(`✅ Alert sent for ${symbol}!`);
                }
                
                // 너무 잦은 API 호출 방지
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Error monitoring ${symbol}: ${error.message}`);
            }
        }
    }, checkIntervalMinutes * 60 * 1000);
}

// 서버 시작
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('NASDAQ-100 Stock MCP Server running with Email Support...');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});