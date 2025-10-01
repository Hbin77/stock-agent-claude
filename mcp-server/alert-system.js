// mcp-server/alert-system.js
export class AlertSystem {
    constructor() {
        this.alerts = new Map();
    }
    
    async monitorStock(symbol, criteria) {
        const alerts = [];
        const current = await stockTools.getStockPrice(symbol);
        const aiScore = await new AIScoreEngine().calculateAIScore(symbol);
        
        // AI 점수 기반 알림
        if (aiScore.totalScore >= 75 && aiScore.recommendation.action === 'STRONG_BUY') {
            alerts.push({
                type: 'AI_SIGNAL',
                message: `🚀 Strong Buy Signal for ${symbol}! AI Score: ${aiScore.totalScore}`,
                urgency: 'high'
            });
        }
        
        // 가격 돌파 알림
        if (criteria.breakoutPrice && current.price > criteria.breakoutPrice) {
            alerts.push({
                type: 'PRICE_BREAKOUT',
                message: `📈 ${symbol} broke resistance at $${criteria.breakoutPrice}`,
                urgency: 'medium'
            });
        }
        
        // 볼륨 급증 알림
        const avgVolume = current.volume / 20; // 20일 평균으로 가정
        if (current.volume > avgVolume * 2) {
            alerts.push({
                type: 'VOLUME_SPIKE',
                message: `💹 Unusual volume detected for ${symbol}`,
                urgency: 'medium'
            });
        }
        
        return alerts;
    }
}