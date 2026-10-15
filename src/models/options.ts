/**
 * Common option types for API requests
 */

import { IndicatorInterval, IndicatorType } from './indicators';

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
  /** Cursor for the next page (cursor-paginated search endpoints) */
  cursor?: string;
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
  /**
   * @deprecated Ignored. The removed /tokens/{address}/pools endpoint could
   * filter by a second token; the /pools/search endpoint that replaced it has
   * no pair filter. Repeating token_address does not act as a pair filter;
   * the API uses only one of the values (not guaranteed by order).
   * Filter the returned pools client-side to match a pair.
   */
  pairWith?: string;
  /** @deprecated The search endpoint is cursor-paginated; `page` is ignored. Use `cursor`. */
  page?: number;
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
  /**
   * Filter transactions starting from this time (inclusive): a relative offset from now such as
   * '-1h' or '-24h', Unix seconds, RFC3339 or YYYY-MM-DD. Results capped to last 7 days.
   */
  from?: number | string;
  /** Filter transactions up to this time (exclusive), same formats as `from`. Must be after `from`. */
  to?: number | string;
}

/**
 * OHLCV data options
 */
export interface OHLCVOptions {
  /**
   * Start time: a relative offset from now such as `-24h` or `-7d`, an ISO date
   * string, or a Unix timestamp. Must fall inside your plan's history window
   * (24 hours without a key); otherwise the API answers 403.
   */
  start: string;
  /** End time (optional), same formats as `start`, e.g. `-1h` */
  end?: string;
  /** Number of data points to return */
  limit?: number;
  /** Time interval. Without a key only `1h` and longer; a free key allows `10m` and longer. */
  interval?: '1m' | '5m' | '10m' | '15m' | '30m' | '1h' | '6h' | '12h' | '24h';
  /** Whether to invert the price ratio */
  inversed?: boolean;
}

/**
 * Token OHLCV data options.
 *
 * There is no `inversed` field here, unlike {@link OHLCVOptions}: a pool candle
 * is a ratio between two tokens that can be flipped, but a token candle is
 * already a single USD price series, so there is nothing to invert.
 */
export interface TokenOHLCVOptions {
  /**
   * Start time: a relative offset from now such as `-24h` or `-7d`, RFC3339,
   * `YYYY-MM-DD`, or Unix seconds. Must fall inside your plan's history window;
   * otherwise the API answers 403.
   */
  start: string;
  /** End time (optional), same formats as `start`. */
  end?: string;
  /** Number of data points to return (1-1000). */
  limit?: number;
  /** Candle interval. */
  interval?: '1m' | '5m' | '10m' | '15m' | '30m' | '1h' | '6h' | '12h' | '24h';
}

/**
 * Options for pool filtering endpoint
 */
export interface PoolFilterOptions {
  /** @deprecated The search endpoint is cursor-paginated; `page` is ignored. Use `cursor`. */
  page?: number;
  /** Cursor for the next page (from the response's `next_cursor`) */
  cursor?: string;
  /** Number of results per page (max 100) */
  limit?: number;
  /** Field to sort by (legacy values such as 'volume_24h' are mapped) */
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
  // Price-change bounds, in percent, on the five windows pools/search supports.
  // Negative values are meaningful and common: priceChange24hMax: -20 finds
  // pools down at least a fifth on the day. The 24h window also works on
  // tokens/search (see TokenFilterOptions); the 48h, 6h, 1h and 5m windows are
  // pools only, and tokens/search ignores them without an error.
  /** Minimum 24h price change, in percent */
  priceChange24hMin?: number;
  /** Maximum 24h price change, in percent */
  priceChange24hMax?: number;
  /** Minimum 48h price change, in percent */
  priceChange48hMin?: number;
  /** Maximum 48h price change, in percent */
  priceChange48hMax?: number;
  /** Minimum 6h price change, in percent */
  priceChange6hMin?: number;
  /** Maximum 6h price change, in percent */
  priceChange6hMax?: number;
  /** Minimum 1h price change, in percent */
  priceChange1hMin?: number;
  /** Maximum 1h price change, in percent */
  priceChange1hMax?: number;
  /** Minimum 5m price change, in percent */
  priceChange5mMin?: number;
  /** Maximum 5m price change, in percent */
  priceChange5mMax?: number;
  /** Only pools created at or after this time: a relative offset from now such as '-24h' or '-7d', Unix seconds, RFC3339 or YYYY-MM-DD */
  createdAfter?: number | string;
  /** Only pools created at or before this time, same formats as `createdAfter` */
  createdBefore?: number | string;
}

/**
 * Options for top tokens endpoint
 */
export interface TopTokensOptions {
  /** @deprecated The search endpoint is cursor-paginated; `page` is ignored. Use `cursor`. */
  page?: number;
  /** Cursor for the next page (from the response's `next_cursor`) */
  cursor?: string;
  /** Number of results per page (max 100) */
  limit?: number;
  /** Field to order by (legacy values such as "volume_24h" are mapped) */
  orderBy?: string;
  /** Sort direction */
  sort?: 'asc' | 'desc';
}

/**
 * Options for token filtering endpoint
 */
export interface TokenFilterOptions {
  /** @deprecated The search endpoint is cursor-paginated; `page` is ignored. Use `cursor`. */
  page?: number;
  /** Cursor for the next page (from the response's `next_cursor`) */
  cursor?: string;
  /** Number of results per page (max 100) */
  limit?: number;
  /** Field to sort by (legacy values such as 'volume_24h' are mapped) */
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
  // Only the 24h price-change window is bounded here. tokens/search accepts
  // price_change_percentage_24h_min and _max and applies them; it ignores the
  // 48h, 6h, 1h and 5m bounds silently, so offering those options would return
  // a full unfiltered page that looks like a successful filter.
  /** Minimum 24h price change, in percent */
  priceChange24hMin?: number;
  /** Maximum 24h price change, in percent */
  priceChange24hMax?: number;
  /** Only tokens created at or after this time: a relative offset from now such as '-24h' or '-7d', Unix seconds, RFC3339 or YYYY-MM-DD */
  createdAfter?: number | string;
  /** Only tokens created at or before this time, same formats as `createdAfter` */
  createdBefore?: number | string;
}

/**
 * Options for the pool and token technical indicator endpoints
 * (`pools.getIndicator()` and `tokens.getIndicator()`).
 *
 * Only `indicator` is required. Every other field is left unset by default,
 * on purpose: the API fills in its own defaults (reported back on the
 * response's `parameters`), and a value sent for the wrong indicator is
 * refused with HTTP 400, e.g. `fast_period` with `indicator: 'rsi'`.
 */
export interface IndicatorOptions {
  /** Which indicator to compute: `rsi`, `ema`, `macd`, `bbands` or `vwap`. */
  indicator: IndicatorType;
  /**
   * Candle interval. Leave unset to use the server's default (`24h`, or `1h`
   * for keyless callers on pool indicators); do not hard-code a default here.
   */
  interval?: IndicatorInterval;
  /** Number of data points to return (1-1000, server default 100). */
  limit?: number;
  /**
   * Start time: a relative offset from now such as `-24h` or `-7d`, Unix
   * seconds, RFC3339, or `YYYY-MM-DD`.
   */
  start?: string;
  /** End time (exclusive), same formats as `start`. Server default: now. */
  end?: string;
  /** Cursor from a previous response's `next_cursor`. Do not combine with `start`. */
  cursor?: string;
  /**
   * Lookback period. Accepted by rsi (default 14), ema (default 20), bbands
   * (default 20) and vwap (default 14); macd does not accept it.
   */
  period?: number;
  /** macd only, default 12. */
  fast_period?: number;
  /** macd only, default 26, must be greater than `fast_period`. */
  slow_period?: number;
  /** macd only, default 9. */
  signal_period?: number;
  /** bbands only, default 2. Greater than 0 and at most 10. */
  std_dev?: number;
}
