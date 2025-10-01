// web-server.js

import express from 'express';
import cors from 'cors';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const app = express();
const port = 3000;

app.use(cors());

// MCP 클라이언트 설정
const transport = new StdioClientTransport({
  command: ['node', 'mcp-server/index.js'],
});

const client = new Client({
  transport,
});

// `/api/stock/:symbol` 엔드포인트: 주식 정보를 가져오는 API
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const result = await client.request(CallToolRequestSchema, {
      toolName: 'get_stock_price',
      args: { symbol },
    });

    if (result.isError) {
      throw new Error(result.content[0].text);
    }
    
    // MCP 서버의 결과는 JSON 문자열이므로 다시 파싱합니다.
    const stockData = JSON.parse(result.content[0].text);
    res.json(stockData);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Web server listening at http://localhost:${port}`);
}); 