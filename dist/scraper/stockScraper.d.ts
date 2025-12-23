import { Page } from 'playwright';
import type { ScrapeResult } from '../types/stock.js';
/**
 * Scrape ALL data for a single stock from Google Finance
 * Uses ?window=MAX to get maximum historical data
 */
export declare function scrapeStockFull(symbol: string, page?: Page): Promise<ScrapeResult>;
/**
 * Scrape a single stock from Google Finance (overview only - legacy)
 */
export declare function scrapeStock(symbol: string, page?: Page): Promise<ScrapeResult>;
/**
 * Scrape multiple stocks with rate limiting (full data)
 */
export declare function scrapeStocksFull(symbols: string[]): Promise<{
    success: number;
    failed: number;
    results: ScrapeResult[];
}>;
/**
 * Scrape multiple stocks with rate limiting (overview only)
 */
export declare function scrapeStocks(symbols: string[]): Promise<{
    success: number;
    failed: number;
    results: ScrapeResult[];
}>;
/**
 * Scrape stocks in batches with cooldown periods (full data)
 */
export declare function scrapeStocksInBatches(symbols: string[], fullData?: boolean): Promise<void>;
//# sourceMappingURL=stockScraper.d.ts.map