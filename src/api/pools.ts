import { BaseAPI } from './base';
import {
  PoolDetails,
  OHLCVRecord
} from '../models/pools';
import { PoolPaginatedResponse, PoolSearchResponse } from '../models/base';
import {
  PoolListOptions,
  OHLCVOptions,
  PoolDetailsOptions,
  TransactionOptions,
  PoolFilterOptions,
} from '../models/options';
import { DeprecatedEndpointError } from '../utils/errors';
import { mapPoolSortField, mapPoolFilterParams } from '../utils/searchParams';

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
   * Get pools on a specific network, cursor-paginated and sorted.
   *
   * Backed by the unified /networks/{network}/pools/search endpoint. Legacy
   * `orderBy` values (e.g. 'volume_usd') are accepted and mapped to canonical
   * sort fields; pass `cursor` for the next page (the response carries
   * `has_next_page` and `next_cursor`).
   *
   * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
   * @param options - Options for sorting, limit and cursor pagination
   * @returns Search response with pool results on the specified network
   */
  async listByNetwork(
    networkId: string,
    options?: PoolListOptions
  ): Promise<PoolSearchResponse> {
    if (!networkId) {
      throw new Error('Network ID is required. Use \'ethereum\', \'solana\', \'fantom\', etc.');
    }

    const params: Record<string, any> = {
      limit: options?.limit ?? 10,
      sort: options?.sort ?? 'desc',
      order_by: mapPoolSortField(options?.orderBy),
    };
    if (options?.cursor) params.cursor = options.cursor;

    return this._get<PoolSearchResponse>(`/networks/${networkId}/pools/search`, params);
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
   * Backed by the unified /networks/{network}/pools/search endpoint. The request
   * sends `order_by` (mapped from the legacy `sortBy`) and `sort` (direction),
   * and is cursor-paginated (pass `cursor`; read `has_next_page`/`next_cursor`
   * from the response). Legacy filter param names are mapped to canonical ones.
   *
   * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
   * @param options - Filter criteria and cursor pagination options
   * @returns Search response with filtered pool results
   */
  async filter(
    networkId: string,
    options?: PoolFilterOptions
  ): Promise<PoolSearchResponse> {
    if (!networkId) {
      throw new Error('Network ID is required');
    }

    const params: Record<string, any> = {
      limit: options?.limit ?? 10,
      order_by: mapPoolSortField(options?.sortBy),
      sort: options?.sortDir ?? 'desc',
    };
    if (options?.cursor) params.cursor = options.cursor;

    const filters: Record<string, any> = {};
    if (options?.volume24hMin !== undefined) filters.volume_24h_min = options.volume24hMin;
    if (options?.volume24hMax !== undefined) filters.volume_24h_max = options.volume24hMax;
    if (options?.volume7dMin !== undefined) filters.volume_7d_min = options.volume7dMin;
    if (options?.volume7dMax !== undefined) filters.volume_7d_max = options.volume7dMax;
    if (options?.liquidityUsdMin !== undefined) filters.liquidity_usd_min = options.liquidityUsdMin;
    if (options?.liquidityUsdMax !== undefined) filters.liquidity_usd_max = options.liquidityUsdMax;
    if (options?.txns24hMin !== undefined) filters.txns_24h_min = options.txns24hMin;
    if (options?.createdAfter !== undefined) filters.created_after = options.createdAfter;
    if (options?.createdBefore !== undefined) filters.created_before = options.createdBefore;
    Object.assign(params, mapPoolFilterParams(filters));

    return this._get<PoolSearchResponse>(`/networks/${networkId}/pools/search`, params);
  }
}