// 포트폴리오 일일 리포트 테스트
import dotenv from 'dotenv';
import { PortfolioTracker } from './portfolio-tracker.js';
import { stockTools } from './stock-tools.js';
import { EmailNotifier } from './email-notifier.js';
import { PortfolioDailyAnalyzer } from './portfolio-daily-analyzer.js';
import { AIScoreEngine } from './ai-scoring-engine.js';

dotenv.config({ quiet: true });

console.log('🧪 Testing Portfolio Daily Report System\n');

// 시스템 초기화
const portfolioTracker = new PortfolioTracker();
const emailNotifier = new EmailNotifier();
const aiScoreEngine = new AIScoreEngine();
const portfolioAnalyzer = new PortfolioDailyAnalyzer(portfolioTracker, stockTools, aiScoreEngine);
const recipientEmail = process.env.NOTIFICATION_EMAIL;

console.log('✅ Environment Configuration:');
console.log('  EMAIL_USER:', process.env.EMAIL_USER);
console.log('  NOTIFICATION_EMAIL:', recipientEmail);
console.log('  EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '***configured***' : 'NOT SET');
console.log();

async function testReport() {
    try {
        console.log('📊 Step 1: Loading portfolio...');
        await portfolioTracker.loadPortfolio();
        const portfolio = await portfolioTracker.getPortfolio();
        console.log(`   Found ${portfolio.length} stocks in portfolio`);

        if (portfolio.length === 0) {
            console.log('\n⚠️  Portfolio is empty! Adding sample stocks for testing...');
            await portfolioTracker.addStock('AVGO', 4, 838.37);
            await portfolioTracker.addStock('QCOM', 9, 165.4);
            console.log('   ✅ Sample stocks added');
        }
        console.log();

        console.log('📊 Step 2: Generating daily report...');
        const reportData = await portfolioAnalyzer.generateDailyReport();
        console.log('   ✅ Report generated successfully!');
        console.log();

        console.log('📊 Report Summary:');
        console.log('  Portfolio:');
        console.log('    - Total Invested: $' + (reportData.portfolio.totalInvested || 0).toFixed(2));
        console.log('    - Current Value: $' + (reportData.portfolio.totalCurrentValue || 0).toFixed(2));
        console.log('    - Total Profit: $' + (reportData.portfolio.totalProfit || 0).toFixed(2));
        console.log('    - Profit %: ' + (reportData.portfolio.totalProfitPercent || 0).toFixed(2) + '%');
        console.log('    - Stocks: ' + (reportData.portfolio.stocks?.length || 0));
        console.log('  Recommendations: ' + (reportData.recommendations?.length || 0));
        console.log('  Top Picks: ' + (reportData.topPicks?.length || 0));
        console.log('  Rebalancing Suggestions: ' + (reportData.rebalancing?.suggestions?.length || 0));
        console.log('  Action Items: ' + (reportData.actionItems?.length || 0));
        console.log();

        console.log('📧 Step 3: Sending email report...');
        const emailSent = await emailNotifier.sendDailyPortfolioReport(reportData, recipientEmail);

        if (emailSent) {
            console.log(`   ✅ Email sent successfully to ${recipientEmail}!`);
            console.log('\n🎉 Test completed successfully!');
            console.log('\n📬 Check your email inbox for the daily report.');
        } else {
            console.log('   ❌ Email failed to send');
        }

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

testReport();
