import { BaseAPI } from './base';
import { PoolDetails, OHLCVRecord } from '../models/pools';
import { PoolPaginatedResponse } from '../models/base';
import { PoolListOptions, OHLCVOptions, PoolDetailsOptions, TransactionOptions } from '../models/options';
export declare class PoolsAPI extends BaseAPI {
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
    list(_options?: PoolListOptions): Promise<PoolPaginatedResponse>;
    /**
     * Get pools on a specific network with pagination and sorting.
     *
     * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
     * @param options - Options for filtering, pagination and sorting
     * @returns Paginated list of pools on the specified network
     */
    listByNetwork(networkId: string, options?: PoolListOptions): Promise<PoolPaginatedResponse>;
    /**
     * Get pools on a specific DEX within a network with pagination.
     *
     * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
     * @param dexId - DEX identifier (e.g., 'uniswap_v2', 'sushiswap')
     * @param options - Options for filtering, pagination and sorting
     * @returns Paginated list of pools on the specified DEX
     */
    listByDex(networkId: string, dexId: string, options?: PoolListOptions): Promise<PoolPaginatedResponse>;
    /**
     * Get detailed information about a specific pool.
     *
     * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
     * @param poolAddress - On-chain address of the pool
     * @param options - Additional options for pool details
     * @returns Detailed pool information
     */
    getDetails(networkId: string, poolAddress: string, options?: PoolDetailsOptions): Promise<PoolDetails>;
    /**
     * Get OHLCV (Open-High-Low-Close-Volume) data for a pool.
     *
     * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
     * @param poolAddress - On-chain address of the pool
     * @param options - OHLCV options including time range and interval
     * @returns Time-series OHLCV data
     */
    getOHLCV(networkId: string, poolAddress: string, options: OHLCVOptions): Promise<OHLCVRecord[]>;
    /**
     * Get transaction history for a specific pool.
     *
     * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
     * @param poolAddress - On-chain address of the pool
     * @param options - Pagination options
     * @returns List of pool transactions
     */
    getTxs(networkId: string, poolAddress: string, options?: TransactionOptions): Promise<unknown>;
    /**
     * Alternative method name for getTransactions
     *
     * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
     * @param poolAddress - On-chain address of the pool
     * @param options - Pagination options
     * @returns List of pool transactions
     */
    getTransactions(networkId: string, poolAddress: string, options?: TransactionOptions): Promise<unknown>;
}
