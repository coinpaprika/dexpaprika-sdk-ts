import { BaseAPI } from './base';
import { TokenDetails } from '../models/tokens';
import { PoolPaginatedResponse } from '../models/base';
import { TokenPoolsOptions } from '../models/options';
/**
 * API service for token-related endpoints.
 */
export declare class TokensAPI extends BaseAPI {
    /**
     * Get detailed information about a specific token on a network.
     *
     * @param networkId - Network ID (e.g., "ethereum", "solana")
     * @param tokenAddress - Token address or identifier
     * @returns Detailed information about the token
     */
    getDetails(networkId: string, tokenAddress: string): Promise<TokenDetails>;
    /**
     * Get a list of top liquidity pools for a specific token on a network.
     *
     * @param networkId - Network ID (e.g., "ethereum", "solana")
     * @param tokenAddress - Token address or identifier
     * @param options - Options for pagination, sorting, and filtering
     * @returns Response containing a list of pools that include the specified token
     */
    getPools(networkId: string, tokenAddress: string, options?: TokenPoolsOptions): Promise<PoolPaginatedResponse>;
}
