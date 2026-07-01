import { BaseAPI } from './base';
import {
  TokenDetails,
  TokenSearchResponse,
  TokenPrice,
} from '../models/tokens';
import { PoolPaginatedResponse } from '../models/base';
import { TokenPoolsOptions, TopTokensOptions, TokenFilterOptions } from '../models/options';
import { mapTokenSortField, mapTokenFilterParams } from '../utils/searchParams';

/**
 * API service for token-related endpoints.
 */
export class TokensAPI extends BaseAPI {
  /**
   * Get detailed information about a specific token on a network.
   * 
   * @param networkId - Network ID (e.g., "ethereum", "solana")
   * @param tokenAddress - Token address or identifier
   * @returns Detailed information about the token
   */
  async getDetails(networkId: string, tokenAddress: string): Promise<TokenDetails> {
    return this._get<TokenDetails>(`/networks/${networkId}/tokens/${tokenAddress}`);
  }
  
  /**
   * Get a list of top liquidity pools for a specific token on a network.
   * 
   * @param networkId - Network ID (e.g., "ethereum", "solana")
   * @param tokenAddress - Token address or identifier
   * @param options - Options for pagination, sorting, and filtering
   * @returns Response containing a list of pools that include the specified token
   */
  async getPools(
    networkId: string, 
    tokenAddress: string,
    options?: TokenPoolsOptions
  ): Promise<PoolPaginatedResponse> {
    // build params
    const params: Record<string, any> = { 
      page: options?.page ?? 0, 
      limit: options?.limit ?? 10, 
      sort: options?.sort ?? 'desc', 
      order_by: options?.orderBy ?? 'volume_usd' 
    };
    
    // add pair token if specified
    if (options?.pairWith) params['address'] = options.pairWith;
    
    // get pools filtered by token
    return this._get<PoolPaginatedResponse>(
      `/networks/${networkId}/tokens/${tokenAddress}/pools`,
      params
    );
  }

  /**
   * Get top tokens on a network ranked by volume, liquidity, or other metrics.
   *
   * Backed by the unified /networks/{network}/tokens/search endpoint. Legacy
   * `orderBy` values (e.g. 'volume_24h') are accepted and mapped to canonical
   * sort fields; the endpoint is cursor-paginated (pass `cursor`; read
   * `has_next_page`/`next_cursor` from the response).
   *
   * @param networkId - Network ID (e.g., "ethereum", "solana")
   * @param options - Sorting, limit and cursor pagination options
   * @returns Search response with token results
   */
  async getTop(
    networkId: string,
    options?: TopTokensOptions
  ): Promise<TokenSearchResponse> {
    const params: Record<string, any> = {
      limit: options?.limit ?? 10,
      order_by: mapTokenSortField(options?.orderBy),
      sort: options?.sort ?? 'desc',
    };
    if (options?.cursor) params.cursor = options.cursor;

    return this._get<TokenSearchResponse>(
      `/networks/${networkId}/tokens/search`,
      params
    );
  }

  /**
   * Filter tokens on a network by volume, liquidity, FDV, transactions, and creation date.
   *
   * Backed by the unified /networks/{network}/tokens/search endpoint. The request
   * sends `order_by` (mapped from the legacy `sortBy`) and `sort` (direction),
   * and is cursor-paginated (pass `cursor`; read `has_next_page`/`next_cursor`
   * from the response). Legacy filter param names are mapped to canonical ones.
   *
   * @param networkId - Network ID (e.g., "ethereum", "solana")
   * @param options - Filter criteria and cursor pagination options
   * @returns Search response with filtered token results
   */
  async filter(
    networkId: string,
    options?: TokenFilterOptions
  ): Promise<TokenSearchResponse> {
    const params: Record<string, any> = {
      limit: options?.limit ?? 10,
      order_by: mapTokenSortField(options?.sortBy),
      sort: options?.sortDir ?? 'desc',
    };
    if (options?.cursor) params.cursor = options.cursor;

    const filters: Record<string, any> = {};
    if (options?.volume24hMin !== undefined) filters.volume_24h_min = options.volume24hMin;
    if (options?.volume24hMax !== undefined) filters.volume_24h_max = options.volume24hMax;
    if (options?.liquidityUsdMin !== undefined) filters.liquidity_usd_min = options.liquidityUsdMin;
    if (options?.fdvMin !== undefined) filters.fdv_min = options.fdvMin;
    if (options?.fdvMax !== undefined) filters.fdv_max = options.fdvMax;
    if (options?.txns24hMin !== undefined) filters.txns_24h_min = options.txns24hMin;
    if (options?.createdAfter !== undefined) filters.created_after = options.createdAfter;
    if (options?.createdBefore !== undefined) filters.created_before = options.createdBefore;
    Object.assign(params, mapTokenFilterParams(filters));

    return this._get<TokenSearchResponse>(`/networks/${networkId}/tokens/search`, params);
  }

  /**
   * Get batch prices for multiple tokens on a network.
   *
   * @param networkId - Network ID (e.g., "ethereum", "solana")
   * @param tokens - Array of token addresses (max 10)
   * @returns Array of token prices
   */
  async getMultiPrices(
    networkId: string,
    tokens: string[]
  ): Promise<TokenPrice[]> {
    if (!tokens || tokens.length === 0) {
      throw new Error('tokens array is required and must not be empty');
    }
    if (tokens.length > 10) {
      throw new Error('tokens array must contain at most 10 addresses');
    }

    const params = { tokens: tokens.join(',') };
    return this._get<TokenPrice[]>(`/networks/${networkId}/multi/prices`, params);
  }
}