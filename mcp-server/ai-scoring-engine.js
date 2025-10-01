// mcp-server/ai-scoring-engine.js
export class AIScoreEngine {
    constructor() {
        this.weights = {
            technical: 0.25,
            fundamental: 0.25,
            sentiment: 0.20,
            momentum: 0.15,
            risk: 0.15
        };
    }
    
    async calculateAIScore(symbol) {
        const scores = {};
        
        // 기술적 점수 (0-100)
        scores.technical = await this.getTechnicalScore(symbol);
        
        // 펀더멘털 점수
        scores.fundamental = await this.getFundamentalScore(symbol);
        
        // 감성 점수
        scores.sentiment = await this.getSentimentScore(symbol);
        
        // 모멘텀 점수
        scores.momentum = await this.getMomentumScore(symbol);
        
        // 리스크 점수
        scores.risk = await this.getRiskScore(symbol);
        
        // 가중 평균 계산
        const totalScore = Object.keys(scores).reduce((sum, key) => {
            return sum + (scores[key] * this.weights[key]);
        }, 0);
        
        return {
            totalScore,
            breakdown: scores,
            recommendation: this.getRecommendation(totalScore),
            confidence: this.getConfidenceLevel(scores)
        };
    }
    
    async getTechnicalScore(symbol) {
        // RSI, MACD, 이동평균, 볼린저 밴드 등 종합
        const indicators = await stockTools.getTechnicalIndicators(symbol);
        let score = 50;
        
        // RSI 기반 점수
        if (indicators.rsi < 30) score += 20;
        else if (indicators.rsi > 70) score -= 20;
        
        // MA 크로스 확인
        if (indicators.ma20 > indicators.ma50) score += 15;
        
        // 볼륨 분석
        if (indicators.volumeRatio > 1.5) score += 10;
        
        return Math.min(100, Math.max(0, score));
    }
    
    async getFundamentalScore(symbol) {
        const financial = await stockTools.getFinancialInfo(symbol);
        let score = 50;
        
        // P/E 비율 평가
        const pe = financial.keyStatistics.peRatio;
        if (pe && pe < 15) score += 20;
        else if (pe && pe > 35) score -= 20;
        
        // PEG 비율
        const peg = financial.keyStatistics.pegRatio;
        if (peg && peg < 1) score += 15;
        
        // 수익성
        const margin = financial.keyStatistics.profitMargins;
        if (margin && margin > 0.15) score += 15;
        
        return Math.min(100, Math.max(0, score));
    }
    
    getRecommendation(score) {
        if (score >= 80) return { action: 'STRONG_BUY', emoji: '🚀' };
        if (score >= 65) return { action: 'BUY', emoji: '📈' };
        if (score >= 35) return { action: 'HOLD', emoji: '⏸️' };
        if (score >= 20) return { action: 'SELL', emoji: '📉' };
        return { action: 'STRONG_SELL', emoji: '⚠️' };
    }
    
    getConfidenceLevel(scores) {
        // 점수들의 일관성 확인
        const values = Object.values(scores);
        const avg = values.reduce((a, b) => a + b) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        
        if (variance < 100) return 'HIGH';
        if (variance < 300) return 'MEDIUM';
        return 'LOW';
    }
}