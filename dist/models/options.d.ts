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
