import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  doublePrecision,
  timestamp,
  date,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('USER').notNull(),
  resetToken: varchar('resetToken', { length: 255 }).unique(),
  resetTokenExp: timestamp('resetTokenExp'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  avatarUrl: text('avatarUrl'),
  fullName: varchar('fullName', { length: 255 }),
  pseudo: varchar('pseudo', { length: 255 }),
  sessionId: varchar('sessionId', { length: 255 }).unique(),
  isActive: boolean('is_active').default(false),
});

// 2. System Settings
export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  value: text('value').notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

// 3. Fundamental Scores
export const fundamentalScores = pgTable(
  'fundamental_scores',
  {
    ticker: varchar('ticker', { length: 20 }).primaryKey(),
    sector: varchar('sector', { length: 100 }),
    pe_ratio: doublePrecision('pe_ratio'),
    revenue_growth: doublePrecision('revenue_growth'),
    dividend_yield: doublePrecision('dividend_yield'),
    payout_ratio: doublePrecision('payout_ratio'),
    beta: doublePrecision('beta'),
    market_cap: doublePrecision('market_cap'),
    free_cash_flow: doublePrecision('free_cash_flow'),
    roe: doublePrecision('roe'),
    de_ratio: doublePrecision('de_ratio'),
    dividend_cagr_5y: doublePrecision('dividend_cagr_5y'),
    eps_growth_5y: doublePrecision('eps_growth_5y'),
    last_updated: varchar('last_updated', { length: 50 }),
    operating_margins: doublePrecision('operating_margins'),
    ebitda: doublePrecision('ebitda'),
    current_ratio: doublePrecision('current_ratio'),
    name: varchar('name', { length: 255 }),
    total_return: doublePrecision('total_return'),
    fcf_yield: doublePrecision('fcf_yield'),
    quality_metric: doublePrecision('quality_metric'),
    safety_metric: doublePrecision('safety_metric'),
    growth_score: doublePrecision('growth_score'),
    income_score: doublePrecision('income_score'),
    quality_score: doublePrecision('quality_score'),
    dividend_growth_score: doublePrecision('dividend_growth_score'),
    rsi: doublePrecision('rsi'),
    adaptive_total_score: doublePrecision('adaptive_total_score'),
    updated_at: timestamp('updated_at'),
    current_price: doublePrecision('current_price'),
    prev_close: doublePrecision('prev_close'),
    one_day_change: doublePrecision('one_day_change'),
    price_history: jsonb('price_history'),
  },
  (table) => [
    uniqueIndex('ticker_sector_unique').on(table.ticker, table.sector),
    index('idx_fund_scores_div_growth').on(table.dividend_growth_score),
    index('idx_fund_scores_growth').on(table.growth_score),
    index('idx_fund_scores_income').on(table.income_score),
    index('idx_fund_scores_quality').on(table.quality_score),
    index('idx_fund_scores_sector').on(table.sector),
    index('idx_fund_scores_ticker').on(table.ticker),
    index('idx_fund_scores_tot_score').on(table.adaptive_total_score),
  ]
);

// 4. ETF Metadata
export const etfMetadata = pgTable('etf_metadata', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol', { length: 20 }).notNull().unique(),
  etf_name: varchar('etf_name', { length: 255 }).notNull(),
  asset_class: varchar('asset_class', { length: 100 }),
  etf_database_category: varchar('etf_database_category', { length: 100 }),
  inception: timestamp('inception'),
  total_assets: doublePrecision('total_assets'),
  avg_daily_volume: doublePrecision('avg_daily_volume'),
  previous_closing_price: doublePrecision('previous_closing_price'),
  ytd_price_change: doublePrecision('ytd_price_change'),
  one_day_change: doublePrecision('one_day_change'),
  one_week_perf: doublePrecision('one_week_perf'),
  one_month_perf: doublePrecision('one_month_perf'),
  one_year_perf: doublePrecision('one_year_perf'),
  three_year_perf: doublePrecision('three_year_perf'),
  five_year_perf: doublePrecision('five_year_perf'),
  ytd_ff: doublePrecision('ytd_ff'),
  one_week_ff: doublePrecision('one_week_ff'),
  four_week_ff: doublePrecision('four_week_ff'),
  one_year_ff: doublePrecision('one_year_ff'),
  three_year_ff: doublePrecision('three_year_ff'),
  five_year_ff: doublePrecision('five_year_ff'),
  is_inverse: boolean('is_inverse').default(false),
  is_leveraged: boolean('is_leveraged').default(false),
  expense_ratio: doublePrecision('expense_ratio'),
  commission_free: boolean('commission_free'),
  num_of_holdings: integer('num_of_holdings'),
  pct_in_top_10: doublePrecision('pct_in_top_10'),
  annual_dividend_rate: doublePrecision('annual_dividend_rate'),
  dividend_date: timestamp('dividend_date'),
  last_dividend_amount: doublePrecision('last_dividend_amount'),
  annual_dividend_yield_pct: doublePrecision('annual_dividend_yield_pct'),
  pe_ratio: doublePrecision('pe_ratio'),
  beta: doublePrecision('beta'),
  rsi: doublePrecision('rsi'),
  st_cap_gain_rate: doublePrecision('st_cap_gain_rate'),
  lt_cap_gain_rate: doublePrecision('lt_cap_gain_rate'),
  tax_form: varchar('tax_form', { length: 50 }),
  lower_bollinger: doublePrecision('lower_bollinger'),
  upper_bollinger: doublePrecision('upper_bollinger'),
  support_1: doublePrecision('support_1'),
  resistance_1: doublePrecision('resistance_1'),
  liquidity_rating: varchar('liquidity_rating', { length: 50 }),
  expenses_rating: varchar('expenses_rating', { length: 50 }),
  returns_rating: varchar('returns_rating', { length: 50 }),
  volatility_rating: varchar('volatility_rating', { length: 50 }),
  dividend_rating: varchar('dividend_rating', { length: 50 }),
  concentration_rating: varchar('concentration_rating', { length: 50 }),
  esg_score: doublePrecision('esg_score'),
  esg_peer_percentile: doublePrecision('esg_peer_percentile'),
  esg_global_percentile: doublePrecision('esg_global_percentile'),
  carbon_intensity: doublePrecision('carbon_intensity'),
  sri_exclusion_pct: doublePrecision('sri_exclusion_pct'),
  sustainable_impact_solutions_pct: doublePrecision('sustainable_impact_solutions_pct'),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 5. ETF Scores
export const etfScores = pgTable(
  'etf_scores',
  {
    symbol: varchar('symbol', { length: 20 })
      .primaryKey()
      .references(() => etfMetadata.symbol, { onDelete: 'cascade' }),
    etf_name: varchar('etf_name', { length: 255 }),
    asset_class: varchar('asset_class', { length: 100 }),
    growth_score: doublePrecision('growth_score').default(0.5),
    income_score: doublePrecision('income_score').default(0.5),
    efficiency_score: doublePrecision('efficiency_score').default(0.5),
    safety_score: doublePrecision('safety_score').default(0.5),
    balanced_score: doublePrecision('balanced_score').default(0.5),
    rsi: doublePrecision('rsi'),
    total_assets: doublePrecision('total_assets'),
    expense_ratio: doublePrecision('expense_ratio'),
    annual_dividend_yield_pct: doublePrecision('annual_dividend_yield_pct'),
    beta: doublePrecision('beta'),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_etf_scores_balanced').on(table.balanced_score),
    index('idx_etf_scores_efficiency').on(table.efficiency_score),
    index('idx_etf_scores_growth').on(table.growth_score),
    index('idx_etf_scores_income').on(table.income_score),
    index('idx_etf_scores_safety').on(table.safety_score),
  ]
);

// 6. ETF Categories
export const etfCategories = pgTable('etf_categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  category_type: varchar('category_type', { length: 50 }).default('Theme'),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow(),
});

// 7. ETF Category Mappings
export const etfCategoryMappings = pgTable(
  'etf_category_mappings',
  {
    symbol: varchar('symbol', { length: 20 })
      .notNull()
      .references(() => etfMetadata.symbol, { onDelete: 'cascade' }),
    category_id: integer('category_id')
      .notNull()
      .references(() => etfCategories.id, { onDelete: 'cascade' }),
    is_primary: boolean('is_primary').default(false),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.symbol, table.category_id] }),
    index('idx_etf_cat_map_category').on(table.category_id),
    index('idx_etf_cat_map_symbol').on(table.symbol),
  ]
);

// 8. Market News
export const marketNews = pgTable('market_news', {
  url: text('url').primaryKey(),
  title: text('title').notNull(),
  summary: text('summary'),
  banner_image: text('banner_image'),
  source: varchar('source', { length: 255 }),
  source_domain: varchar('source_domain', { length: 255 }),
  category: varchar('category', { length: 100 }),
  time_published: timestamp('time_published'),
  fetched_at: timestamp('fetched_at').defaultNow(),
  overall_sentiment_score: doublePrecision('overall_sentiment_score'),
  overall_sentiment_label: varchar('overall_sentiment_label', { length: 50 }),
  authors: jsonb('authors'),
  topics: jsonb('topics'),
  ticker_sentiment: jsonb('ticker_sentiment'),
});

// 9. Tickers
export const tickers = pgTable('tickers', {
  symbol: varchar('symbol', { length: 20 }).primaryKey(),
  company_name: varchar('company_name', { length: 255 }),
  exchange: varchar('exchange', { length: 50 }),
});

// 10. Fundamentals
export const fundamentals = pgTable('fundamentals', {
  ticker: varchar('ticker', { length: 20 }).primaryKey(),
  sector: varchar('sector', { length: 100 }),
  pe_ratio: doublePrecision('pe_ratio'),
  revenue_growth: doublePrecision('revenue_growth'),
  dividend_yield: doublePrecision('dividend_yield'),
  payout_ratio: doublePrecision('payout_ratio'),
  beta: doublePrecision('beta'),
  market_cap: doublePrecision('market_cap'),
  free_cash_flow: doublePrecision('free_cash_flow'),
  roe: doublePrecision('roe'),
  de_ratio: doublePrecision('de_ratio'),
  dividend_cagr_5y: doublePrecision('dividend_cagr_5y'),
  eps_growth_5y: doublePrecision('eps_growth_5y'),
  last_updated: varchar('last_updated', { length: 50 }),
  operating_margins: doublePrecision('operating_margins'),
  ebitda: doublePrecision('ebitda'),
  current_ratio: doublePrecision('current_ratio'),
});

// 11. Insider Transactions
export const insiderTransactions = pgTable('insider_transactions', {
  id: serial('id').primaryKey(),
  ticker: varchar('ticker', { length: 20 }),
  executive: varchar('executive', { length: 255 }),
  position: varchar('position', { length: 255 }),
  date: varchar('date', { length: 50 }),
  transaction_type: varchar('transaction_type', { length: 100 }),
  shares_traded: varchar('shares_traded', { length: 50 }),
  price: varchar('price', { length: 50 }),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 12. Commodities
export const commodities = pgTable('commodities', {
  commodity: varchar('commodity', { length: 100 }).primaryKey(),
  name: varchar('name', { length: 255 }),
  interval: varchar('interval', { length: 50 }),
  data: jsonb('data'),
  last_updated: timestamp('last_updated').defaultNow(),
});

// 13. Index Data
export const indexData = pgTable('index_data', {
  symbol: varchar('symbol', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 255 }),
  data: jsonb('data'),
  last_updated: timestamp('last_updated').defaultNow(),
});

// 14. Portfolio Holdings
export const portfolioHoldings = pgTable(
  'portfolio_holdings',
  {
    id: serial('id').primaryKey(),
    cik: varchar('cik', { length: 50 }).notNull(),
    ticker: varchar('ticker', { length: 20 }).notNull(),
    cusip: varchar('cusip', { length: 50 }),
    shares_count: doublePrecision('shares_count'),
    position_value: doublePrecision('position_value'),
    percent_of_portfolio: doublePrecision('percent_of_portfolio'),
    report_date: timestamp('report_date').notNull(),
    filed_at: timestamp('filed_at'),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('idx_holdings_cik_date').on(table.cik, table.report_date),
  ]
);

// 15. Strategies
export const strategies = pgTable('strategies', {
  slug: varchar('slug', { length: 100 }).primaryKey(),
  display_name: varchar('display_name', { length: 255 }).notNull(),
  tickers: text('tickers').array().notNull(),
  weights: jsonb('weights').notNull(),
  expected_return: doublePrecision('expected_return').notNull(),
  expected_volatility: doublePrecision('expected_volatility').notNull(),
  mode: varchar('mode', { length: 50 }).notNull(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 16. Investor Directory
export const investorDirectory = pgTable('investor_directory', {
  cik: varchar('cik', { length: 50 }).primaryKey(),
  display_name: varchar('display_name', { length: 255 }),
  legal_name: varchar('legal_name', { length: 255 }),
  investor_type: varchar('investor_type', { length: 100 }).default('Institutional'),
  is_active: boolean('is_active').default(true),
  last_sync_date: timestamp('last_sync_date').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 17. User Portfolios
export const userPortfolios = pgTable(
  'user_portfolios',
  {
    id: serial('id').primaryKey(),
    owner_id: integer('owner_id').notNull(),
    owner_name: varchar('owner_name', { length: 255 }),
    name: varchar('name', { length: 255 }),
    updated_at: timestamp('updated_at').defaultNow(),
    projections: jsonb('projections').notNull(),
    metrics: jsonb('metrics').notNull(),
    annual_return: doublePrecision('annual_return'),
    volatility: doublePrecision('volatility'),
    sharpe_ratio: doublePrecision('sharpe_ratio'),
    max_drawdown: doublePrecision('max_drawdown'),
    empirical_beta: doublePrecision('empirical_beta'),
    diversification: doublePrecision('diversification'),
    rating: varchar('rating', { length: 50 }),
    performance_tracking: jsonb('performance_tracking'),
  },
  (table) => [
    uniqueIndex('owner_portfolio_name_unique').on(table.owner_id, table.name),
  ]
);

// 18. User Assets
export const userAssets = pgTable(
  'user_assets',
  {
    id: serial('id').primaryKey(),
    portfolio_id: integer('portfolio_id')
      .notNull()
      .references(() => userPortfolios.id, { onDelete: 'cascade' }),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    shares: doublePrecision('shares'),
    avg_cost_basis: doublePrecision('avg_cost_basis'),
    weight: doublePrecision('weight'),
    owner_id: integer('owner_id').notNull(),
    owner_name: varchar('owner_name', { length: 255 }),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('owner_portfolio_symbol_unique').on(
      table.owner_id,
      table.portfolio_id,
      table.symbol
    ),
  ]
);

// 19. Watchlists
export const watchlists = pgTable(
  'watchlists',
  {
    id: serial('id').primaryKey(),
    owner_id: integer('owner_id').notNull(),
    owner_name: varchar('owner_name', { length: 255 }),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    added_at: timestamp('added_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('owner_symbol_unique').on(table.owner_id, table.symbol),
  ]
);

// 20. Application Logs
export const applicationLogs = pgTable('application_logs', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').notNull(),
  level: varchar('level', { length: 50 }).notNull(),
  logger: varchar('logger', { length: 255 }).notNull(),
  message: text('message').notNull(),
});

// 21. Company Overviews
export const companyOverviews = pgTable('company_overviews', {
  ticker: varchar('ticker', { length: 20 }).primaryKey(),
  name: varchar('name', { length: 255 }),
  description: text('description'),
  sector: varchar('sector', { length: 100 }),
  industry: varchar('industry', { length: 100 }),
  moving_average_50: varchar('moving_average_50', { length: 50 }),
  moving_average_200: varchar('moving_average_200', { length: 50 }),
  dividend_per_share: varchar('dividend_per_share', { length: 50 }),
  dividend_yield: varchar('dividend_yield', { length: 50 }),
  updated_at: timestamp('updated_at').defaultNow(),
});

// 22. Economic Indicators
export const economicIndicators = pgTable('economic_indicators', {
  id: serial('id').primaryKey(),
  indicator: varchar('indicator', { length: 100 }).unique(),
  name: varchar('name', { length: 255 }),
  interval: varchar('interval', { length: 50 }),
  unit: varchar('unit', { length: 50 }),
  data: jsonb('data'),
  fetched_at: timestamp('fetched_at').defaultNow(),
});

// 23. RSS Feeds
export const rssFeeds = pgTable(
  'rss_feeds',
  {
    id: serial('id').primaryKey(),
    category: varchar('category', { length: 100 }),
    name: varchar('name', { length: 255 }),
    url: text('url'),
    last_updated: timestamp('last_updated'),
    retries: integer('retries').default(0),
    last_error: text('last_error'),
    last_error_at: timestamp('last_error_at'),
    is_active: boolean('is_active').default(true),
  },
  (table) => [
    uniqueIndex('category_name_unique').on(table.category, table.name),
  ]
);

// 24. RSS Items
export const rssItems = pgTable(
  'rss_items',
  {
    id: serial('id').primaryKey(),
    feed_id: integer('feed_id').references(() => rssFeeds.id, { onDelete: 'cascade' }),
    guid: text('guid'),
    title: text('title').notNull(),
    link: text('link').notNull(),
    summary: text('summary'),
    author: varchar('author', { length: 255 }),
    published_at: timestamp('published_at'),
    fetched_at: timestamp('fetched_at').defaultNow(),
  },
  (table) => [
    uniqueIndex('feed_guid_unique').on(table.feed_id, table.guid),
  ]
);

// 25. Ticker Historical Prices
export const tickerHistoricalPrices = pgTable(
  'ticker_historical_prices',
  {
    id: serial('id').primaryKey(),
    ticker: varchar('ticker', { length: 20 }).notNull(),
    date: date('date').notNull(),
    close: doublePrecision('close').notNull(),
  },
  (table) => [
    uniqueIndex('ticker_date_unique').on(table.ticker, table.date),
    index('idx_hist_prices_ticker_date').on(table.ticker, table.date),
    index('idx_historical_prices_date').on(table.date),
    index('idx_historical_prices_ticker').on(table.ticker),
  ]
);

// Relations
export const userPortfoliosRelations = relations(userPortfolios, ({ many }) => ({
  userAssets: many(userAssets),
}));

export const userAssetsRelations = relations(userAssets, ({ one }) => ({
  portfolio: one(userPortfolios, {
    fields: [userAssets.portfolio_id],
    references: [userPortfolios.id],
  }),
}));

export const etfMetadataRelations = relations(etfMetadata, ({ one, many }) => ({
  etfScores: one(etfScores, {
    fields: [etfMetadata.symbol],
    references: [etfScores.symbol],
  }),
  etfCategoryMappings: many(etfCategoryMappings),
}));

export const etfScoresRelations = relations(etfScores, ({ one }) => ({
  etfMetadata: one(etfMetadata, {
    fields: [etfScores.symbol],
    references: [etfMetadata.symbol],
  }),
}));

export const etfCategoriesRelations = relations(etfCategories, ({ many }) => ({
  mappings: many(etfCategoryMappings),
}));

export const etfCategoryMappingsRelations = relations(etfCategoryMappings, ({ one }) => ({
  metadata: one(etfMetadata, {
    fields: [etfCategoryMappings.symbol],
    references: [etfMetadata.symbol],
  }),
  category: one(etfCategories, {
    fields: [etfCategoryMappings.category_id],
    references: [etfCategories.id],
  }),
}));

export const rssFeedsRelations = relations(rssFeeds, ({ many }) => ({
  rssItems: many(rssItems),
}));

export const rssItemsRelations = relations(rssItems, ({ one }) => ({
  feed: one(rssFeeds, {
    fields: [rssItems.feed_id],
    references: [rssFeeds.id],
  }),
}));

// Inferred Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;

export type FundamentalScore = typeof fundamentalScores.$inferSelect;
export type EtfMetadata = typeof etfMetadata.$inferSelect;
export type EtfScore = typeof etfScores.$inferSelect;
export type MarketNews = typeof marketNews.$inferSelect;
export type Ticker = typeof tickers.$inferSelect;
export type Fundamental = typeof fundamentals.$inferSelect;
export type InsiderTransaction = typeof insiderTransactions.$inferSelect;
export type Commodity = typeof commodities.$inferSelect;
export type IndexData = typeof indexData.$inferSelect;
export type PortfolioHolding = typeof portfolioHoldings.$inferSelect;
export type Strategy = typeof strategies.$inferSelect;
export type InvestorDirectory = typeof investorDirectory.$inferSelect;
export type UserPortfolio = typeof userPortfolios.$inferSelect;
export type UserAsset = typeof userAssets.$inferSelect;
export type Watchlist = typeof watchlists.$inferSelect;
export type EconomicIndicator = typeof economicIndicators.$inferSelect;
export type RssFeed = typeof rssFeeds.$inferSelect;
export type RssItem = typeof rssItems.$inferSelect;

// Backwards compatibility type aliases matching existing Prisma client import names
export type strategies = Strategy;
export type user_assets = UserAsset;
export type investor_directory = InvestorDirectory;
export type user_portfolio = UserPortfolio & { userAssets?: UserAsset[] };
export type watchlist = Watchlist;
