// ============ STOCK OVERVIEW ============
export interface Stock {
    symbol: string;
    name: string;
    price: number | null;
    change: number | null;
    changePercent: number | null;
    marketCap: string | null;
    peRatio: number | null;
    dividendYield: number | null;
    dayRangeLow: number | null;
    dayRangeHigh: number | null;
    yearRangeLow: number | null;
    yearRangeHigh: number | null;
    volume: string | null;
    avgVolume: string | null;
    previousClose: number | null;
    lastUpdated: Date;
    scrapeStatus: 'pending' | 'success' | 'error';
    errorMessage: string | null;
}

// ============ PRICE HISTORY ============
export interface PriceHistory {
    symbol: string;
    date: string; // YYYY-MM-DD
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: string | null;
    change: number | null;
    changePercent: number | null;
}

// ============ INCOME STATEMENT ============
export interface IncomeStatement {
    symbol: string;
    periodType: 'annual' | 'quarterly';
    periodDate: string; // YYYY-MM-DD
    revenue: string | null;
    operatingExpense: string | null;
    netIncome: string | null;
    netProfitMargin: number | null;
    eps: number | null;
    ebitda: string | null;
    effectiveTaxRate: number | null;
}

// ============ BALANCE SHEET ============
export interface BalanceSheet {
    symbol: string;
    periodType: 'annual' | 'quarterly';
    periodDate: string; // YYYY-MM-DD
    cashAndShortTermInvestments: string | null;
    totalAssets: string | null;
    totalLiabilities: string | null;
    totalEquity: string | null;
    sharesOutstanding: string | null;
    priceToBook: number | null;
    returnOnAssets: number | null;
    returnOnCapital: number | null;
}

// ============ CASH FLOW ============
export interface CashFlow {
    symbol: string;
    periodType: 'annual' | 'quarterly';
    periodDate: string; // YYYY-MM-DD
    netIncome: string | null;
    cashFromOperations: string | null;
    cashFromInvesting: string | null;
    cashFromFinancing: string | null;
    netChangeInCash: string | null;
    freeCashFlow: string | null;
}

// ============ STOCK NEWS ============
export interface StockNews {
    symbol: string;
    headline: string;
    source: string | null;
    url: string | null;
    thumbnailUrl: string | null;
    publishedAt: Date | null;
}

// ============ COMPLETE STOCK DATA ============
export interface CompleteStockData {
    overview: Partial<Stock>;
    priceHistory: PriceHistory[];
    incomeStatements: IncomeStatement[];
    balanceSheets: BalanceSheet[];
    cashFlows: CashFlow[];
    news: StockNews[];
}

// ============ SCRAPE RESULTS ============
export interface ScrapeResult {
    success: boolean;
    data?: CompleteStockData;
    error?: string;
}

export interface ScrapeStats {
    totalStocks: number;
    successCount: number;
    errorCount: number;
    pendingCount: number;
    lastScrapeTime: Date | null;
    averageScrapeTime: number;
}

// ============ LEGACY TYPES (for backward compatibility) ============
export interface IssiStock {
    symbol: string;
    name: string;
    freeFloatRatio?: number;
    sharesForIndex?: number;
}
