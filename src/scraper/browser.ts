import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { config, getRandomUserAgent, getRandomDelay } from '../config.js';

let browser: Browser | null = null;
let context: BrowserContext | null = null;

export async function initBrowser(): Promise<Browser> {
    if (browser) return browser;

    console.log('Launching browser...');
    browser = await chromium.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
        ],
    });

    console.log('Browser launched successfully');
    return browser;
}

export async function getNewContext(): Promise<BrowserContext> {
    const b = await initBrowser();

    context = await b.newContext({
        userAgent: getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        timezoneId: 'Asia/Jakarta',
    });

    return context;
}

export async function getNewPage(): Promise<Page> {
    const ctx = await getNewContext();
    const page = await ctx.newPage();

    // Block unnecessary resources for faster loading
    await page.route('**/*', (route) => {
        const resourceType = route.request().resourceType();
        if (['image', 'font', 'media'].includes(resourceType)) {
            route.abort();
        } else {
            route.continue();
        }
    });

    return page;
}

export async function closeBrowser(): Promise<void> {
    if (context) {
        await context.close();
        context = null;
    }
    if (browser) {
        await browser.close();
        browser = null;
    }
    console.log('Browser closed');
}

export async function delay(ms?: number): Promise<void> {
    const waitTime = ms ?? getRandomDelay();
    console.log(`Waiting ${waitTime}ms...`);
    return new Promise(resolve => setTimeout(resolve, waitTime));
}
