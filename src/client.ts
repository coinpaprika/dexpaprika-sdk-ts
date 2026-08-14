import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { NetworksAPI } from './api/networks';
import { PoolsAPI } from './api/pools';
import { TokensAPI } from './api/tokens';
import { SearchAPI } from './api/search';
import { UtilsAPI } from './api/utils';
import { DexesAPI } from './api/dexes';
import { withRetry, RetryConfig, defaultRetryConfig } from './utils/helpers';
import { Cache, CacheConfig } from './utils/cache';
import { API_KEY_ENV_VAR, VERSION } from './version';

/**
 * Client configuration options
 */
export interface ClientConfig {
  /** Retry configuration */
  retry?: Partial<RetryConfig>;
  /** Cache configuration */
  cache?: Partial<CacheConfig>;
  /**
   * Optional API key. Falls back to the DEXPAPRIKA_API_KEY environment variable.
   *
   * Keyless is the default and keeps working: without a key the client behaves
   * exactly as before. The key is sent as the **entire** `Authorization` value,
   * with no `Bearer` prefix and no other scheme word, because the API checksums
   * the raw header and a scheme word returns 401.
   *
   * The host does not change when a key is present. Free keys are served from
   * the default `baseUrl` and only Pro moves to `api-pro.dexpaprika.com`, which
   * callers pass as `baseUrl`.
   */
  apiKey?: string;
}

/**
 * Environment variables, or an empty object where there are none.
 *
 * This package can be bundled for the browser, where `process` does not exist,
 * so reading it has to be guarded rather than assumed.
 */
function readEnvironment(): Record<string, string | undefined> {
  const scope = globalThis as { process?: { env?: Record<string, string | undefined> } };
  return scope.process?.env ?? {};
}

/**
 * Read a usable key, or undefined for keyless.
 *
 * A key carrying CR, LF or NUL is dropped rather than sanitised: a mangled key
 * authenticates as nobody, and because the data endpoints ignore an unreadable
 * key instead of rejecting it, the caller would never find out.
 */
export function resolveApiKey(
  explicit?: string,
  env?: Record<string, string | undefined>,
): string | undefined {
  const source = env !== undefined ? env : readEnvironment();
  const raw = explicit !== undefined ? explicit : source[API_KEY_ENV_VAR];
  if (typeof raw !== 'string') return undefined;
  const key = raw.trim();
  if (key === '' || /[\r\n\0]/.test(key)) return undefined;
  return key;
}

// Main client class
export class DexPaprikaClient {
  private baseUrl: string;
  private httpClient: AxiosInstance;
  private retryConfig: RetryConfig;
  private cache: Cache;
  
  // API interfaces
  public networks: NetworksAPI;
  public pools: PoolsAPI;
  public tokens: TokensAPI;
  public search: SearchAPI;
  public utils: UtilsAPI;
  public dexes: DexesAPI;

  constructor(
    baseUrl: string = 'https://api.dexpaprika.com',
    options: AxiosRequestConfig = {},
    config: ClientConfig = {}
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    
    // Initialize configs with defaults
    this.retryConfig = { ...defaultRetryConfig, ...config.retry };
    const apiKey = resolveApiKey(config.apiKey);
    this.cache = new Cache(config.cache);
    
    // Initialize HTTP client
    this.httpClient = axios.create({
      ...options,
      headers: {
        'Content-Type': 'application/json',
        // Was pinned to 0.1.0 while the package shipped 1.9.0, so every request
        // misreported which SDK sent it and no rollout could be measured.
        'User-Agent': `DexPaprika-SDK-JavaScript/${VERSION}`,
        // The whole value, with no scheme word in front of it. Spread last so a
        // caller can still override anything here.
        ...(apiKey ? { Authorization: apiKey } : {}),
        ...options.headers,
      },
    });
    
    // Initialize API instances
    this.networks = new NetworksAPI(this);
    this.pools = new PoolsAPI(this);
    this.tokens = new TokensAPI(this);
    this.search = new SearchAPI(this);
    this.utils = new UtilsAPI(this);
    this.dexes = new DexesAPI(this);
  }

  /**
   * Generate a cache key from endpoint and params
   * @private
   */
  private getCacheKey(endpoint: string, params?: Record<string, any>): string {
    return `${endpoint}:${JSON.stringify(params || {})}`;
  }

  /**
   * Make a GET request with caching and retry
   * 
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns Response data
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);
    
    // Check cache first
    const cachedData = this.cache.get(cacheKey) as T | undefined;
    if (cachedData) {
      return cachedData;
    }
    
    // If not in cache, fetch with retry
    const operation = async () => {
      const url = `${this.baseUrl}${endpoint}`;
      const response: AxiosResponse<T> = await this.httpClient.get(url, { params });
      
      // Cache the result
      this.cache.set(cacheKey, response.data);
      
      return response.data;
    };
    
    return withRetry(operation, this.retryConfig);
  }

  /**
   * Make a POST request with retry (not cached)
   * 
   * @param endpoint - API endpoint
   * @param data - Request body
   * @param params - Query parameters
   * @returns Response data
   */
  async post<T>(
    endpoint: string, 
    data: Record<string, any>, 
    params?: Record<string, any>
  ): Promise<T> {
    const operation = async () => {
      const url = `${this.baseUrl}${endpoint}`;
      const response: AxiosResponse<T> = await this.httpClient.post(url, data, { params });
      return response.data;
    };
    
    return withRetry(operation, this.retryConfig);
  }
  
  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Get current cache size
   */
  get cacheSize(): number {
    return this.cache.size;
  }
  
  /**
   * Check if caching is enabled
   */
  get isCacheEnabled(): boolean {
    return (this.cache as any).config.enabled;
  }
  
  /**
   * Enable or disable cache
   */
  setCacheEnabled(enabled: boolean): void {
    (this.cache as any).config.enabled = enabled;
  }
} 