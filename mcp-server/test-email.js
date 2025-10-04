// 이메일 기능 테스트
import dotenv from 'dotenv';
import { EmailNotifier } from './email-notifier.js';

dotenv.config({ quiet: true });

const emailNotifier = new EmailNotifier();
const recipientEmail = process.env.NOTIFICATION_EMAIL;

console.log('Testing email configuration...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('NOTIFICATION_EMAIL:', recipientEmail);
console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '***configured***' : 'NOT SET');

// 테스트 데이터
const testStockData = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 175.50,
    change: 2.30,
    changePercent: 1.33,
    volume: 50000000,
    marketCap: 2800000000000,
    dayLow: 173.20,
    dayHigh: 176.00,
    timestamp: Date.now()
};

console.log('\nSending test email...');
emailNotifier.sendPriceAlert(testStockData, recipientEmail)
    .then(() => {
        console.log('✅ Test email sent successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Email test failed:', error);
        process.exit(1);
    });
