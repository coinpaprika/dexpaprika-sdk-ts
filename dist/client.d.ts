import { AxiosRequestConfig } from 'axios';
import { NetworksAPI } from './api/networks';
import { PoolsAPI } from './api/pools';
import { TokensAPI } from './api/tokens';
import { SearchAPI } from './api/search';
import { UtilsAPI } from './api/utils';
import { DexesAPI } from './api/dexes';
import { RetryConfig } from './utils/helpers';
import { CacheConfig } from './utils/cache';
/**
 * Client configuration options
 */
export interface ClientConfig {
    /** Retry configuration */
    retry?: Partial<RetryConfig>;
    /** Cache configuration */
    cache?: Partial<CacheConfig>;
}
export declare class DexPaprikaClient {
    private baseUrl;
    private httpClient;
    private retryConfig;
    private cache;
    networks: NetworksAPI;
    pools: PoolsAPI;
    tokens: TokensAPI;
    search: SearchAPI;
    utils: UtilsAPI;
    dexes: DexesAPI;
    constructor(baseUrl?: string, options?: AxiosRequestConfig, config?: ClientConfig);
    /**
     * Generate a cache key from endpoint and params
     * @private
     */
    private getCacheKey;
    /**
     * Make a GET request with caching and retry
     *
     * @param endpoint - API endpoint
     * @param params - Query parameters
     * @returns Response data
     */
    get<T>(endpoint: string, params?: Record<string, any>): Promise<T>;
    /**
     * Make a POST request with retry (not cached)
     *
     * @param endpoint - API endpoint
     * @param data - Request body
     * @param params - Query parameters
     * @returns Response data
     */
    post<T>(endpoint: string, data: Record<string, any>, params?: Record<string, any>): Promise<T>;
    /**
     * Clear all cached data
     */
    clearCache(): void;
    /**
     * Get current cache size
     */
    get cacheSize(): number;
    /**
     * Check if caching is enabled
     */
    get isCacheEnabled(): boolean;
    /**
     * Enable or disable cache
     */
    setCacheEnabled(enabled: boolean): void;
}
