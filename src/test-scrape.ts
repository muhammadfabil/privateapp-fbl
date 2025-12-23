/**
 * Test script to scrape a single stock with full data
 * Run with: npx tsx src/test-scrape.ts
 */
import { scrapeStockFull } from './scraper/stockScraper.js';
import { initializeDatabase } from './db/index.js';
import { closeBrowser } from './scraper/browser.js';

async function main() {
    console.log('Initializing database...');
    await initializeDatabase();

    console.log('\n--- Testing single stock scrape (TLKM) ---\n');

    const result = await scrapeStockFull('TLKM');

    console.log('\n========== SCRAPE RESULT ==========');
    console.log('Success:', result.success);

    if (result.data) {
        console.log('\n--- OVERVIEW ---');
        console.log('Symbol:', result.data.overview.symbol);
        console.log('Name:', result.data.overview.name);
        console.log('Price:', result.data.overview.price);
        console.log('Change:', result.data.overview.change, `(${result.data.overview.changePercent}%)`);
        console.log('Market Cap:', result.data.overview.marketCap);
        console.log('P/E Ratio:', result.data.overview.peRatio);

        console.log('\n--- PRICE HISTORY ---');
        console.log('Total entries:', result.data.priceHistory.length);
        if (result.data.priceHistory.length > 0) {
            console.log('First 3:');
            result.data.priceHistory.slice(0, 3).forEach(p => {
                console.log(`  ${p.date}: ${p.close} (${(p.change ?? 0) > 0 ? '+' : ''}${p.change ?? 0})`);
            });
        }

        console.log('\n--- FINANCIALS ---');
        console.log('Income Statements:', result.data.incomeStatements.length);
        console.log('Balance Sheets:', result.data.balanceSheets.length);
        console.log('Cash Flows:', result.data.cashFlows.length);

        console.log('\n--- NEWS ---');
        console.log('Total articles:', result.data.news.length);
        if (result.data.news.length > 0) {
            console.log('Headlines:');
            result.data.news.slice(0, 3).forEach((n, i) => {
                console.log(`  ${i + 1}. ${n.headline?.substring(0, 60)}...`);
            });
        }
    } else {
        console.log('Error:', result.error);
    }

    console.log('\n====================================');

    await closeBrowser();
    process.exit(0);
}

main().catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
});
