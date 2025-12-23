import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { initializeDatabase } from './db/index.js';
import { router as apiRouter } from './api/routes.js';
import { startScheduler } from './scraper/scheduler.js';
import { closeBrowser } from './scraper/browser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());

// Serve static files (dashboard)
app.use(express.static(path.join(__dirname, '../public')));

// CORS for local development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// API Routes
app.use('/api', apiRouter);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'ISSI Stock Scraper API',
        version: '2.0.0',
        description: 'Comprehensive API for scraping Indonesia Sharia Stock Index (ISSI) data from Google Finance',
        endpoints: {
            health: 'GET /api/health',
            stocks: 'GET /api/stocks',
            stockSearch: 'GET /api/stocks/search?q=QUERY',
            stockDetail: 'GET /api/stocks/:symbol',
            stockHistory: 'GET /api/stocks/:symbol/history',
            stockFinancials: 'GET /api/stocks/:symbol/financials',
            stockIncomeStatements: 'GET /api/stocks/:symbol/income-statements',
            stockBalanceSheets: 'GET /api/stocks/:symbol/balance-sheets',
            stockCashFlows: 'GET /api/stocks/:symbol/cash-flows',
            stockNews: 'GET /api/stocks/:symbol/news',
            stockComplete: 'GET /api/stocks/:symbol/complete',
            stats: 'GET /api/stats',
            logs: 'GET /api/logs',
            triggerScrape: 'POST /api/scrape/trigger',
            startScheduler: 'POST /api/scheduler/start',
            stopScheduler: 'POST /api/scheduler/stop',
        },
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await closeBrowser();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down...');
    await closeBrowser();
    process.exit(0);
});

// Start server
async function main() {
    try {
        // Initialize database
        initializeDatabase();

        // Start Express server
        app.listen(config.port, () => {
            console.log(`\n🚀 ISSI Stock Scraper API v2.0 running at http://localhost:${config.port}`);
            console.log(`📊 Total ISSI stocks configured: Check /api/stats`);
            console.log(`\nAvailable endpoints:`);
            console.log(`  GET  /api/health                    - Health check`);
            console.log(`  GET  /api/stocks                    - List all stocks`);
            console.log(`  GET  /api/stocks/:symbol            - Get stock overview`);
            console.log(`  GET  /api/stocks/:symbol/history    - Price history`);
            console.log(`  GET  /api/stocks/:symbol/financials - All financials`);
            console.log(`  GET  /api/stocks/:symbol/news       - Stock news`);
            console.log(`  GET  /api/stocks/:symbol/complete   - All data combined`);
            console.log(`  GET  /api/stocks/search             - Search stocks`);
            console.log(`  GET  /api/stats                     - Scraping statistics`);
            console.log(`  POST /api/scrape/trigger            - Start manual scrape`);
            console.log(`  POST /api/scheduler/start           - Start hourly scheduler`);
            console.log(`\n💡 Tip: Start scheduler with POST /api/scheduler/start`);
        });

        // Optionally auto-start scheduler
        // Uncomment the line below to auto-start hourly scraping
        // startScheduler();

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

main();
