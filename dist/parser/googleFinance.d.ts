import type { Stock, CompleteStockData } from '../types/stock.js';
/**
 * Parse Google Finance stock page HTML and extract ALL data
 */
export declare function parseAllData(html: string, symbol: string): CompleteStockData;
/**
 * Parse Google Finance stock page HTML (for overview data)
 */
export declare function parseStockPage(html: string, symbol: string): Partial<Stock>;
//# sourceMappingURL=googleFinance.d.ts.map