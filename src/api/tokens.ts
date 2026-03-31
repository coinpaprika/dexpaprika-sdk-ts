import { BaseAPI } from './base';
import {
  TokenDetails,
  TopTokensPaginatedResponse,
  TokenFilterPaginatedResponse,
  TokenPrice,
} from '../models/tokens';
import { PoolPaginatedResponse } from '../models/base';
import { TokenPoolsOptions, TopTokensOptions, TokenFilterOptions } from '../models/options';

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
   * Get top tokens on a network ranked by volume, price, liquidity, or other metrics.
   *
   * @param networkId - Network ID (e.g., "ethereum", "solana")
   * @param options - Pagination and sorting options
   * @returns Top tokens with pagination info
   */
  async getTop(
    networkId: string,
    options?: TopTokensOptions
  ): Promise<TopTokensPaginatedResponse> {
    const params: Record<string, any> = {
      page: options?.page ?? 1,
      limit: options?.limit ?? 10,
      order_by: options?.orderBy ?? 'volume_24h',
      sort: options?.sort ?? 'desc',
    };

    return this._get<TopTokensPaginatedResponse>(
      `/networks/${networkId}/tokens/top`,
      params
    );
  }

  /**
   * Filter tokens on a network by volume, liquidity, FDV, transactions, and creation date.
   *
   * @param networkId - Network ID (e.g., "ethereum", "solana")
   * @param options - Filter criteria and pagination options
   * @returns Filtered tokens with pagination info
   */
  async filter(
    networkId: string,
    options?: TokenFilterOptions
  ): Promise<TokenFilterPaginatedResponse> {
    const params: Record<string, any> = {
      page: options?.page ?? 1,
      limit: options?.limit ?? 10,
      sort_by: options?.sortBy ?? 'volume_24h',
      sort_dir: options?.sortDir ?? 'desc',
    };

    if (options?.volume24hMin !== undefined) params.volume_24h_min = options.volume24hMin;
    if (options?.volume24hMax !== undefined) params.volume_24h_max = options.volume24hMax;
    if (options?.liquidityUsdMin !== undefined) params.liquidity_usd_min = options.liquidityUsdMin;
    if (options?.fdvMin !== undefined) params.fdv_min = options.fdvMin;
    if (options?.fdvMax !== undefined) params.fdv_max = options.fdvMax;
    if (options?.txns24hMin !== undefined) params.txns_24h_min = options.txns24hMin;
    if (options?.createdAfter !== undefined) params.created_after = options.createdAfter;
    if (options?.createdBefore !== undefined) params.created_before = options.createdBefore;

    return this._get<TokenFilterPaginatedResponse>(
      `/networks/${networkId}/tokens/filter`,
      params
    );
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