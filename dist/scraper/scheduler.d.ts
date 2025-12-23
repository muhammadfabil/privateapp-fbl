/**
 * Run a full scrape of all ISSI stocks
 */
export declare function runFullScrape(): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Start the hourly scrape scheduler
 */
export declare function startScheduler(): void;
/**
 * Stop the scheduler
 */
export declare function stopScheduler(): void;
/**
 * Check if a scrape is currently running
 */
export declare function isScrapeRunning(): boolean;
//# sourceMappingURL=scheduler.d.ts.map