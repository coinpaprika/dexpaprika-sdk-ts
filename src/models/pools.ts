import { PageInfo, PoolPaginatedResponse } from './base';
import { TokenSummary } from './tokens';

// basic token info
export interface Token {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  decimals: number;
  added_at: string;
  fdv?: number; // fully diluted value
  total_supply?: number;
  description?: string;
  website?: string;
  explorer?: string;
  last_updated?: string; // When the token data was last updated
  summary?: TokenSummary; // Added summary field from the updated OpenAPI spec
}

// pool data
export interface Pool {
  id: string;
  dex_id: string;
  dex_name: string;
  chain: string;
  volume_usd: number;
  created_at: string;
  created_at_block_number: number;
  transactions: number;
  price_usd: number;
  last_price_change_usd_5m?: number | null;
  last_price_change_usd_1h?: number | null;
  last_price_change_usd_24h?: number | null;
  fee?: number | null;
  tokens: Token[];
  volume_usd_7d?: number;
  liquidity_usd?: number;
}

// Token reference embedded in a pools/search result. By default the endpoint
// returns only id/chain/has_image; name, symbol and decimals are populated when
// the pool is fetched with detailed token info.
export interface PoolTokenRef {
  id: string;
  chain?: string;
  has_image?: boolean;
  name?: string;
  symbol?: string;
  decimals?: number;
}

// Pool item from the unified search endpoint (/networks/{id}/pools/search).
// Volume is timeframe-split (volume_usd_24h/_7d/_30d), price changes are
// percentages, and the transaction count is transactions_24h.
export interface SearchPool {
  id: string; // pool address
  chain: string;
  dex_id: string;
  dex_name: string;
  fee?: number | null;
  created_at: string;
  created_at_block_number: number;
  volume_usd_24h?: number;
  volume_usd_7d?: number;
  volume_usd_30d?: number;
  liquidity_usd?: number;
  transactions_24h?: number;
  price_usd?: number;
  price_change_percentage_5m?: number | null;
  price_change_percentage_1h?: number | null;
  price_change_percentage_6h?: number | null;
  price_change_percentage_24h?: number | null;
  tokens: PoolTokenRef[];
}

// Back-compat alias for the previous pools/filter item type.
export type FilteredPool = SearchPool;

// alias for backward compat
export type PoolsResponse = PoolPaginatedResponse;

// metrics for time periods
export interface TimeIntervalMetrics {
  last_price_usd_change: number;
  volume_usd: number;
  buy_usd: number;
  sell_usd: number;
  sells: number;
  buys: number;
  txns: number;
}

// detailed pool info
export interface PoolDetails {
  id: string;
  created_at_block_number: number;
  chain: string;
  created_at: string;
  factory_id: string;
  dex_id: string;
  dex_name: string;
  tokens: Token[];
  last_price: number;
  last_price_usd: number;
  fee?: number;
  price_time: string;
  '24h': TimeIntervalMetrics;
  '6h'?: TimeIntervalMetrics;
  '1h'?: TimeIntervalMetrics;
  '30m'?: TimeIntervalMetrics;
  '15m'?: TimeIntervalMetrics;
  '5m'?: TimeIntervalMetrics;
}

/**
 * Open-High-Low-Close-Volume data point.
 */
export interface OHLCVRecord {
  /**
   * Opening timestamp.
   */
  time_open: string;
  
  /**
   * Closing timestamp.
   */
  time_close: string;
  
  /**
   * Opening price.
   */
  open: number;
  
  /**
   * Highest price during the period.
   */
  high: number;
  
  /**
   * Lowest price during the period.
   */
  low: number;
  
  /**
   * Closing price.
   */
  close: number;
  
  /**
   * Trading volume during the period.
   */
  volume: number;
}

/**
 * Pool transaction information.
 */
export interface Transaction {
  /**
   * Transaction identifier.
   */
  id: string;
  
  /**
   * Log index within the block.
   */
  log_index: number;
  
  /**
   * Transaction index within the block.
   */
  transaction_index: number;
  
  /**
   * Pool identifier.
   */
  pool_id: string;
  
  /**
   * Sender address.
   */
  sender: string;
  
  /**
   * Recipient address or ID.
   */
  recipient: string | number;
  
  /**
   * First token address or symbol.
   */
  token_0: string;
  
  /**
   * Second token address or symbol.
   */
  token_1: string;
  
  /**
   * Amount of first token in its smallest unit, signed. The API sends a JSON
   * integer that can exceed Number.MAX_SAFE_INTEGER, so the parsed value may be
   * rounded. Use volume_0 for display.
   */
  amount_0: string | number;
  
  /**
   * Amount of second token in its smallest unit, signed. Same precision caveat
   * as amount_0; use volume_1 for display.
   */
  amount_1: string | number;
  
  /**
   * Block number of the transaction.
   */
  created_at_block_number: number;

  /**
   * Hash of the block the transaction is in.
   */
  created_at_block_hash?: string;

  /**
   * When the transaction happened, RFC3339 in UTC (e.g. "2026-09-28T13:07:11Z").
   */
  created_at?: string;

  /**
   * Network identifier (e.g. "ethereum").
   */
  chain?: string;

  /**
   * Factory contract that created the pool.
   */
  factory_id?: string;

  /**
   * Symbol of the first token (e.g. "WETH").
   */
  token_0_symbol?: string;

  /**
   * Symbol of the second token (e.g. "USDC").
   */
  token_1_symbol?: string;

  /**
   * Amount of first token, decimal-adjusted and unsigned.
   */
  volume_0?: number;

  /**
   * Amount of second token, decimal-adjusted and unsigned.
   */
  volume_1?: number;

  /**
   * Price of the first token in units of the second.
   */
  price_0?: number;

  /**
   * Price of the second token in units of the first.
   */
  price_1?: number;

  /**
   * Price of the first token in USD.
   */
  price_0_usd?: number;

  /**
   * Price of the second token in USD.
   */
  price_1_usd?: number;

  /**
   * Whether the block is on the canonical chain.
   */
  canonical_chain?: boolean;
}

/**
 * Response of the pool transactions endpoint.
 */
export interface TransactionsResponse {
  /**
   * List of transactions, newest first.
   */
  transactions: Transaction[];

  /**
   * Page-based pagination details.
   */
  page_info: PageInfo;
} 