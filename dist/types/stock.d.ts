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
export interface PriceHistory {
    symbol: string;
    date: string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    volume: string | null;
    change: number | null;
    changePercent: number | null;
}
export interface IncomeStatement {
    symbol: string;
    periodType: 'annual' | 'quarterly';
    periodDate: string;
    revenue: string | null;
    operatingExpense: string | null;
    netIncome: string | null;
    netProfitMargin: number | null;
    eps: number | null;
    ebitda: string | null;
    effectiveTaxRate: number | null;
}
export interface BalanceSheet {
    symbol: string;
    periodType: 'annual' | 'quarterly';
    periodDate: string;
    cashAndShortTermInvestments: string | null;
    totalAssets: string | null;
    totalLiabilities: string | null;
    totalEquity: string | null;
    sharesOutstanding: string | null;
    priceToBook: number | null;
    returnOnAssets: number | null;
    returnOnCapital: number | null;
}
export interface CashFlow {
    symbol: string;
    periodType: 'annual' | 'quarterly';
    periodDate: string;
    netIncome: string | null;
    cashFromOperations: string | null;
    cashFromInvesting: string | null;
    cashFromFinancing: string | null;
    netChangeInCash: string | null;
    freeCashFlow: string | null;
}
export interface StockNews {
    symbol: string;
    headline: string;
    source: string | null;
    url: string | null;
    thumbnailUrl: string | null;
    publishedAt: Date | null;
}
export interface CompleteStockData {
    overview: Partial<Stock>;
    priceHistory: PriceHistory[];
    incomeStatements: IncomeStatement[];
    balanceSheets: BalanceSheet[];
    cashFlows: CashFlow[];
    news: StockNews[];
}
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
export interface IssiStock {
    symbol: string;
    name: string;
    freeFloatRatio?: number;
    sharesForIndex?: number;
}
//# sourceMappingURL=stock.d.ts.map