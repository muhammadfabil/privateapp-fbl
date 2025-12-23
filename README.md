# gfinance-scrapper

Personal API untuk scraping data saham syariah Indonesia (ISSI) dari Google Finance.

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium

# Start development server
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stocks` | List all stocks (paginated) |
| GET | `/api/stocks/:symbol` | Get single stock |
| GET | `/api/stocks/search?q=` | Search stocks |
| GET | `/api/stats` | Scraping statistics |
| POST | `/api/scrape/trigger` | Manual scrape |
| POST | `/api/scheduler/start` | Start hourly scheduler |
| POST | `/api/scheduler/stop` | Stop scheduler |
| GET | `/api/logs` | Scrape logs |

## Usage

1. Start the server: `npm run dev`
2. Trigger initial scrape: `curl -X POST http://localhost:3000/api/scrape/trigger`
3. View stocks: `curl http://localhost:3000/api/stocks`

## Configuration

Edit `.env` file:

```
PORT=3000
SCRAPE_DELAY_MIN=5000    # 5 seconds min delay
SCRAPE_DELAY_MAX=10000   # 10 seconds max delay
BATCH_SIZE=50            # Stocks per batch
BATCH_COOLDOWN=60000     # 60 seconds between batches
```

## Data Source

- **ISSI List**: IDX (Indonesia Stock Exchange)
- **Price Data**: Google Finance
- **Update**: Hourly via scheduler

## License

MIT
