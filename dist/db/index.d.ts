import { Pool } from 'pg';
import * as schema from './schema.js';
export declare const db: import("drizzle-orm/node-postgres").NodePgDatabase<typeof schema> & {
    $client: Pool;
};
export declare function initializeDatabase(): Promise<void>;
//# sourceMappingURL=index.d.ts.map