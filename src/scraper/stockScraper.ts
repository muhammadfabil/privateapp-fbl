import { Page } from 'playwright';
import { getNewPage, closeBrowser, delay } from './browser.js';
import { parseAllData, parseStockPage } from '../parser/googleFinance.js';
import { config } from '../config.js';
import { db } from '../db/index.js';
import {
    stocks,
    priceHistory,
    incomeStatements,
    balanceSheets,
    cashFlows,
    stockNews
} from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import type {
    Stock,
    ScrapeResult,
    CompleteStockData,
    PriceHistory,
    IncomeStatement,
    BalanceSheet,
    CashFlow,
    StockNews
} from '../types/stock.js';

const { baseUrl, exchange } = config.googleFinance;

/**
 * Scrape ALL data for a single stock from Google Finance
 * Uses ?window=MAX to get maximum historical data
 */
export async function scrapeStockFull(symbol: string, page?: Page): Promise<ScrapeResult> {
    // Use MAX window for maximum historical data
    const url = `${baseUrl}/${symbol}:${exchange}?window=MAX`;
    let ownPage = false;

    try {
        if (!page) {
            page = await getNewPage();
            ownPage = true;
        }

        console.log(`Scraping ${symbol} (full data)...`);

        // Navigate to the stock page
        const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });

        if (!response || !response.ok()) {
            throw new Error(`Failed to load page: ${response?.status()}`);
        }

        // Wait for content to load
        await page.waitForSelector('div[data-last-price], div.YMlKec', {
            timeout: 10000,
        }).catch(() => {
            // Continue even if selector not found - try to parse anyway
        });

        // Get page HTML
        const html = await page.content();

        // Check for CAPTCHA or block
        if (html.includes('unusual traffic') || html.includes('captcha')) {
            throw new Error('Blocked by Google - CAPTCHA detected');
        }

        // Parse ALL data from the page
        const data = parseAllData(html, symbol);

        // Save all data to database
        await saveCompleteStockData(symbol, data);

        const priceCount = data.priceHistory.length;
        const incomeCount = data.incomeStatements.length;
        const newsCount = data.news.length;

        console.log(`✓ ${symbol}: ${data.overview.price ?? 'N/A'} | History: ${priceCount} | Financials: ${incomeCount} | News: ${newsCount}`);

        return { success: true, data };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`✗ ${symbol}: ${errorMessage}`);

        // Save error status
        await saveStockData(symbol, {
            symbol,
            scrapeStatus: 'error',
            errorMessage,
            lastUpdated: new Date(),
        });

        return { success: false, error: errorMessage };

    } finally {
        if (ownPage && page) {
            await page.close();
        }
    }
}

/**
 * Scrape a single stock from Google Finance (overview only - legacy)
 */
export async function scrapeStock(symbol: string, page?: Page): Promise<ScrapeResult> {
    const url = `${baseUrl}/${symbol}:${exchange}`;
    let ownPage = false;

    try {
        if (!page) {
            page = await getNewPage();
            ownPage = true;
        }

        console.log(`Scraping ${symbol}...`);

        // Navigate to the stock page
        const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
        });

        if (!response || !response.ok()) {
            throw new Error(`Failed to load page: ${response?.status()}`);
        }

        // Wait for content to load
        await page.waitForSelector('div[data-last-price], div.YMlKec', {
            timeout: 10000,
        }).catch(() => {
            // Continue even if selector not found - try to parse anyway
        });

        // Get page HTML
        const html = await page.content();

        // Check for CAPTCHA or block
        if (html.includes('unusual traffic') || html.includes('captcha')) {
            throw new Error('Blocked by Google - CAPTCHA detected');
        }

        // Parse the page (overview only)
        const overview = parseStockPage(html, symbol);

        // Save to database
        await saveStockData(symbol, overview);

        console.log(`✓ ${symbol}: ${overview.price ?? 'N/A'}`);

        return { success: true, data: { overview, priceHistory: [], incomeStatements: [], balanceSheets: [], cashFlows: [], news: [] } };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`✗ ${symbol}: ${errorMessage}`);

        // Save error status
        await saveStockData(symbol, {
            symbol,
            scrapeStatus: 'error',
            errorMessage,
            lastUpdated: new Date(),
        });

        return { success: false, error: errorMessage };

    } finally {
        if (ownPage && page) {
            await page.close();
        }
    }
}

/**
 * Scrape multiple stocks with rate limiting (full data)
 */
export async function scrapeStocksFull(symbols: string[]): Promise<{
    success: number;
    failed: number;
    results: ScrapeResult[];
}> {
    const results: ScrapeResult[] = [];
    let success = 0;
    let failed = 0;

    const page = await getNewPage();

    try {
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];

            const result = await scrapeStockFull(symbol, page);
            results.push(result);

            if (result.success) {
                success++;
            } else {
                failed++;

                // If we hit a CAPTCHA, stop and wait longer
                if (result.error?.includes('CAPTCHA') || result.error?.includes('Blocked')) {
                    console.log('Rate limited! Stopping batch...');
                    break;
                }
            }

            // Rate limiting delay (except for last item)
            if (i < symbols.length - 1) {
                await delay();
            }
        }
    } finally {
        await page.close();
    }

    return { success, failed, results };
}

/**
 * Scrape multiple stocks with rate limiting (overview only)
 */
export async function scrapeStocks(symbols: string[]): Promise<{
    success: number;
    failed: number;
    results: ScrapeResult[];
}> {
    const results: ScrapeResult[] = [];
    let success = 0;
    let failed = 0;

    const page = await getNewPage();

    try {
        for (let i = 0; i < symbols.length; i++) {
            const symbol = symbols[i];

            const result = await scrapeStock(symbol, page);
            results.push(result);

            if (result.success) {
                success++;
            } else {
                failed++;

                // If we hit a CAPTCHA, stop and wait longer
                if (result.error?.includes('CAPTCHA') || result.error?.includes('Blocked')) {
                    console.log('Rate limited! Stopping batch...');
                    break;
                }
            }

            // Rate limiting delay (except for last item)
            if (i < symbols.length - 1) {
                await delay();
            }
        }
    } finally {
        await page.close();
    }

    return { success, failed, results };
}

/**
 * Scrape stocks in batches with cooldown periods (full data)
 */
export async function scrapeStocksInBatches(symbols: string[], fullData: boolean = true): Promise<void> {
    const { batchSize, batchCooldown } = config.scraper;
    const batches: string[][] = [];

    // Split into batches
    for (let i = 0; i < symbols.length; i += batchSize) {
        batches.push(symbols.slice(i, i + batchSize));
    }

    console.log(`Starting scrape: ${symbols.length} stocks in ${batches.length} batches (${fullData ? 'full data' : 'overview only'})`);

    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\n--- Batch ${i + 1}/${batches.length} (${batch.length} stocks) ---`);

        const { success, failed } = fullData
            ? await scrapeStocksFull(batch)
            : await scrapeStocks(batch);

        totalSuccess += success;
        totalFailed += failed;

        // Cooldown between batches (except for last batch)
        if (i < batches.length - 1) {
            console.log(`Batch complete. Cooling down for ${batchCooldown / 1000}s...`);
            await delay(batchCooldown);
        }
    }

    console.log(`\n=== Scrape Complete ===`);
    console.log(`Success: ${totalSuccess}, Failed: ${totalFailed}`);
}

/**
 * Save complete stock data to database
 */
async function saveCompleteStockData(symbol: string, data: CompleteStockData): Promise<void> {
    // Save overview
    await saveStockData(symbol, data.overview);

    // Save price history
    if (data.priceHistory.length > 0) {
        await savePriceHistory(symbol, data.priceHistory);
    }

    // Save income statements
    if (data.incomeStatements.length > 0) {
        await saveIncomeStatements(symbol, data.incomeStatements);
    }

    // Save balance sheets
    if (data.balanceSheets.length > 0) {
        await saveBalanceSheets(symbol, data.balanceSheets);
    }

    // Save cash flows
    if (data.cashFlows.length > 0) {
        await saveCashFlows(symbol, data.cashFlows);
    }

    // Save news
    if (data.news.length > 0) {
        await saveStockNews(symbol, data.news);
    }
}

/**
 * Save stock overview data to database
 */
async function saveStockData(symbol: string, data: Partial<Stock>): Promise<void> {
    const existingRows = await db.select().from(stocks).where(eq(stocks.symbol, symbol));
    const existing = existingRows[0];

    // Convert lastUpdated to Date object for PostgreSQL
    let lastUpdatedDate: Date | null = null;
    if (data.lastUpdated) {
        if (data.lastUpdated instanceof Date) {
            lastUpdatedDate = data.lastUpdated;
        } else if (typeof data.lastUpdated === 'number') {
            lastUpdatedDate = new Date(data.lastUpdated * 1000);
        }
    }

    if (existing) {
        await db.update(stocks)
            .set({
                name: data.name ?? existing.name,
                price: data.price ?? existing.price,
                change: data.change ?? existing.change,
                changePercent: data.changePercent ?? existing.changePercent,
                marketCap: data.marketCap ?? existing.marketCap,
                peRatio: data.peRatio ?? existing.peRatio,
                dividendYield: data.dividendYield ?? existing.dividendYield,
                dayRangeLow: data.dayRangeLow ?? existing.dayRangeLow,
                dayRangeHigh: data.dayRangeHigh ?? existing.dayRangeHigh,
                yearRangeLow: data.yearRangeLow ?? existing.yearRangeLow,
                yearRangeHigh: data.yearRangeHigh ?? existing.yearRangeHigh,
                volume: data.volume ?? existing.volume,
                avgVolume: data.avgVolume ?? existing.avgVolume,
                previousClose: data.previousClose ?? existing.previousClose,
                lastUpdated: lastUpdatedDate,
                scrapeStatus: data.scrapeStatus ?? existing.scrapeStatus,
                errorMessage: data.errorMessage ?? existing.errorMessage,
            })
            .where(eq(stocks.symbol, symbol));
    } else {
        await db.insert(stocks).values({
            symbol,
            name: data.name || symbol,
            price: data.price ?? null,
            change: data.change ?? null,
            changePercent: data.changePercent ?? null,
            marketCap: data.marketCap ?? null,
            peRatio: data.peRatio ?? null,
            dividendYield: data.dividendYield ?? null,
            dayRangeLow: data.dayRangeLow ?? null,
            dayRangeHigh: data.dayRangeHigh ?? null,
            yearRangeLow: data.yearRangeLow ?? null,
            yearRangeHigh: data.yearRangeHigh ?? null,
            volume: data.volume ?? null,
            avgVolume: data.avgVolume ?? null,
            previousClose: data.previousClose ?? null,
            lastUpdated: lastUpdatedDate,
            scrapeStatus: data.scrapeStatus || 'pending',
            errorMessage: data.errorMessage ?? null,
        });
    }
}

/**
 * Save price history to database
 */
async function savePriceHistory(symbol: string, history: PriceHistory[]): Promise<void> {
    // Delete existing history for this symbol to avoid duplicates
    await db.delete(priceHistory).where(eq(priceHistory.symbol, symbol));

    // Insert new history
    for (const record of history) {
        await db.insert(priceHistory).values({
            symbol: record.symbol,
            date: record.date,
            open: record.open,
            high: record.high,
            low: record.low,
            close: record.close,
            volume: record.volume,
            change: record.change,
            changePercent: record.changePercent,
        });
    }
}

/**
 * Save income statements to database
 */
async function saveIncomeStatements(symbol: string, statements: IncomeStatement[]): Promise<void> {
    // Delete existing statements for this symbol
    await db.delete(incomeStatements).where(eq(incomeStatements.symbol, symbol));

    for (const stmt of statements) {
        await db.insert(incomeStatements).values({
            symbol: stmt.symbol,
            periodType: stmt.periodType,
            periodDate: stmt.periodDate,
            revenue: stmt.revenue,
            operatingExpense: stmt.operatingExpense,
            netIncome: stmt.netIncome,
            netProfitMargin: stmt.netProfitMargin,
            eps: stmt.eps,
            ebitda: stmt.ebitda,
            effectiveTaxRate: stmt.effectiveTaxRate,
        });
    }
}

/**
 * Save balance sheets to database
 */
async function saveBalanceSheets(symbol: string, sheets: BalanceSheet[]): Promise<void> {
    // Delete existing sheets for this symbol
    await db.delete(balanceSheets).where(eq(balanceSheets.symbol, symbol));

    for (const sheet of sheets) {
        await db.insert(balanceSheets).values({
            symbol: sheet.symbol,
            periodType: sheet.periodType,
            periodDate: sheet.periodDate,
            cashAndShortTermInvestments: sheet.cashAndShortTermInvestments,
            totalAssets: sheet.totalAssets,
            totalLiabilities: sheet.totalLiabilities,
            totalEquity: sheet.totalEquity,
            sharesOutstanding: sheet.sharesOutstanding,
            priceToBook: sheet.priceToBook,
            returnOnAssets: sheet.returnOnAssets,
            returnOnCapital: sheet.returnOnCapital,
        });
    }
}

/**
 * Save cash flows to database
 */
async function saveCashFlows(symbol: string, flows: CashFlow[]): Promise<void> {
    // Delete existing flows for this symbol
    await db.delete(cashFlows).where(eq(cashFlows.symbol, symbol));

    for (const flow of flows) {
        await db.insert(cashFlows).values({
            symbol: flow.symbol,
            periodType: flow.periodType,
            periodDate: flow.periodDate,
            netIncome: flow.netIncome,
            cashFromOperations: flow.cashFromOperations,
            cashFromInvesting: flow.cashFromInvesting,
            cashFromFinancing: flow.cashFromFinancing,
            netChangeInCash: flow.netChangeInCash,
            freeCashFlow: flow.freeCashFlow,
        });
    }
}

/**
 * Save stock news to database
 */
async function saveStockNews(symbol: string, news: StockNews[]): Promise<void> {
    // Delete existing news for this symbol (keep fresh)
    await db.delete(stockNews).where(eq(stockNews.symbol, symbol));

    for (const item of news) {
        await db.insert(stockNews).values({
            symbol: item.symbol,
            headline: item.headline,
            source: item.source,
            url: item.url,
            thumbnailUrl: item.thumbnailUrl,
            publishedAt: item.publishedAt,
        });
    }
}
