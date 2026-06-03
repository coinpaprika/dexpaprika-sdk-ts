import { BaseAPI } from './base';
import {
  PoolDetails,
  OHLCVRecord
} from '../models/pools';
import {
  PoolPaginatedResponse,
  PoolFilterPaginatedResponse,
  AdvancedPoolSearchResponse,
} from '../models/base';
import {
  PoolListOptions,
  OHLCVOptions,
  PoolDetailsOptions,
  TransactionOptions,
  PoolFilterOptions,
  AdvancedPoolSearchOptions,
} from '../models/options';
import { DeprecatedEndpointError } from '../utils/errors';

// Pools API implementation
export class PoolsAPI extends BaseAPI {
  /**
   * @deprecated This method is deprecated since API v1.3.0. Use listByNetwork(network, options) instead.
   * 
   * Get top pools across all networks with pagination and sorting.
   * 
   * **MIGRATION REQUIRED**: This endpoint has been deprecated and will return a 410 error.
   * Please use network-specific methods instead:
   * 
   * @example
   * ```typescript
   * // OLD (deprecated):
   * const pools = await client.pools.list();
   * 
   * // NEW (required):
   * const ethereumPools = await client.pools.listByNetwork('ethereum');
   * const solanaPools = await client.pools.listByNetwork('solana');
   * ```
   * 
   * @param options - Options for filtering, pagination and sorting
   * @returns Paginated list of pools
   * @throws {DeprecatedEndpointError} Always throws since endpoint is deprecated
   */
  async list(_options?: PoolListOptions): Promise<PoolPaginatedResponse> {
    // This method now throws an error to guide users to the new approach
    throw new DeprecatedEndpointError(
      '/pools', 
      'client.pools.listByNetwork(network, options) - specify a network like \'ethereum\', \'solana\', or \'fantom\''
    );
  }
  
  /**
   * Get pools on a specific network with pagination and sorting.
   * 
   * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
   * @param options - Options for filtering, pagination and sorting
   * @returns Paginated list of pools on the specified network
   */
  async listByNetwork(
    networkId: string, 
    options?: PoolListOptions
  ): Promise<PoolPaginatedResponse> {
    if (!networkId) {
      throw new Error('Network ID is required. Use \'ethereum\', \'solana\', \'fantom\', etc.');
    }
    
    const params: Record<string, any> = {
      page: options?.page ?? 0,
      limit: options?.limit ?? 10,
      sort: options?.sort ?? 'desc',
      order_by: options?.orderBy ?? 'volume_usd'
    };
    
    return this._get<PoolPaginatedResponse>(`/networks/${networkId}/pools`, params);
  }
  
  /**
   * Get pools on a specific DEX within a network with pagination.
   * 
   * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
   * @param dexId - DEX identifier (e.g., 'uniswap_v2', 'sushiswap')
   * @param options - Options for filtering, pagination and sorting
   * @returns Paginated list of pools on the specified DEX
   */
  async listByDex(
    networkId: string, 
    dexId: string, 
    options?: PoolListOptions
  ): Promise<PoolPaginatedResponse> {
    if (!networkId) {
      throw new Error('Network ID is required');
    }
    if (!dexId) {
      throw new Error('DEX ID is required');
    }
    
    const params: Record<string, any> = {
      page: options?.page ?? 0,
      limit: options?.limit ?? 10,
      sort: options?.sort ?? 'desc',
      order_by: options?.orderBy ?? 'volume_usd'
    };
    
    return this._get<PoolPaginatedResponse>(`/networks/${networkId}/dexes/${dexId}/pools`, params);
  }
  
  /**
   * Get detailed information about a specific pool.
   * 
   * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
   * @param poolAddress - On-chain address of the pool
   * @param options - Additional options for pool details
   * @returns Detailed pool information
   */
  async getDetails(
    networkId: string, 
    poolAddress: string, 
    options?: PoolDetailsOptions
  ): Promise<PoolDetails> {
    if (!networkId) {
      throw new Error('Network ID is required');
    }
    if (!poolAddress) {
      throw new Error('Pool address is required');
    }
    
    const params: Record<string, any> = {};
    if (options?.inversed) params.inversed = 'true';
    
    return this._get<PoolDetails>(`/networks/${networkId}/pools/${poolAddress}`, params);
  }
  
  /**
   * Get OHLCV (Open-High-Low-Close-Volume) data for a pool.
   * 
   * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
   * @param poolAddress - On-chain address of the pool
   * @param options - OHLCV options including time range and interval
   * @returns Time-series OHLCV data
   */
  async getOHLCV(
    networkId: string, 
    poolAddress: string, 
    options: OHLCVOptions
  ): Promise<OHLCVRecord[]> {
    if (!networkId) {
      throw new Error('Network ID is required');
    }
    if (!poolAddress) {
      throw new Error('Pool address is required');
    }
    
    const params: Record<string, any> = { 
      start: options.start,
      limit: options.limit ?? 1,
      interval: options.interval ?? '24h'
    };
    
    if (options.end) params.end = options.end;
    if (options.inversed) params.inversed = 'true';
    
    return this._get<OHLCVRecord[]>(`/networks/${networkId}/pools/${poolAddress}/ohlcv`, params);
  }
  
  /**
   * Get transaction history for a specific pool.
   * 
   * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
   * @param poolAddress - On-chain address of the pool
   * @param options - Pagination options
   * @returns List of pool transactions
   */
  async getTxs(
    networkId: string, 
    poolAddress: string, 
    options?: TransactionOptions
  ) {
    if (!networkId) {
      throw new Error('Network ID is required');
    }
    if (!poolAddress) {
      throw new Error('Pool address is required');
    }
    
    const params: Record<string, any> = {
      page: options?.page ?? 0,
      limit: options?.limit ?? 10
    };
    
    if (options?.cursor) params.cursor = options.cursor;
    if (options?.from !== undefined) params.from = options.from;
    if (options?.to !== undefined) params.to = options.to;

    return this._get(`/networks/${networkId}/pools/${poolAddress}/transactions`, params);
  }
  
  /**
   * Alternative method name for getTransactions
   * 
   * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
   * @param poolAddress - On-chain address of the pool
   * @param options - Pagination options
   * @returns List of pool transactions
   */
  getTransactions(
    networkId: string,
    poolAddress: string,
    options?: TransactionOptions
  ) {
    return this.getTxs(networkId, poolAddress, options);
  }

  /**
   * Filter pools on a network by volume, liquidity, transactions, and creation date.
   *
   * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
   * @param options - Filter criteria and pagination options
   * @returns Filtered pools with pagination info
   */
  async filter(
    networkId: string,
    options?: PoolFilterOptions
  ): Promise<PoolFilterPaginatedResponse> {
    if (!networkId) {
      throw new Error('Network ID is required');
    }

    const params: Record<string, any> = {
      page: options?.page ?? 1,
      limit: options?.limit ?? 10,
      sort_by: options?.sortBy ?? 'volume_24h',
      sort_dir: options?.sortDir ?? 'desc',
    };

    if (options?.volume24hMin !== undefined) params.volume_24h_min = options.volume24hMin;
    if (options?.volume24hMax !== undefined) params.volume_24h_max = options.volume24hMax;
    if (options?.volume7dMin !== undefined) params.volume_7d_min = options.volume7dMin;
    if (options?.volume7dMax !== undefined) params.volume_7d_max = options.volume7dMax;
    if (options?.liquidityUsdMin !== undefined) params.liquidity_usd_min = options.liquidityUsdMin;
    if (options?.liquidityUsdMax !== undefined) params.liquidity_usd_max = options.liquidityUsdMax;
    if (options?.txns24hMin !== undefined) params.txns_24h_min = options.txns24hMin;
    if (options?.createdAfter !== undefined) params.created_after = options.createdAfter;
    if (options?.createdBefore !== undefined) params.created_before = options.createdBefore;

    return this._get<PoolFilterPaginatedResponse>(`/networks/${networkId}/pools/filter`, params);
  }

  /**
   * Advanced pool search backed by the /frontend/v1 endpoints.
   *
   * Hits `/frontend/v1/pools` globally, or
   * `/frontend/v1/networks/{network}/pools` when a network is supplied. This is
   * a richer search than `filter`: it supports price and price-change filters,
   * a `dexName` filter, an optional `detailed` token payload (fdv + per-timeframe
   * metric blocks), and CURSOR pagination.
   *
   * This endpoint is cursor-paginated, not page-based. Walk pages by passing the
   * previous response's `next_cursor` back in as `cursor`, while `has_next_page`
   * is true.
   *
   * Sorting note: the surface takes the canonical `sortBy` / `sortDir`, which are
   * translated to the backend wire names `order_by` / `sort`. Do not pass the wire
   * names yourself.
   *
   * @example
   * ```typescript
   * // Global search, top pools by 24h volume priced above $0.50 on Uniswap V3:
   * const res = await client.pools.advancedSearch({
   *   limit: 20,
   *   sortBy: 'volume_usd_24h',
   *   sortDir: 'desc',
   *   priceUsdMin: 0.5,
   *   dexName: 'uniswap_v3',
   *   detailed: true,
   * });
   *
   * // Per-network search (Ethereum):
   * const ethRes = await client.pools.advancedSearch({ network: 'ethereum', limit: 10 });
   *
   * // Next page:
   * if (ethRes.has_next_page && ethRes.next_cursor) {
   *   const page2 = await client.pools.advancedSearch({ network: 'ethereum', cursor: ethRes.next_cursor });
   * }
   * ```
   *
   * @param options - Search criteria, sorting, detail flag, cursor, and an optional `network`.
   * @returns Matching pool rows with cursor pagination info.
   */
  async advancedSearch(
    options?: AdvancedPoolSearchOptions & { network?: string }
  ): Promise<AdvancedPoolSearchResponse> {
    // Translate the canonical sortBy/sortDir to the wire names order_by/sort.
    // This is the inverse of intuition and the #1 trap for this endpoint.
    const params: Record<string, any> = {
      limit: options?.limit ?? 10,
      order_by: options?.sortBy ?? 'volume_usd_24h',
      sort: options?.sortDir ?? 'desc',
    };

    if (options?.cursor) params.cursor = options.cursor;
    if (options?.detailed) params.detailed = 'true';

    if (options?.volume24hMin !== undefined) params.volume_24h_min = options.volume24hMin;
    if (options?.volume24hMax !== undefined) params.volume_24h_max = options.volume24hMax;
    if (options?.volume7dMin !== undefined) params.volume_7d_min = options.volume7dMin;
    if (options?.volume7dMax !== undefined) params.volume_7d_max = options.volume7dMax;
    if (options?.liquidityUsdMin !== undefined) params.liquidity_usd_min = options.liquidityUsdMin;
    if (options?.liquidityUsdMax !== undefined) params.liquidity_usd_max = options.liquidityUsdMax;
    if (options?.txns24hMin !== undefined) params.txns_24h_min = options.txns24hMin;
    if (options?.priceUsdMin !== undefined) params.price_usd_min = options.priceUsdMin;
    if (options?.priceUsdMax !== undefined) params.price_usd_max = options.priceUsdMax;
    if (options?.priceChangePercentage24hMin !== undefined) {
      params.price_change_percentage_24h_min = options.priceChangePercentage24hMin;
    }
    if (options?.priceChangePercentage24hMax !== undefined) {
      params.price_change_percentage_24h_max = options.priceChangePercentage24hMax;
    }
    if (options?.dexName !== undefined) params.dex_name = options.dexName;
    if (options?.createdAfter !== undefined) params.created_after = options.createdAfter;
    if (options?.createdBefore !== undefined) params.created_before = options.createdBefore;

    const endpoint = options?.network
      ? `/frontend/v1/networks/${options.network}/pools`
      : '/frontend/v1/pools';

    const raw = await this._get<AdvancedPoolSearchResponse>(endpoint, params);
    // Never hand back an undefined results array (the API may drop the key).
    return { ...raw, results: raw.results ?? [] };
  }

  /**
   * Alias for {@link advancedSearch}.
   *
   * @param options - Search criteria, sorting, detail flag, cursor, and an optional `network`.
   * @returns Matching pool rows with cursor pagination info.
   */
  search(
    options?: AdvancedPoolSearchOptions & { network?: string }
  ): Promise<AdvancedPoolSearchResponse> {
    return this.advancedSearch(options);
  }
}