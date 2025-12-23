import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config.js';
import * as schema from './schema.js';
const pool = new Pool({
    connectionString: config.database.url,
});
export const db = drizzle(pool, { schema });
// Initialize database tables
export async function initializeDatabase() {
    try {
        await pool.query(`
      -- Stock overview table
      CREATE TABLE IF NOT EXISTS stocks (
        symbol TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL,
        change REAL,
        change_percent REAL,
        market_cap TEXT,
        pe_ratio REAL,
        dividend_yield REAL,
        day_range_low REAL,
        day_range_high REAL,
        year_range_low REAL,
        year_range_high REAL,
        volume TEXT,
        avg_volume TEXT,
        previous_close REAL,
        last_updated TIMESTAMP,
        scrape_status TEXT DEFAULT 'pending',
        error_message TEXT
      );

      -- Scrape logs table
      CREATE TABLE IF NOT EXISTS scrape_logs (
        id SERIAL PRIMARY KEY,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        total_stocks INTEGER NOT NULL,
        success_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'running'
      );

      -- Price history table
      CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        symbol TEXT NOT NULL,
        date DATE NOT NULL,
        open REAL,
        high REAL,
        low REAL,
        close REAL,
        volume TEXT,
        change REAL,
        change_percent REAL
      );

      -- Create index for faster queries
      CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON price_history(symbol);
      CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(date);
      CREATE INDEX IF NOT EXISTS idx_price_history_symbol_date ON price_history(symbol, date);

      -- Income statements table
      CREATE TABLE IF NOT EXISTS income_statements (
        id SERIAL PRIMARY KEY,
        symbol TEXT NOT NULL,
        period_type TEXT NOT NULL,
        period_date DATE NOT NULL,
        revenue TEXT,
        operating_expense TEXT,
        net_income TEXT,
        net_profit_margin REAL,
        eps REAL,
        ebitda TEXT,
        effective_tax_rate REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_income_statements_symbol ON income_statements(symbol);

      -- Balance sheets table
      CREATE TABLE IF NOT EXISTS balance_sheets (
        id SERIAL PRIMARY KEY,
        symbol TEXT NOT NULL,
        period_type TEXT NOT NULL,
        period_date DATE NOT NULL,
        cash_short_term_investments TEXT,
        total_assets TEXT,
        total_liabilities TEXT,
        total_equity TEXT,
        shares_outstanding TEXT,
        price_to_book REAL,
        return_on_assets REAL,
        return_on_capital REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_balance_sheets_symbol ON balance_sheets(symbol);

      -- Cash flows table
      CREATE TABLE IF NOT EXISTS cash_flows (
        id SERIAL PRIMARY KEY,
        symbol TEXT NOT NULL,
        period_type TEXT NOT NULL,
        period_date DATE NOT NULL,
        net_income TEXT,
        cash_from_operations TEXT,
        cash_from_investing TEXT,
        cash_from_financing TEXT,
        net_change_in_cash TEXT,
        free_cash_flow TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_cash_flows_symbol ON cash_flows(symbol);

      -- Stock news table
      CREATE TABLE IF NOT EXISTS stock_news (
        id SERIAL PRIMARY KEY,
        symbol TEXT NOT NULL,
        headline TEXT NOT NULL,
        source TEXT,
        url TEXT,
        thumbnail_url TEXT,
        published_at TIMESTAMP,
        scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_stock_news_symbol ON stock_news(symbol);

      -- Add new columns to stocks table if they don't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stocks' AND column_name='avg_volume') THEN
          ALTER TABLE stocks ADD COLUMN avg_volume TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stocks' AND column_name='previous_close') THEN
          ALTER TABLE stocks ADD COLUMN previous_close REAL;
        END IF;
      END $$;
    `);
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}
//# sourceMappingURL=index.js.map