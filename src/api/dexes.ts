import { BaseAPI } from './base';
import { pathSegment } from '../utils/path';
import { DexPaginatedResponse } from '../models/base';
import { PaginationOptions } from '../models/options';

/**
 * API service for DEX-related endpoints.
 */
export class DexesAPI extends BaseAPI {
  /**
   * Get a list of DEXes on a specific network.
   * 
   * @param networkId - Network ID (e.g., "ethereum", "solana")
   * @param options - Pagination options
   * @returns Paginated response containing a list of DEXes on the network
   */
  async listByNetwork(
    networkId: string, 
    options?: PaginationOptions
  ): Promise<DexPaginatedResponse> {
    const params: Record<string, any> = {
      page: options?.page ?? 0,
      limit: options?.limit ?? 10
    };
    
    return this._get<DexPaginatedResponse>(`/networks/${pathSegment('networkId', networkId)}/dexes`, params);
  }
} 