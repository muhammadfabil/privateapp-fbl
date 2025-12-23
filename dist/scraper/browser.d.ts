import { Browser, Page, BrowserContext } from 'playwright';
export declare function initBrowser(): Promise<Browser>;
export declare function getNewContext(): Promise<BrowserContext>;
export declare function getNewPage(): Promise<Page>;
export declare function closeBrowser(): Promise<void>;
export declare function delay(ms?: number): Promise<void>;
//# sourceMappingURL=browser.d.ts.map