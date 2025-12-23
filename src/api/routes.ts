import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import {
    stocks,
    scrapeLogs,
    priceHistory,
    incomeStatements,
    balanceSheets,
    cashFlows,
    stockNews
} from '../db/schema.js';
import { eq, like, desc, sql, asc } from 'drizzle-orm';
import { runFullScrape, isScrapeRunning, startScheduler, stopScheduler } from '../scraper/scheduler.js';
import { issiStocks } from '../data/issiStocks.js';

export const router = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        scrapeRunning: isScrapeRunning(),
    });
});

/**
 * GET /api/stocks
 * List all stocks with pagination
 */
router.get('/stocks', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const offset = (page - 1) * limit;

        const [stockList, countResult] = await Promise.all([
            db.select().from(stocks).limit(limit).offset(offset),
            db.select({ count: sql<number>`count(*)` }).from(stocks),
        ]);

        const total = countResult[0]?.count || 0;

        res.json({
            data: stockList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stocks' });
    }
});

/**
 * GET /api/stocks/search
 * Search stocks by symbol or name
 */
router.get('/stocks/search', async (req: Request, res: Response) => {
    try {
        const query = (req.query.q as string)?.toUpperCase() || '';

        if (!query || query.length < 2) {
            return res.status(400).json({ error: 'Query must be at least 2 characters' });
        }

        const results = await db.select()
            .from(stocks)
            .where(
                sql`upper(${stocks.symbol}) LIKE ${`%${query}%`} OR upper(${stocks.name}) LIKE ${`%${query}%`}`
            )
            .limit(20);

        res.json({ data: results });
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
});

/**
 * GET /api/stocks/:symbol
 * Get single stock by symbol (overview)
 */
router.get('/stocks/:symbol', async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol.toUpperCase();

        const results = await db.select()
            .from(stocks)
            .where(eq(stocks.symbol, symbol));

        const stock = results[0];

        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        res.json({ data: stock });
    } catch (error) {
        console.error('Error fetching stock:', error);
        res.status(500).json({ error: 'Failed to fetch stock' });
    }
});

/**
 * GET /api/stocks/:symbol/history
 * Get price history for a stock
 */
router.get('/stocks/:symbol/history', async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol.toUpperCase();
        const limit = Math.min(parseInt(req.query.limit as string) || 365, 1000);

        const history = await db.select()
            .from(priceHistory)
            .where(eq(priceHistory.symbol, symbol))
            .orderBy(desc(priceHistory.date))
            .limit(limit);

        res.json({
            data: history,
            count: history.length,
        });
    } catch (error) {
        console.error('Error fetching price history:', error);
        res.status(500).json({ error: 'Failed to fetch price history' });
    }
});

/**
 * GET /api/stocks/:symbol/financials
 * Get all financial data for a stock (income statement, balance sheet, cash flow)
 */
router.get('/stocks/:symbol/financials', async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol.toUpperCase();
        const periodType = (req.query.period as string)?.toLowerCase() || 'all'; // 'annual', 'quarterly', or 'all'

        const whereClause = periodType === 'all'
            ? eq(incomeStatements.symbol, symbol)
            : sql`${incomeStatements.symbol} = ${symbol} AND ${incomeStatements.periodType} = ${periodType}`;

        const balanceWhereClause = periodType === 'all'
            ? eq(balanceSheets.symbol, symbol)
            : sql`${balanceSheets.symbol} = ${symbol} AND ${balanceSheets.periodType} = ${periodType}`;

        const cashFlowWhereClause = periodType === 'all'
            ? eq(cashFlows.symbol, symbol)
            : sql`${cashFlows.symbol} = ${symbol} AND ${cashFlows.periodType} = ${periodType}`;

        const [incomeData, balanceData, cashFlowData] = await Promise.all([
            db.select()
                .from(incomeStatements)
                .where(whereClause)
                .orderBy(desc(incomeStatements.periodDate)),
            db.select()
                .from(balanceSheets)
                .where(balanceWhereClause)
                .orderBy(desc(balanceSheets.periodDate)),
            db.select()
                .from(cashFlows)
                .where(cashFlowWhereClause)
                .orderBy(desc(cashFlows.periodDate)),
        ]);

        res.json({
            symbol,
            incomeStatements: incomeData,
            balanceSheets: balanceData,
            cashFlows: cashFlowData,
        });
    } catch (error) {
        console.error('Error fetching financials:', error);
        res.status(500).json({ error: 'Failed to fetch financials' });
    }
});

/**
 * GET /api/stocks/:symbol/income-statements
 * Get income statements for a stock
 */
router.get('/stocks/:symbol/income-statements', async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol.toUpperCase();
        const periodType = req.query.period as string; // 'annual' or 'quarterly'

        let query = db.select()
            .from(incomeStatements)
            .where(eq(incomeStatements.symbol, symbol))
            .orderBy(desc(incomeStatements.periodDate));

        const data = await query;

        const filtered = periodType
            ? data.filter(d => d.periodType === periodType)
            : data;

        res.json({ data: filtered });
    } catch (error) {
        console.error('Error fetching income statements:', error);
        res.status(500).json({ error: 'Failed to fetch income statements' });
    }
});

/**
 * GET /api/stocks/:symbol/balance-sheets
 * Get balance sheets for a stock
 */
router.get('/stocks/:symbol/balance-sheets', async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol.toUpperCase();
        const periodType = req.query.period as string;

        const data = await db.select()
            .from(balanceSheets)
            .where(eq(balanceSheets.symbol, symbol))
            .orderBy(desc(balanceSheets.periodDate));

        const filtered = periodType
            ? data.filter(d => d.periodType === periodType)
            : data;

        res.json({ data: filtered });
    } catch (error) {
        console.error('Error fetching balance sheets:', error);
        res.status(500).json({ error: 'Failed to fetch balance sheets' });
    }
});

/**
 * GET /api/stocks/:symbol/cash-flows
 * Get cash flows for a stock
 */
router.get('/stocks/:symbol/cash-flows', async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol.toUpperCase();
        const periodType = req.query.period as string;

        const data = await db.select()
            .from(cashFlows)
            .where(eq(cashFlows.symbol, symbol))
            .orderBy(desc(cashFlows.periodDate));

        const filtered = periodType
            ? data.filter(d => d.periodType === periodType)
            : data;

        res.json({ data: filtered });
    } catch (error) {
        console.error('Error fetching cash flows:', error);
        res.status(500).json({ error: 'Failed to fetch cash flows' });
    }
});

/**
 * GET /api/stocks/:symbol/news
 * Get news for a stock
 */
router.get('/stocks/:symbol/news', async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol.toUpperCase();
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

        const news = await db.select()
            .from(stockNews)
            .where(eq(stockNews.symbol, symbol))
            .orderBy(desc(stockNews.scrapedAt))
            .limit(limit);

        res.json({ data: news });
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

/**
 * GET /api/stocks/:symbol/complete
 * Get ALL data for a stock (overview, history, financials, news)
 */
router.get('/stocks/:symbol/complete', async (req: Request, res: Response) => {
    try {
        const symbol = req.params.symbol.toUpperCase();

        const [
            stockData,
            historyData,
            incomeData,
            balanceData,
            cashFlowData,
            newsData,
        ] = await Promise.all([
            db.select().from(stocks).where(eq(stocks.symbol, symbol)),
            db.select().from(priceHistory).where(eq(priceHistory.symbol, symbol)).orderBy(desc(priceHistory.date)).limit(365),
            db.select().from(incomeStatements).where(eq(incomeStatements.symbol, symbol)).orderBy(desc(incomeStatements.periodDate)),
            db.select().from(balanceSheets).where(eq(balanceSheets.symbol, symbol)).orderBy(desc(balanceSheets.periodDate)),
            db.select().from(cashFlows).where(eq(cashFlows.symbol, symbol)).orderBy(desc(cashFlows.periodDate)),
            db.select().from(stockNews).where(eq(stockNews.symbol, symbol)).orderBy(desc(stockNews.scrapedAt)).limit(20),
        ]);

        if (!stockData[0]) {
            return res.status(404).json({ error: 'Stock not found' });
        }

        res.json({
            overview: stockData[0],
            priceHistory: historyData,
            financials: {
                incomeStatements: incomeData,
                balanceSheets: balanceData,
                cashFlows: cashFlowData,
            },
            news: newsData,
        });
    } catch (error) {
        console.error('Error fetching complete stock data:', error);
        res.status(500).json({ error: 'Failed to fetch complete stock data' });
    }
});

/**
 * GET /api/stats
 * Get scraping statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const [
            totalResult,
            successResult,
            errorResult,
            lastLogResult,
            historyCountResult,
            newsCountResult,
        ] = await Promise.all([
            db.select({ count: sql<number>`count(*)` }).from(stocks),
            db.select({ count: sql<number>`count(*)` }).from(stocks).where(eq(stocks.scrapeStatus, 'success')),
            db.select({ count: sql<number>`count(*)` }).from(stocks).where(eq(stocks.scrapeStatus, 'error')),
            db.select().from(scrapeLogs).orderBy(desc(scrapeLogs.startTime)).limit(1),
            db.select({ count: sql<number>`count(*)` }).from(priceHistory),
            db.select({ count: sql<number>`count(*)` }).from(stockNews),
        ]);

        const lastLog = lastLogResult[0];

        res.json({
            totalStocks: totalResult[0]?.count || 0,
            successCount: successResult[0]?.count || 0,
            errorCount: errorResult[0]?.count || 0,
            issiCount: issiStocks.length,
            priceHistoryRecords: historyCountResult[0]?.count || 0,
            newsArticles: newsCountResult[0]?.count || 0,
            scrapeRunning: isScrapeRunning(),
            lastScrape: lastLog ? {
                startTime: lastLog.startTime instanceof Date ? lastLog.startTime.toISOString() : lastLog.startTime,
                endTime: lastLog.endTime instanceof Date ? lastLog.endTime.toISOString() : lastLog.endTime,
                status: lastLog.status,
            } : null,
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

/**
 * POST /api/scrape/trigger
 * Manually trigger a scrape
 */
router.post('/scrape/trigger', async (req: Request, res: Response) => {
    try {
        if (isScrapeRunning()) {
            return res.status(409).json({ error: 'Scrape already in progress' });
        }

        // Run in background, don't await
        runFullScrape().catch(console.error);

        res.json({
            message: 'Scrape started',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start scrape' });
    }
});

/**
 * POST /api/scheduler/start
 * Start the hourly scheduler
 */
router.post('/scheduler/start', (req: Request, res: Response) => {
    startScheduler();
    res.json({ message: 'Scheduler started' });
});

/**
 * POST /api/scheduler/stop
 * Stop the hourly scheduler
 */
router.post('/scheduler/stop', (req: Request, res: Response) => {
    stopScheduler();
    res.json({ message: 'Scheduler stopped' });
});

/**
 * GET /api/logs
 * Get scrape logs
 */
router.get('/logs', async (req: Request, res: Response) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

        const logs = await db.select()
            .from(scrapeLogs)
            .orderBy(desc(scrapeLogs.startTime))
            .limit(limit);

        res.json({
            data: logs.map(log => ({
                ...log,
                startTime: log.startTime instanceof Date ? log.startTime.toISOString() : log.startTime,
                endTime: log.endTime instanceof Date ? log.endTime.toISOString() : log.endTime,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});
