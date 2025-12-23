import cron from 'node-cron';
import { scrapeStocksInBatches } from './stockScraper.js';
import { closeBrowser } from './browser.js';
import { getIssiSymbols } from '../data/issiStocks.js';
import { db } from '../db/index.js';
import { scrapeLogs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

let isRunning = false;
let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Run a full scrape of all ISSI stocks
 */
export async function runFullScrape(): Promise<{
    success: boolean;
    message: string;
}> {
    if (isRunning) {
        return { success: false, message: 'Scrape already in progress' };
    }

    isRunning = true;
    const startTime = new Date();
    const symbols = getIssiSymbols();

    // Create scrape log entry
    const logEntry = await db.insert(scrapeLogs).values({
        startTime: startTime,
        totalStocks: symbols.length,
        status: 'running',
    }).returning();

    const logId = logEntry[0]?.id;

    console.log(`\n========================================`);
    console.log(`Starting scheduled scrape at ${startTime.toISOString()}`);
    console.log(`Total stocks: ${symbols.length}`);
    console.log(`========================================\n`);

    try {
        // fullData=true to scrape all data (overview, price history, financials, news)
        await scrapeStocksInBatches(symbols, true);

        // Update log entry
        if (logId) {
            await db.update(scrapeLogs)
                .set({
                    endTime: new Date(),
                    status: 'completed',
                })
                .where(eq(scrapeLogs.id, logId));
        }

        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;

        console.log(`\nScrape completed in ${duration.toFixed(1)}s`);

        return { success: true, message: `Scrape completed in ${duration.toFixed(1)}s` };

    } catch (error) {
        console.error('Scrape failed:', error);

        if (logId) {
            await db.update(scrapeLogs)
                .set({
                    endTime: new Date(),
                    status: 'failed',
                })
                .where(eq(scrapeLogs.id, logId));
        }

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };

    } finally {
        isRunning = false;
        await closeBrowser();
    }
}

/**
 * Start the hourly scrape scheduler
 */
export function startScheduler(): void {
    if (scheduledTask) {
        console.log('Scheduler already running');
        return;
    }

    // Run every hour at minute 0
    // Cron format: minute hour day-of-month month day-of-week
    scheduledTask = cron.schedule('0 * * * *', async () => {
        console.log('Hourly scrape triggered');
        await runFullScrape();
    });

    console.log('Scheduler started - will run every hour at :00');
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
    if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask = null;
        console.log('Scheduler stopped');
    }
}

/**
 * Check if a scrape is currently running
 */
export function isScrapeRunning(): boolean {
    return isRunning;
}
