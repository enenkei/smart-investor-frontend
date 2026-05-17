# Technical Design: Smart Investor Income Screener
**Tech Stack:** Next.js (App Router), Tailwind CSS, Shadcn/UI, Lucide Icons, Recharts.
**Target Goal:** A long-term investment dashboard focused on identifying tax-efficient, high-yield, and oversold ETFs.

---

## 1. Global Layout Architecture
- **Sidebar (Left):** Navigation links (Screener, Market News, Portfolio, Macro Trends).
- **Header (Top):** - Real-time "Ticker Tape" for benchmarks: S&P 500, Nasdaq-100, DXY, and VIX.
  - Search bar with command palette (Ctrl+K) for quick ticker lookup.
  - "Last Sync" indicator showing when the PostgreSQL database was last updated from Yahoo Finance.

---

## 2. Page: ETF Screener (Main View)

### A. Dynamic Filter Sidebar (Left-aligned)
Interactive controls that drive the `POST` or `GET` requests to the PostgreSQL:
- **Yield Range Slider:** `Min Annual Dividend Yield %` (0% to 15%+).
- **RSI Threshold Slider:** `Max RSI` (Default < 70, target < 40 for value).
- **Cost Cap:** `Max Expense Ratio` (Input field, e.g., 0.50%).
- **Asset Class Filter:** Multi-select chips (Equity, Fixed Income, Commodities, Specialty).

### B. Visualization Layer (Top Section)
- **Yield vs. Expense Scatter Plot:** 
- **X-Axis:** Expense Ratio.
- **Y-Axis:** Dividend Yield.
- **Bubble Color:** Based on RSI (Emerald for <35, Zinc for 35-65, Rose for >65).
- **Function:** Clicking a bubble highlights that row in the data table.

### C. The "Intel" Data Table (Bottom Section)
High-density grid using `TanStack Table` with the following columns:
1. **Symbol:** Bold text with small company logo (if available).
2. **Name:** Full ETF name (truncated with ellipsis).
3. **Yield:** Formatted as `0.00%`.
4. **RSI:** Color-coded badge (e.g., `< 30` is glowing emerald).
5. **52W Range:** A visual horizontal bar showing where current price sits between Low and High.
6. **Tax Form:** Badge showing '1099' or 'K-1'.
7. **Expense Ratio:** Formatted as percentage.

## 3. Page: News Feed (Infinite Scroll or Pagination)

### A. Page Header: The Market Pulse
This section provides an immediate "vibe check" of the market before the user digs into the headlines.

- **Sentiment Gauge:** - A semi-circle "Speedometer" chart (using `Recharts` or `Nivo`).
  - **Data:** Average of `overall_sentiment_score` from the last 100 `market_news` entries.
  - **Range:** -1.0 (Extreme Bearish/Red) to +1.0 (Extreme Bullish/Green).
- **Benchmark Sparklines:**
  - 3-4 mini line charts for **SPX**, **NDX**, **RUT**, and **DXY**.
  - **Logic:** Show the 24-hour % change. This tells the user if news is breaking during a "Risk-On" or "Risk-Off" session.

---

## B. Main Content: Intel News Feed
A high-density feed that emphasizes "Ticker Sentiment" over simple titles.

- **Card Layout:**
  - **Top Row:** Source name (e.g., "Reuters") + `source_domain` + `time_published`.
  - **Title:** Bold `title` linked to `url`.
  - **Intel Footer:**
    - **Sentiment Pill:** A colored badge showing `overall_sentiment_label`.
    - **Ticker Chips:** Small badges extracted from `ticker_sentiment` JSONB. (e.g., `$AAPL`, `$JEPQ`). Clicking these filters the feed.
    - **Relevance Score:** A small percentage showing how relevant the article is to the tagged tickers.

---

## C. Contextual Sidebar: "The Macro Link"
This sidebar bridges the `economic_indicator` table with the news.

- **Macro Sparklines:**
  - Vertical stack of small charts for **CPI**, **GDP**, and **Commodities**.
  - **Action:** If a user hovers over a news article with the topic "Inflation," the CPI sparkline should glow or animate to show the historical context.
- **RSS Scout Dashboard:**
  - A small status list of the `rss_feed` table.
  - **Indicator:** Green/Red dot for `is_active`.
  - **Stat:** "Last updated [x] minutes ago."

---

## D. Component: Ticker Detail Panel (Slide-over / Sheet)
Triggered by clicking a row in the table. Provides deep-dive context:
- **Performance Summary:** 1W, 1M, 1Y, and 3Y percentage changes.
- **Fundamental Radar Chart:** 5-axis chart showing: *Yield, Expense (Inv), Volatility (Inv), Liquidity, and Dividend Growth.*
- **RSS Intel Feed:** A list of the latest 3-5 news headlines filtered for that specific ticker.
- **Direct Actions:** "Add to Watchlist" or "View in Yahoo Finance" link.

---

## E. Page: Macro & Benchmark Overlay
- **Benchmark Sparklines:** Small, simplified line charts for SPX, NDX, and RUT (Russell) to show 24-hour trends.
- **The "Economic Pulse" Modal:** A detailed view containing:
  - **CPI vs. GDP Overlay:** A dual-axis line chart to visualize "Real Growth."
  - **Commodity Heat:** A trend line of the Bloomberg Commodity Index (BCOM) to track inflation pressure.
- **Relative Strength Chart:** A single multi-line chart comparing the % performance of the user's "Hunt" results against the S&P 500.
---

- **Component:** `SentimentGauge` - Visualizes the mean of `overall_sentiment_score`.
- **Component:** `HotTickers` - Horizontal scroll of tickers with the highest frequency in recent `ticker_sentiment` JSON blobs.

## 4. API & Integration Requirements
The frontend must expect the following JSON structures:

### Ticker List Schema
```json
[
  {
    "symbol": "JEPQ",
    "name": "JPMorgan Nasdaq Equity Premium Income ETF",
    "yield": 9.2,
    "rsi": 38.5,
    "expense_ratio": 0.35,
    "tax_form": "1099",
    "price_vs_52w": 0.45 
  }
]