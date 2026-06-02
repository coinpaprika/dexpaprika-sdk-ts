import { PaginatedResponse, PoolPaginatedResponse } from './base';
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

// Pool from the filter endpoint (/networks/{id}/pools/filter).
// Unlike the list endpoint, the filter endpoint returns timeframe-split volume
// (volume_usd_24h/_7d/_30d) and liquidity_usd, and no flat volume_usd.
export interface FilteredPool {
  id: string;
  dex_id: string;
  dex_name: string;
  chain: string;
  tokens: Token[];
  created_at?: string;
  created_at_block_number?: number;
  transactions?: number;
  price_usd?: number;
  volume_usd_24h?: number;
  volume_usd_7d?: number;
  volume_usd_30d?: number;
  liquidity_usd?: number;
  last_price_change_usd_5m?: number | null;
  last_price_change_usd_1h?: number | null;
  last_price_change_usd_24h?: number | null;
  fee?: number | null;
}

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
   * Amount of first token.
   */
  amount_0: string | number;
  
  /**
   * Amount of second token.
   */
  amount_1: string | number;
  
  /**
   * Block number of the transaction.
   */
  created_at_block_number: number;
}

/**
 * Response containing a list of transactions.
 */
export interface TransactionsResponse extends PaginatedResponse<Transaction> {
  /**
   * List of transactions.
   */
  transactions: Transaction[];
} 