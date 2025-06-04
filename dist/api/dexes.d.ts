import { BaseAPI } from './base';
import { DexPaginatedResponse } from '../models/base';
import { PaginationOptions } from '../models/options';
/**
 * API service for DEX-related endpoints.
 */
export declare class DexesAPI extends BaseAPI {
    /**
     * Get a list of DEXes on a specific network.
     *
     * @param networkId - Network ID (e.g., "ethereum", "solana")
     * @param options - Pagination options
     * @returns Paginated response containing a list of DEXes on the network
     */
    listByNetwork(networkId: string, options?: PaginationOptions): Promise<DexPaginatedResponse>;
}
