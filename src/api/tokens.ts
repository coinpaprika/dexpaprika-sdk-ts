import { BaseAPI } from './base';
import {
  TokenDetails,
  TokenSearchResponse,
  TokenPrice,
} from '../models/tokens';
import { PoolSearchResponse } from '../models/base';
import { TokenPoolsOptions, TopTokensOptions, TokenFilterOptions } from '../models/options';
import { mapTokenSortField, mapPoolSortField, mapTokenFilterParams } from '../utils/searchParams';

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
   * Get a list of top liquidity pools that contain a specific token on a network.
   *
   * Backed by the unified /networks/{network}/pools/search endpoint with its
   * `token_address` parameter (the old /tokens/{address}/pools endpoint was
   * removed, HTTP 410). The filter is network-scoped only: the cross-network
   * /pools/search endpoint accepts `token_address` but silently ignores it, so
   * a network is always required here. Legacy `orderBy` values (e.g.
   * 'volume_usd') are mapped to canonical sort fields; the endpoint is
   * cursor-paginated (pass `cursor`; read `has_next_page`/`next_cursor` from
   * the response; `page` is ignored). An unknown token address returns an
   * empty result set, not an error.
   *
   * @param networkId - Network ID (e.g., "ethereum", "solana")
   * @param tokenAddress - Token address or identifier
   * @param options - Sorting, limit and cursor pagination options
   * @returns Search response with pools that contain the specified token
   */
  async getPools(
    networkId: string,
    tokenAddress: string,
    options?: TokenPoolsOptions
  ): Promise<PoolSearchResponse> {
    const params: Record<string, any> = {
      token_address: tokenAddress,
      limit: options?.limit ?? 10,
      sort: options?.sort ?? 'desc',
      order_by: mapPoolSortField(options?.orderBy),
    };
    if (options?.cursor) params.cursor = options.cursor;

    // Note: options.pairWith is deprecated and intentionally not sent.
    // /pools/search has no pair filter and repeating token_address is
    // last-wins on the API side, not a pair filter.
    return this._get<PoolSearchResponse>(
      `/networks/${networkId}/pools/search`,
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