import { pgTable, text, real, integer, timestamp, serial, date } from 'drizzle-orm/pg-core';
// ============ STOCK OVERVIEW ============
export const stocks = pgTable('stocks', {
    symbol: text('symbol').primaryKey(),
    name: text('name').notNull(),
    price: real('price'),
    change: real('change'),
    changePercent: real('change_percent'),
    marketCap: text('market_cap'),
    peRatio: real('pe_ratio'),
    dividendYield: real('dividend_yield'),
    dayRangeLow: real('day_range_low'),
    dayRangeHigh: real('day_range_high'),
    yearRangeLow: real('year_range_low'),
    yearRangeHigh: real('year_range_high'),
    volume: text('volume'),
    avgVolume: text('avg_volume'),
    previousClose: real('previous_close'),
    lastUpdated: timestamp('last_updated'),
    scrapeStatus: text('scrape_status').default('pending'),
    errorMessage: text('error_message'),
});
// ============ SCRAPE LOGS ============
export const scrapeLogs = pgTable('scrape_logs', {
    id: serial('id').primaryKey(),
    startTime: timestamp('start_time').notNull(),
    endTime: timestamp('end_time'),
    totalStocks: integer('total_stocks').notNull(),
    successCount: integer('success_count').default(0),
    errorCount: integer('error_count').default(0),
    status: text('status').default('running'),
});
// ============ PRICE HISTORY ============
export const priceHistory = pgTable('price_history', {
    id: serial('id').primaryKey(),
    symbol: text('symbol').notNull(),
    date: date('date').notNull(),
    open: real('open'),
    high: real('high'),
    low: real('low'),
    close: real('close'),
    volume: text('volume'),
    change: real('change'),
    changePercent: real('change_percent'),
});
// ============ INCOME STATEMENTS ============
export const incomeStatements = pgTable('income_statements', {
    id: serial('id').primaryKey(),
    symbol: text('symbol').notNull(),
    periodType: text('period_type').notNull(), // 'annual' or 'quarterly'
    periodDate: date('period_date').notNull(),
    revenue: text('revenue'),
    operatingExpense: text('operating_expense'),
    netIncome: text('net_income'),
    netProfitMargin: real('net_profit_margin'),
    eps: real('eps'),
    ebitda: text('ebitda'),
    effectiveTaxRate: real('effective_tax_rate'),
    createdAt: timestamp('created_at').defaultNow(),
});
// ============ BALANCE SHEETS ============
export const balanceSheets = pgTable('balance_sheets', {
    id: serial('id').primaryKey(),
    symbol: text('symbol').notNull(),
    periodType: text('period_type').notNull(), // 'annual' or 'quarterly'
    periodDate: date('period_date').notNull(),
    cashAndShortTermInvestments: text('cash_short_term_investments'),
    totalAssets: text('total_assets'),
    totalLiabilities: text('total_liabilities'),
    totalEquity: text('total_equity'),
    sharesOutstanding: text('shares_outstanding'),
    priceToBook: real('price_to_book'),
    returnOnAssets: real('return_on_assets'),
    returnOnCapital: real('return_on_capital'),
    createdAt: timestamp('created_at').defaultNow(),
});
// ============ CASH FLOWS ============
export const cashFlows = pgTable('cash_flows', {
    id: serial('id').primaryKey(),
    symbol: text('symbol').notNull(),
    periodType: text('period_type').notNull(), // 'annual' or 'quarterly'
    periodDate: date('period_date').notNull(),
    netIncome: text('net_income'),
    cashFromOperations: text('cash_from_operations'),
    cashFromInvesting: text('cash_from_investing'),
    cashFromFinancing: text('cash_from_financing'),
    netChangeInCash: text('net_change_in_cash'),
    freeCashFlow: text('free_cash_flow'),
    createdAt: timestamp('created_at').defaultNow(),
});
// ============ STOCK NEWS ============
export const stockNews = pgTable('stock_news', {
    id: serial('id').primaryKey(),
    symbol: text('symbol').notNull(),
    headline: text('headline').notNull(),
    source: text('source'),
    url: text('url'),
    thumbnailUrl: text('thumbnail_url'),
    publishedAt: timestamp('published_at'),
    scrapedAt: timestamp('scraped_at').defaultNow(),
});
//# sourceMappingURL=schema.js.map