import * as cheerio from 'cheerio';
import type {
    Stock,
    PriceHistory,
    IncomeStatement,
    BalanceSheet,
    CashFlow,
    StockNews,
    CompleteStockData
} from '../types/stock.js';

/**
 * Parse Google Finance stock page HTML and extract ALL data
 */
export function parseAllData(html: string, symbol: string): CompleteStockData {
    // Extract embedded data from AF_initDataCallback scripts
    const embeddedData = extractEmbeddedData(html);

    console.log(`[Parser] Found ${Object.keys(embeddedData).length} data keys`);

    return {
        overview: parseStockPage(html, symbol),
        priceHistory: parsePriceHistory(embeddedData, symbol),
        incomeStatements: parseIncomeStatements(embeddedData, symbol),
        balanceSheets: parseBalanceSheets(embeddedData, symbol),
        cashFlows: parseCashFlows(embeddedData, symbol),
        news: parseNews(embeddedData, symbol),
    };
}

/**
 * Extract embedded data from AF_initDataCallback scripts
 */
function extractEmbeddedData(html: string): Record<string, any> {
    const data: Record<string, any> = {};

    // Match AF_initDataCallback patterns
    const regex = /AF_initDataCallback\s*\(\s*\{[\s\S]*?key:\s*'([^']+)'[\s\S]*?data:\s*([\s\S]*?),\s*sideChannel:\s*\{\}\s*\}\s*\)\s*;/g;

    let match;
    while ((match = regex.exec(html)) !== null) {
        const key = match[1];
        const dataStr = match[2].trim();

        try {
            const parsed = (new Function(`return ${dataStr}`))();
            data[key] = parsed;
        } catch (e) {
            data[key] = dataStr;
        }
    }

    return data;
}

/**
 * Parse price history from embedded data
 * Data path: data[0][0][3][0][1] for daily prices
 * Each point: [[Year,Month,Day,Hour,...], [Close,Change,ChangePercent,...], Volume]
 */
function parsePriceHistory(embeddedData: Record<string, any>, symbol: string): PriceHistory[] {
    const history: PriceHistory[] = [];

    // Try ds:11 for daily data, ds:10 for intraday
    const priceData = embeddedData['ds:11'] || embeddedData['ds:10'];

    if (!priceData) {
        console.log('[Parser] No price data found in ds:10 or ds:11');
        return history;
    }

    try {
        // Navigate to the price array at data[0][0][3][X][1]
        // X could be 0 or another index depending on the data
        let pricePoints: any[] | null = null;

        if (priceData[0]?.[0]?.[3]) {
            const dataItems = priceData[0][0][3];

            // Find the array with price points (usually item[1] is an array with length > 10)
            for (const item of dataItems) {
                if (item && Array.isArray(item[1]) && item[1].length > 5) {
                    pricePoints = item[1];
                    break;
                }
            }
        }

        if (!pricePoints) {
            console.log('[Parser] Could not find price points in expected path');
            return history;
        }

        console.log(`[Parser] Found ${pricePoints.length} price points`);

        for (const point of pricePoints) {
            if (!Array.isArray(point) || point.length < 2) continue;

            const dateInfo = point[0]; // [Year, Month, Day, Hour, ...]
            const priceInfo = point[1]; // [Close, Change, ChangePercent, ...]
            const volume = point[2]; // Volume

            if (!Array.isArray(dateInfo) || dateInfo.length < 3) continue;

            const [year, month, day] = dateInfo;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const close = Array.isArray(priceInfo) ? priceInfo[0] : null;
            const change = Array.isArray(priceInfo) && priceInfo.length > 1 ? priceInfo[1] : null;
            const changePercent = Array.isArray(priceInfo) && priceInfo.length > 2 ? priceInfo[2] : null;

            // Avoid duplicates
            if (!history.find(h => h.date === dateStr)) {
                history.push({
                    symbol,
                    date: dateStr,
                    open: null,
                    high: null,
                    low: null,
                    close: typeof close === 'number' ? close : null,
                    volume: volume != null ? String(volume) : null,
                    change: typeof change === 'number' ? change : null,
                    changePercent: typeof changePercent === 'number' ? changePercent * 100 : null, // Convert to percentage
                });
            }
        }

    } catch (e) {
        console.error(`[Parser] Error parsing price history:`, e);
    }

    return history;
}

/**
 * Parse income statements from ds:13 financial data
 */
function parseIncomeStatements(embeddedData: Record<string, any>, symbol: string): IncomeStatement[] {
    const statements: IncomeStatement[] = [];
    const financialData = embeddedData['ds:13'];

    if (!financialData) {
        return statements;
    }

    // Financial parsing will require more analysis of the exact structure
    // For now, return empty - can be refined later
    return statements;
}

/**
 * Parse balance sheets from embedded financial data
 */
function parseBalanceSheets(embeddedData: Record<string, any>, symbol: string): BalanceSheet[] {
    return [];
}

/**
 * Parse cash flows from embedded financial data
 */
function parseCashFlows(embeddedData: Record<string, any>, symbol: string): CashFlow[] {
    return [];
}

/**
 * Parse news from embedded data (ds:3 and ds:5)
 */
function parseNews(embeddedData: Record<string, any>, symbol: string): StockNews[] {
    const news: StockNews[] = [];

    const newsDataSources = [embeddedData['ds:5'], embeddedData['ds:3']];

    for (const newsData of newsDataSources) {
        if (!newsData || !Array.isArray(newsData)) continue;

        try {
            const extractNews = (arr: any, depth = 0): void => {
                if (depth > 10 || !Array.isArray(arr)) return;

                for (const item of arr) {
                    if (Array.isArray(item)) {
                        let headline: string | null = null;
                        let source: string | null = null;
                        let url: string | null = null;
                        let thumbnail: string | null = null;

                        for (const field of item) {
                            if (typeof field === 'string') {
                                if (field.startsWith('http') && (field.includes('news') || field.includes('article'))) {
                                    url = field;
                                } else if (field.includes('googleusercontent') || field.includes('.jpg') || field.includes('.png')) {
                                    thumbnail = field;
                                } else if (field.length > 20 && !headline) {
                                    headline = field;
                                } else if (field.length > 2 && field.length < 50 && !source && !field.startsWith('http')) {
                                    source = field;
                                }
                            }
                        }

                        if (headline && !news.find(n => n.headline === headline)) {
                            news.push({
                                symbol,
                                headline,
                                source,
                                url,
                                thumbnailUrl: thumbnail,
                                publishedAt: null,
                            });
                        }

                        extractNews(item, depth + 1);
                    }
                }
            };

            extractNews(newsData);

        } catch (e) {
            console.error(`[Parser] Error parsing news:`, e);
        }
    }

    console.log(`[Parser] Found ${news.length} news items`);
    return news;
}

/**
 * Parse Google Finance stock page HTML (for overview data)
 */
export function parseStockPage(html: string, symbol: string): Partial<Stock> {
    const $ = cheerio.load(html);

    const result: Partial<Stock> = {
        symbol,
        lastUpdated: new Date(),
        scrapeStatus: 'success',
    };

    try {
        const pageTitle = $('title').text();
        const nameMatch = pageTitle.match(/^([^|]+)/);
        if (nameMatch) {
            result.name = nameMatch[1].trim().replace(/\s+Price.*$/, '').trim();
        }

        const priceText = $('[data-last-price]').attr('data-last-price')
            || $('div.YMlKec.fxKbKc').first().text()
            || $('div[class*="YMlKec"]').first().text();

        if (priceText) {
            result.price = parseNumber(priceText);
        }

        const changeElements = $('div[class*="JwB6zf"], span[class*="P2Luy"]');
        changeElements.each((_, el) => {
            const text = $(el).text().trim();
            if (text.includes('%')) {
                result.changePercent = parsePercentage(text);
            } else if (text.match(/^[+-]?[\d,.]+$/)) {
                result.change = parseNumber(text);
            }
        });

        $('div.P6K39c, div.gyFHrc').each((_, row) => {
            const labelEl = $(row).find('div.mfs7Fc, div.yNnsfe').first();
            const valueEl = $(row).find('div.P6K39c, div.YMlKec').last();

            if (!labelEl.length || !valueEl.length) return;

            const label = labelEl.text().toLowerCase().trim();
            const value = valueEl.text().trim();

            if (label.includes('market cap')) {
                result.marketCap = value;
            } else if (label.includes('p/e ratio') || label.includes('pe ratio')) {
                result.peRatio = parseNumber(value);
            } else if (label.includes('dividend yield')) {
                result.dividendYield = parsePercentage(value);
            } else if (label.includes('average volume') || label.includes('avg vol')) {
                result.avgVolume = value;
            } else if (label.includes('volume')) {
                result.volume = value;
            } else if (label.includes('previous close')) {
                result.previousClose = parseNumber(value);
            }
        });

        const dayRangeText = findTextByLabel($, ['day range', "day's range", 'today']);
        if (dayRangeText) {
            const range = parseRange(dayRangeText);
            if (range) {
                result.dayRangeLow = range.low;
                result.dayRangeHigh = range.high;
            }
        }

        const yearRangeText = findTextByLabel($, ['year range', '52 week', '52-week']);
        if (yearRangeText) {
            const range = parseRange(yearRangeText);
            if (range) {
                result.yearRangeLow = range.low;
                result.yearRangeHigh = range.high;
            }
        }

    } catch (error) {
        console.error(`Error parsing stock ${symbol}:`, error);
        result.scrapeStatus = 'error';
        result.errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    }

    return result;
}

function findTextByLabel($: cheerio.CheerioAPI, labels: string[]): string | null {
    let found: string | null = null;

    $('div, span, td').each((_, el) => {
        const $el = $(el);
        const text = $el.text().toLowerCase();

        for (const label of labels) {
            if (text.includes(label)) {
                const parent = $el.parent();
                const siblings = parent.children();
                const siblingTexts: string[] = [];

                siblings.each((_, sib) => {
                    const sibText = $(sib).text().trim();
                    if (sibText && !labels.some(l => sibText.toLowerCase().includes(l))) {
                        siblingTexts.push(sibText);
                    }
                });

                if (siblingTexts.length > 0) {
                    found = siblingTexts.join(' ');
                    return false;
                }
            }
        }

        if (found) return false;
    });

    return found;
}

function parseNumber(text: string): number | null {
    if (!text) return null;

    const cleaned = text
        .replace(/[Rp$€£¥,\s]/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.')
        .trim();

    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
}

function parsePercentage(text: string): number | null {
    if (!text) return null;

    const match = text.match(/([+-]?[\d.,]+)\s*%/);
    if (match) {
        return parseNumber(match[1]);
    }
    return null;
}

function parseRange(text: string): { low: number; high: number } | null {
    if (!text) return null;

    const numbers = text.match(/[\d.,]+/g);
    if (numbers && numbers.length >= 2) {
        const low = parseNumber(numbers[0]);
        const high = parseNumber(numbers[1]);
        if (low !== null && high !== null) {
            return { low, high };
        }
    }
    return null;
}
