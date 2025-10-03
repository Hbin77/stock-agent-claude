#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { stockTools } from './stock-tools.js';

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

// 도구 목록 정의
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
        }
    ]
}));

// 도구 실행 핸들러
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

// 서버 시작
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('NASDAQ-100 Stock MCP Server running...');
}

main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});