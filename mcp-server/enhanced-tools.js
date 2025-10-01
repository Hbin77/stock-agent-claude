// mcp-server/enhanced-tools.js
export const enhancedTools = {
    // AI 추천
    async getAIRecommendation(symbol) {
        const engine = new AIScoreEngine();
        const score = await engine.calculateAIScore(symbol);
        const alerts = await new AlertSystem().monitorStock(symbol, {});
        
        return {
            symbol,
            aiScore: score,
            alerts,
            timestamp: new Date().toISOString()
        };
    },
    
    // 포트폴리오 추천
    async getPortfolioRecommendation(budget, riskProfile) {
        const optimizer = new PortfolioOptimizer();
        return await optimizer.recommendPortfolio(budget, riskProfile);
    },
    
    // 시장 인사이트
    async getMarketInsights() {
        const topStocks = [];
        
        for (const symbol of NASDAQ_100_SYMBOLS.slice(0, 20)) {
            const aiScore = await new AIScoreEngine().calculateAIScore(symbol);
            if (aiScore.totalScore >= 70) {
                topStocks.push({
                    symbol,
                    score: aiScore.totalScore,
                    recommendation: aiScore.recommendation
                });
            }
        }
        
        return {
            topRecommendations: topStocks.sort((a, b) => b.score - a.score).slice(0, 5),
            marketSentiment: await this.getMarketSentiment(),
            sectorRotation: await this.getSectorRotation()
        };
    }
};