// mcp-server/portfolio-optimizer.js
export class PortfolioOptimizer {
    async recommendPortfolio(budget, riskTolerance = 'moderate') {
        const candidates = await this.getTopCandidates();
        
        // 리스크 프로필별 배분
        const allocation = this.getAllocation(riskTolerance);
        
        const portfolio = {
            stocks: [],
            totalValue: 0,
            expectedReturn: 0,
            riskScore: 0
        };
        
        // 섹터 다각화
        const sectorAllocation = {
            'Technology': allocation.tech,
            'Healthcare': allocation.health,
            'Consumer': allocation.consumer,
            'Financial': allocation.financial
        };
        
        for (const [sector, weight] of Object.entries(sectorAllocation)) {
            const sectorStocks = await this.getBestInSector(sector, candidates);
            const investmentAmount = budget * weight;
            
            for (const stock of sectorStocks) {
                const aiScore = await new AIScoreEngine().calculateAIScore(stock.symbol);
                
                if (aiScore.totalScore >= 60) {
                    const shares = Math.floor(investmentAmount / stock.price / sectorStocks.length);
                    
                    portfolio.stocks.push({
                        symbol: stock.symbol,
                        shares,
                        value: shares * stock.price,
                        aiScore: aiScore.totalScore,
                        sector,
                        recommendation: aiScore.recommendation
                    });
                }
            }
        }
        
        return portfolio;
    }
    
    getAllocation(riskTolerance) {
        const allocations = {
            'conservative': {
                tech: 0.2,
                health: 0.3,
                consumer: 0.3,
                financial: 0.2
            },
            'moderate': {
                tech: 0.35,
                health: 0.25,
                consumer: 0.25,
                financial: 0.15
            },
            'aggressive': {
                tech: 0.5,
                health: 0.2,
                consumer: 0.2,
                financial: 0.1
            }
        };
        
        return allocations[riskTolerance] || allocations['moderate'];
    }
}