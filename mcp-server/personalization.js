// mcp-server/personalization.js
export class PersonalizedRecommender {
    async getPersonalizedRecommendations(userProfile) {
        const {
            investmentGoal, // 'growth', 'income', 'balanced'
            riskTolerance,  // 'low', 'medium', 'high'
            timeHorizon,    // 'short', 'medium', 'long'
            preferredSectors
        } = userProfile;
        
        const recommendations = [];
        
        // 목표별 필터링
        const candidateStocks = await this.filterByGoal(investmentGoal);
        
        for (const stock of candidateStocks) {
            const aiScore = await new AIScoreEngine().calculateAIScore(stock.symbol);
            const riskScore = await this.calculateRiskScore(stock);
            
            // 사용자 프로필과 매칭
            if (this.matchesProfile(aiScore, riskScore, userProfile)) {
                recommendations.push({
                    ...stock,
                    matchScore: this.calculateMatchScore(stock, userProfile),
                    reasoning: this.getRecommendationReasoning(stock, userProfile)
                });
            }
        }
        
        return recommendations.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
    }
}