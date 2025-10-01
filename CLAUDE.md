# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NASDAQ-100 stock analysis MCP (Model Context Protocol) server that provides real-time stock data, technical analysis, and AI-powered recommendations. The server integrates with Yahoo Finance and exposes tools for stock price queries, technical indicators, portfolio optimization, and market insights.

## Architecture

### Core Components

- **MCP Server** (`mcp-server/index.js`): Main entry point that defines the MCP server with stdio transport. Registers tool handlers and routes requests to appropriate modules.

- **Stock Tools** (`mcp-server/stock-tools.js`): Core data fetching module using `yahoo-finance2`. Implements:
  - Real-time price queries (single and batch)
  - Historical data retrieval with configurable periods
  - Technical indicator calculations (MA20, MA50, RSI)
  - NASDAQ-100 market overview with gainers/losers
  - Financial metrics and valuation analysis

- **AI Scoring Engine** (`mcp-server/ai-scoring-engine.js`): Analyzes stocks using technical indicators, momentum, and valuation metrics to generate recommendation scores.

- **Portfolio Optimizer** (`mcp-server/portfolio-optimizer.js`): Provides portfolio allocation recommendations based on budget and risk profile.

- **Alert System** (`mcp-server/alert-system.js`): Monitors stocks for price movements, volume spikes, and technical indicator thresholds.

- **Backtesting** (`mcp-server/backtesting.js`): Historical strategy simulation framework.

### Data Flow

1. MCP client sends tool request via stdio
2. Server validates request and routes to appropriate handler
3. Handler uses `stockTools` to fetch Yahoo Finance data
4. Technical calculations performed on raw data
5. Results formatted as JSON and returned to client

### NASDAQ-100 Symbol List

The project maintains a static list of NASDAQ-100 symbols in `data/nasdaq100.json` (~106 symbols including AAPL, MSFT, NVDA, AMZN, etc.). The list is used for batch operations and market overview queries.

## Development Commands

### Running the Server

```bash
# Start MCP server (stdio mode for Claude integration)
cd mcp-server
npm start

# Test server functionality
npm test
```

### Testing Specific Features

```bash
# Test NASDAQ-100 batch queries
node scripts/test-nasdaq100.js

# Full NASDAQ-100 analysis
node scripts/nasdaq100-full-test.js

# Test technical indicators
node scripts/test-technical-indicators.js
```

### MCP Integration

The server is configured for Gemini/Claude via `.gemini/settings.json`:
- Server name: `nasdaq-stock-server`
- Command: Uses system Node.js installation
- Transport: stdio

## Available MCP Tools

1. **get_stock_price** - Single stock real-time quote
2. **get_multiple_stocks** - Batch stock queries
3. **get_historical_data** - Historical OHLCV data (periods: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y)
4. **get_technical_indicators** - MA20, MA50, RSI, volume analysis, buy/sell signals
5. **get_nasdaq100_overview** - Market trend with top gainers/losers
6. **get_financial_info** - PE ratio, forward PE, PEG, price-to-book, analyst recommendations

## Technical Implementation Notes

### Yahoo Finance Integration

- All data sourced from `yahoo-finance2` npm package
- Uses `quote()` for real-time data and `chart()` for historical data
- Historical queries support both `period` (relative like '1mo') and `period1/period2` (absolute dates)
- Graceful error handling for invalid symbols or network issues

### Technical Indicators

- **Moving Averages**: Calculated over last N periods using simple average
- **RSI**: 14-period default, tracks gains/losses ratio
- **Signal Generation**: Combines price/MA crossovers with RSI extremes to generate BUY/SELL/NEUTRAL signals with reasoning

### Signal Logic

- **BUY**: Price > MA20 > MA50 (golden cross) or RSI < 30 (oversold)
- **SELL**: Price < MA20 < MA50 (death cross) or RSI > 70 (overbought)
- **NEUTRAL**: Mixed or neutral conditions

## Module Dependencies

- `@modelcontextprotocol/sdk`: MCP server framework
- `yahoo-finance2`: Financial data source
- `express`: Web server (for optional HTTP interface)
- `axios`: HTTP client (for enhanced data sources)
- `dotenv`: Environment configuration support

## File Organization

```
mcp-server/
├── index.js                    # MCP server entry point
├── stock-tools.js              # Core stock data fetching
├── ai-scoring-engine.js        # AI recommendation engine
├── portfolio-optimizer.js      # Portfolio allocation
├── alert-system.js             # Price/volume monitoring
├── backtesting.js              # Strategy backtesting
├── enhanced-tools.js           # Advanced analysis tools
├── enhanced-data-sources.js    # Additional data integrations
├── personalization.js          # User preference management
├── test-server.js              # Basic functionality tests
└── web-server.js               # Optional HTTP interface

data/
└── nasdaq100.json              # NASDAQ-100 symbol list

scripts/
├── test-nasdaq100.js           # NASDAQ-100 batch test
├── nasdaq100-full-test.js      # Full analysis test
└── test-technical-indicators.js # Technical indicator test
```
