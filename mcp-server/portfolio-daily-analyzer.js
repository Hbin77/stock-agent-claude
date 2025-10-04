// mcp-server/portfolio-daily-analyzer.js
import yahooFinance from 'yahoo-finance2';

export class PortfolioDailyAnalyzer {
    constructor(portfolioTracker, stockTools, aiScoreEngine) {
        this.tracker = portfolioTracker;
        this.stockTools = stockTools;
        this.aiEngine = aiScoreEngine;
    }

    /**
     * 종합 일일 리포트 생성
     */
    async generateDailyReport() {
        console.error('\n📊 Generating daily portfolio report...');

        // 1. 포트폴리오 로드
        await this.tracker.loadPortfolio();

        // 2. 포트폴리오 현황 분석
        const portfolioSummary = await this.analyzePortfolio();

        // 3. AI 점수 기반 추천
        const recommendations = await this.generateRecommendations();

        // 4. 리밸런싱 제안
        const rebalancing = await this.generateRebalancingSuggestions(portfolioSummary);

        // 5. 시장 개요
        const marketOverview = await this.stockTools.getNasdaq100Overview();

        // 6. TOP 5 추천 종목
        const topPicks = await this.getTopRecommendedStocks();

        return {
            date: new Date().toISOString(),
            portfolio: portfolioSummary,
            recommendations: recommendations,
            rebalancing: rebalancing,
            topPicks: topPicks,
            marketOverview: marketOverview,
            actionItems: this.generateActionItems(portfolioSummary, recommendations, rebalancing)
        };
    }

    /**
     * 포트폴리오 상세 분석
     */
    async analyzePortfolio() {
        const summary = await this.tracker.getPortfolioSummary(this.stockTools);

        if (summary.stocks.length === 0) {
            return {
                isEmpty: true,
                message: 'Portfolio is empty',
                totalInvested: 0,
                totalCurrentValue: 0,
                totalProfit: 0,
                totalProfitPercent: 0,
                stocks: []
            };
        }

        // 각 종목에 AI 점수 추가
        const enrichedStocks = [];
        for (const stock of summary.stocks) {
            try {
                const aiScore = await this.calculateStockAIScore(stock.symbol);
                const technicalIndicators = await this.stockTools.getTechnicalIndicators(stock.symbol);

                enrichedStocks.push({
                    ...stock,
                    aiScore: aiScore.totalScore,
                    aiRecommendation: aiScore.recommendation,
                    technicalSignal: technicalIndicators.signal,
                    rsi: technicalIndicators.rsi,
                    ma20: technicalIndicators.ma20,
                    ma50: technicalIndicators.ma50
                });
            } catch (error) {
                console.error(`Error enriching ${stock.symbol}:`, error.message);
                enrichedStocks.push({
                    ...stock,
                    aiScore: null,
                    aiRecommendation: { action: 'UNKNOWN', emoji: '❓' }
                });
            }
        }

        // 섹터 분석
        const sectorAnalysis = await this.analyzeSectorDistribution(enrichedStocks);

        return {
            isEmpty: false,
            totalInvested: summary.totalInvested,
            totalCurrentValue: summary.totalCurrentValue,
            totalProfit: summary.totalProfit,
            totalProfitPercent: summary.totalProfitPercent,
            stocks: enrichedStocks,
            sectorAnalysis: sectorAnalysis,
            performanceSummary: this.getPerformanceSummary(enrichedStocks)
        };
    }

    /**
     * 종목별 AI 점수 계산
     */
    async calculateStockAIScore(symbol) {
        try {
            const technical = await this.stockTools.getTechnicalIndicators(symbol);
            const financial = await this.stockTools.getFinancialInfo(symbol);

            let score = 50; // 기본 점수

            // 기술적 분석 (40점 배점)
            if (technical.signal.action === 'BUY') score += 20;
            else if (technical.signal.action === 'SELL') score -= 20;

            if (technical.rsi < 30) score += 10; // 과매도
            else if (technical.rsi > 70) score -= 10; // 과매수

            if (technical.price > technical.ma20 && technical.ma20 > technical.ma50) {
                score += 10; // 골든 크로스
            } else if (technical.price < technical.ma20 && technical.ma20 < technical.ma50) {
                score -= 10; // 데드 크로스
            }

            // 펀더멘털 분석 (20점 배점)
            if (financial.peRatio && financial.peRatio < 15) score += 10;
            else if (financial.peRatio && financial.peRatio > 40) score -= 10;

            if (financial.forwardPE && financial.forwardPE < financial.peRatio) {
                score += 10; // 성장 기대
            }

            // 모멘텀 분석 (20점 배점)
            const currentPrice = technical.price;
            const ma20 = technical.ma20;
            const priceVsMa20 = ((currentPrice - ma20) / ma20) * 100;

            if (priceVsMa20 > 5) score += 10; // 강한 상승세
            else if (priceVsMa20 < -5) score -= 10; // 강한 하락세

            score = Math.min(100, Math.max(0, score));

            return {
                totalScore: Math.round(score),
                recommendation: this.getRecommendation(score),
                breakdown: {
                    technical: technical.signal.action,
                    rsi: technical.rsi,
                    trend: priceVsMa20 > 0 ? 'Bullish' : 'Bearish'
                }
            };
        } catch (error) {
            console.error(`Error calculating AI score for ${symbol}:`, error.message);
            return {
                totalScore: 50,
                recommendation: { action: 'HOLD', emoji: '⏸️' },
                breakdown: {}
            };
        }
    }

    /**
     * 추천 액션 (매수/매도/보유) 결정
     */
    getRecommendation(score) {
        if (score >= 75) return { action: 'STRONG_BUY', emoji: '🚀', color: '#27ae60' };
        if (score >= 60) return { action: 'BUY', emoji: '📈', color: '#2ecc71' };
        if (score >= 40) return { action: 'HOLD', emoji: '⏸️', color: '#95a5a6' };
        if (score >= 25) return { action: 'SELL', emoji: '📉', color: '#e67e22' };
        return { action: 'STRONG_SELL', emoji: '⚠️', color: '#e74c3c' };
    }

    /**
     * 보유 종목 기반 추천 생성
     */
    async generateRecommendations() {
        const portfolio = await this.tracker.getPortfolio();
        const recommendations = [];

        for (const holding of portfolio) {
            try {
                const aiScore = await this.calculateStockAIScore(holding.symbol);
                const technical = await this.stockTools.getTechnicalIndicators(holding.symbol);

                recommendations.push({
                    symbol: holding.symbol,
                    action: aiScore.recommendation.action,
                    aiScore: aiScore.totalScore,
                    reasoning: this.generateReasoning(aiScore, technical),
                    urgency: this.getUrgency(aiScore.totalScore, technical)
                });
            } catch (error) {
                console.error(`Error generating recommendation for ${holding.symbol}:`, error.message);
            }
        }

        return recommendations.sort((a, b) => b.aiScore - a.aiScore);
    }

    /**
     * 추천 이유 생성
     */
    generateReasoning(aiScore, technical) {
        const reasons = [];

        if (technical.signal.action === 'BUY') {
            reasons.push(technical.signal.reasoning);
        } else if (technical.signal.action === 'SELL') {
            reasons.push(technical.signal.reasoning);
        }

        if (technical.rsi < 30) reasons.push('RSI oversold condition');
        if (technical.rsi > 70) reasons.push('RSI overbought condition');

        if (technical.price > technical.ma20 && technical.ma20 > technical.ma50) {
            reasons.push('Strong uptrend (Golden Cross)');
        }

        return reasons.join('; ') || 'Neutral technical indicators';
    }

    /**
     * 긴급도 판단
     */
    getUrgency(score, technical) {
        if (score >= 80 || score <= 20) return 'HIGH';
        if (Math.abs(technical.rsi - 50) > 20) return 'MEDIUM';
        return 'LOW';
    }

    /**
     * 리밸런싱 제안
     */
    async generateRebalancingSuggestions(portfolioSummary) {
        if (portfolioSummary.isEmpty) {
            return {
                needed: false,
                suggestions: [],
                risks: []
            };
        }

        const suggestions = [];
        const risks = [];

        // 1. 손실 종목 검토
        const losingStocks = portfolioSummary.stocks.filter(s => s.profitPercent < -10);
        if (losingStocks.length > 0) {
            suggestions.push({
                type: 'REVIEW_LOSSES',
                message: `${losingStocks.length} stock(s) down >10%. Consider reviewing: ${losingStocks.map(s => s.symbol).join(', ')}`,
                priority: 'HIGH'
            });
        }

        // 2. 고수익 종목 이익 실현 검토
        const highProfitStocks = portfolioSummary.stocks.filter(s => s.profitPercent > 20);
        if (highProfitStocks.length > 0) {
            suggestions.push({
                type: 'TAKE_PROFIT',
                message: `${highProfitStocks.length} stock(s) up >20%. Consider taking profits: ${highProfitStocks.map(s => s.symbol).join(', ')}`,
                priority: 'MEDIUM'
            });
        }

        // 3. 섹터 집중 리스크
        const sectorConcentration = this.checkSectorConcentration(portfolioSummary.sectorAnalysis);
        if (sectorConcentration.isConcentrated) {
            risks.push({
                type: 'SECTOR_CONCENTRATION',
                message: `${sectorConcentration.sector} sector represents ${sectorConcentration.percentage.toFixed(1)}% of portfolio`,
                severity: 'HIGH'
            });
            suggestions.push({
                type: 'DIVERSIFY',
                message: 'Consider diversifying into other sectors',
                priority: 'MEDIUM'
            });
        }

        // 4. 포트폴리오 크기 검토
        if (portfolioSummary.stocks.length < 5) {
            suggestions.push({
                type: 'INCREASE_DIVERSIFICATION',
                message: 'Portfolio has fewer than 5 stocks. Consider adding more positions for diversification',
                priority: 'LOW'
            });
        }

        // 5. 현금 비중 제안
        const cashRecommendation = this.recommendCashPosition(portfolioSummary);
        if (cashRecommendation) {
            suggestions.push(cashRecommendation);
        }

        return {
            needed: suggestions.length > 0,
            suggestions: suggestions,
            risks: risks
        };
    }

    /**
     * 섹터 분석
     */
    async analyzeSectorDistribution(stocks) {
        const sectorMap = {};
        let totalValue = 0;

        for (const stock of stocks) {
            try {
                const quote = await yahooFinance.quote(stock.symbol);
                const sector = quote.sector || 'Unknown';

                if (!sectorMap[sector]) {
                    sectorMap[sector] = { value: 0, count: 0, stocks: [] };
                }

                sectorMap[sector].value += stock.currentValue;
                sectorMap[sector].count += 1;
                sectorMap[sector].stocks.push(stock.symbol);
                totalValue += stock.currentValue;
            } catch (error) {
                console.error(`Error getting sector for ${stock.symbol}:`, error.message);
            }
        }

        const sectorBreakdown = Object.entries(sectorMap).map(([sector, data]) => ({
            sector: sector,
            value: data.value,
            percentage: (data.value / totalValue) * 100,
            count: data.count,
            stocks: data.stocks
        })).sort((a, b) => b.value - a.value);

        return sectorBreakdown;
    }

    /**
     * 섹터 집중도 확인
     */
    checkSectorConcentration(sectorAnalysis) {
        if (!sectorAnalysis || sectorAnalysis.length === 0) {
            return { isConcentrated: false };
        }

        const topSector = sectorAnalysis[0];
        if (topSector.percentage > 50) {
            return {
                isConcentrated: true,
                sector: topSector.sector,
                percentage: topSector.percentage
            };
        }

        return { isConcentrated: false };
    }

    /**
     * 현금 비중 제안
     */
    recommendCashPosition(portfolioSummary) {
        const totalProfitPercent = portfolioSummary.totalProfitPercent;

        // 시장이 과열되었거나 포트폴리오가 큰 수익 중이면 현금 확보 권장
        if (totalProfitPercent > 15) {
            return {
                type: 'INCREASE_CASH',
                message: 'Consider taking some profits and increasing cash position (recommended: 15-20%)',
                priority: 'MEDIUM'
            };
        }

        // 손실 중이면 분산 매수 기회
        if (totalProfitPercent < -10) {
            return {
                type: 'AVERAGING_DOWN',
                message: 'Market pullback - consider averaging down on high-conviction stocks',
                priority: 'LOW'
            };
        }

        return null;
    }

    /**
     * 성과 요약
     */
    getPerformanceSummary(stocks) {
        const winners = stocks.filter(s => s.profitPercent > 0).length;
        const losers = stocks.filter(s => s.profitPercent < 0).length;
        const bestPerformer = stocks.reduce((max, s) => s.profitPercent > max.profitPercent ? s : max, stocks[0]);
        const worstPerformer = stocks.reduce((min, s) => s.profitPercent < min.profitPercent ? s : min, stocks[0]);

        return {
            winners: winners,
            losers: losers,
            winRate: (winners / stocks.length) * 100,
            bestPerformer: bestPerformer ? {
                symbol: bestPerformer.symbol,
                profitPercent: bestPerformer.profitPercent
            } : null,
            worstPerformer: worstPerformer ? {
                symbol: worstPerformer.symbol,
                profitPercent: worstPerformer.profitPercent
            } : null
        };
    }

    /**
     * NASDAQ-100에서 TOP 5 추천 종목 선정
     */
    async getTopRecommendedStocks() {
        console.error('🔍 Analyzing top NASDAQ-100 stocks...');

        try {
            const overview = await this.stockTools.getNasdaq100Overview();
            const topGainers = overview.topGainers.slice(0, 10); // 상위 10개 검토

            const scoredStocks = [];

            for (const stock of topGainers) {
                try {
                    const aiScore = await this.calculateStockAIScore(stock.symbol);
                    scoredStocks.push({
                        ...stock,
                        aiScore: aiScore.totalScore,
                        recommendation: aiScore.recommendation
                    });
                } catch (error) {
                    console.error(`Error scoring ${stock.symbol}:`, error.message);
                }
            }

            // AI 점수 기준 정렬하여 상위 5개 선정
            return scoredStocks
                .sort((a, b) => b.aiScore - a.aiScore)
                .slice(0, 5);

        } catch (error) {
            console.error('Error getting top picks:', error.message);
            return [];
        }
    }

    /**
     * 액션 아이템 생성
     */
    generateActionItems(portfolioSummary, recommendations, rebalancing) {
        const actions = [];

        // 1. 긴급 매수/매도 추천
        const urgentActions = recommendations.filter(r => r.urgency === 'HIGH');
        if (urgentActions.length > 0) {
            urgentActions.forEach(action => {
                actions.push({
                    priority: 'HIGH',
                    action: `${action.action}: ${action.symbol}`,
                    reason: action.reasoning
                });
            });
        }

        // 2. 리밸런싱 제안
        const highPriorityRebalancing = rebalancing.suggestions.filter(s => s.priority === 'HIGH');
        highPriorityRebalancing.forEach(suggestion => {
            actions.push({
                priority: 'HIGH',
                action: suggestion.message,
                reason: suggestion.type
            });
        });

        // 3. 일반 추천
        const buyRecommendations = recommendations.filter(r => r.action.includes('BUY') && r.urgency !== 'HIGH');
        if (buyRecommendations.length > 0) {
            actions.push({
                priority: 'MEDIUM',
                action: `Consider buying: ${buyRecommendations.map(r => r.symbol).join(', ')}`,
                reason: 'Strong AI scores'
            });
        }

        return actions.slice(0, 5); // 최대 5개만
    }
}
