/**
 * Common option types for API requests
 */

/**
 * Basic pagination options
 */
export interface PaginationOptions {
  /** Page number (starts at 0) */
  page?: number;
  /** Number of results per page */
  limit?: number;
}

/**
 * Options for endpoints that support sorting
 */
export interface SortOptions extends PaginationOptions {
  /** Sort direction */
  sort?: 'asc' | 'desc';
  /** Field to sort by */
  orderBy?: string;
}

/**
 * Options for pool listing endpoints
 */
export interface PoolListOptions extends SortOptions {
  // Add any pool-specific options here in the future
}

/**
 * Options for getting token pools
 */
export interface TokenPoolsOptions extends SortOptions {
  /** Optional second token address to filter for pairs */
  pairWith?: string;
}

/**
 * Options for pool details
 */
export interface PoolDetailsOptions {
  /** Whether to invert the price ratio */
  inversed?: boolean;
}

/**
 * Transaction listing options
 */
export interface TransactionOptions extends PaginationOptions {
  /** Cursor for paginated results */
  cursor?: string;
}

/**
 * OHLCV data options
 */
export interface OHLCVOptions {
  /** Start time (ISO date string or timestamp) */
  start: string;
  /** End time (optional) */
  end?: string;
  /** Number of data points to return */
  limit?: number;
  /** Time interval */
  interval?: '1m' | '5m' | '10m' | '15m' | '30m' | '1h' | '6h' | '12h' | '24h';
  /** Whether to invert the price ratio */
  inversed?: boolean;
}

/**
 * Options for pool filtering endpoint
 */
export interface PoolFilterOptions {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of results per page (max 100) */
  limit?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortDir?: 'asc' | 'desc';
  /** Minimum 24h volume in USD */
  volume24hMin?: number;
  /** Maximum 24h volume in USD */
  volume24hMax?: number;
  /** Minimum 7d volume in USD */
  volume7dMin?: number;
  /** Maximum 7d volume in USD */
  volume7dMax?: number;
  /** Minimum liquidity in USD */
  liquidityUsdMin?: number;
  /** Maximum liquidity in USD */
  liquidityUsdMax?: number;
  /** Minimum 24h transaction count */
  txns24hMin?: number;
  /** Only pools created after this Unix timestamp */
  createdAfter?: number | string;
  /** Only pools created before this Unix timestamp */
  createdBefore?: number | string;
}

/**
 * Options for top tokens endpoint
 */
export interface TopTokensOptions {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of results per page (max 100) */
  limit?: number;
  /** Field to order by (e.g., "volume_24h", "price_usd", "liquidity_usd") */
  orderBy?: string;
  /** Sort direction */
  sort?: 'asc' | 'desc';
}

/**
 * Options for token filtering endpoint
 */
export interface TokenFilterOptions {
  /** Page number (1-indexed) */
  page?: number;
  /** Number of results per page (max 100) */
  limit?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortDir?: 'asc' | 'desc';
  /** Minimum 24h volume in USD */
  volume24hMin?: number;
  /** Maximum 24h volume in USD */
  volume24hMax?: number;
  /** Minimum liquidity in USD */
  liquidityUsdMin?: number;
  /** Minimum fully diluted valuation in USD */
  fdvMin?: number;
  /** Maximum fully diluted valuation in USD */
  fdvMax?: number;
  /** Minimum 24h transaction count */
  txns24hMin?: number;
  /** Only tokens created after this Unix timestamp */
  createdAfter?: number | string;
  /** Only tokens created before this Unix timestamp */
  createdBefore?: number | string;
} 