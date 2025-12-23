import 'dotenv/config';

export const config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    scraper: {
        delayMin: parseInt(process.env.SCRAPE_DELAY_MIN || '5000', 10),
        delayMax: parseInt(process.env.SCRAPE_DELAY_MAX || '10000', 10),
        batchSize: parseInt(process.env.BATCH_SIZE || '50', 10),
        batchCooldown: parseInt(process.env.BATCH_COOLDOWN || '60000', 10),
    },

    database: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/gfinance',
    },

    googleFinance: {
        baseUrl: 'https://www.google.com/finance/quote',
        exchange: 'IDX',
    },
};

export const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
];

export function getRandomUserAgent(): string {
    return userAgents[Math.floor(Math.random() * userAgents.length)];
}

export function getRandomDelay(): number {
    const { delayMin, delayMax } = config.scraper;
    return Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
}
