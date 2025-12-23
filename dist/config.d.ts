import 'dotenv/config';
export declare const config: {
    port: number;
    nodeEnv: string;
    scraper: {
        delayMin: number;
        delayMax: number;
        batchSize: number;
        batchCooldown: number;
    };
    database: {
        url: string;
    };
    googleFinance: {
        baseUrl: string;
        exchange: string;
    };
};
export declare const userAgents: string[];
export declare function getRandomUserAgent(): string;
export declare function getRandomDelay(): number;
//# sourceMappingURL=config.d.ts.map