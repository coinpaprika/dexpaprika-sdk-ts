import { DexPaprikaClient } from '../client';
import { 
  DexPaprikaError, 
  NetworkNotFoundError, 
  PoolNotFoundError, 
  ApiError, 
  DeprecatedEndpointError 
} from '../utils/errors';

// base for api classes
export class BaseAPI {
  protected client: DexPaprikaClient;

  /**
   * Initialize a new API service.
   * 
   * @param client - DexPaprika client instance
   */
  constructor(client: DexPaprikaClient) {
    this.client = client;
  }

  /**
   * Make a GET request with enhanced error handling.
   * 
   * @param endpoint - API endpoint
   * @param params - Query parameters
   * @returns Response data
   * @throws {DeprecatedEndpointError} If endpoint returns 410 Gone
   * @throws {NetworkNotFoundError} If network is not found
   * @throws {PoolNotFoundError} If pool is not found
   * @throws {ApiError} For other API errors
   * @throws {DexPaprikaError} For general SDK errors
   */
  protected async _get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    try {
      return await this.client.get<T>(endpoint, params);
    } catch (error: any) {
      // Handle HTTP errors
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;

        // Parse the error body defensively: it may not be JSON, or may lack
        // these fields. Anything unexpected falls back to prior behavior.
        const bodyIsObject = data !== null && typeof data === 'object';
        const replacement: string | undefined =
          bodyIsObject && typeof data.replacement === 'string' && data.replacement.trim() !== ''
            ? data.replacement
            : undefined;
        const apiMessage: string | undefined = bodyIsObject
          ? (data.error || data.message)
          : undefined;
        const message = apiMessage || 'Unknown API error';

        // Generic, self-documenting deprecation handling: ANY non-2xx whose
        // body carries a "replacement" hint is surfaced as a
        // DeprecatedEndpointError that includes both the API's message and the
        // exact replacement path. Not limited to 410 or specific endpoints, so
        // future deprecations document themselves without an SDK change.
        if (replacement) {
          if (endpoint === '/pools') {
            // Keep the /pools client-side special case wording, but still
            // attach the API's message and replacement path for callers.
            throw new DeprecatedEndpointError(
              '/pools',
              'network-specific endpoints like client.pools.listByNetwork(\'ethereum\')',
              { replacement, apiMessage }
            );
          }
          throw new DeprecatedEndpointError(endpoint, replacement, { replacement, apiMessage });
        }

        // Handle deprecated endpoint (410 Gone) with no replacement in body.
        if (status === 410) {
          if (endpoint === '/pools') {
            throw new DeprecatedEndpointError(
              '/pools',
              'network-specific endpoints like client.pools.listByNetwork(\'ethereum\')'
            );
          }
          throw new DeprecatedEndpointError(endpoint, 'check API documentation for alternatives');
        }

        // Handle not found errors with context
        if (status === 404) {
          if (message.toLowerCase().includes('network')) {
            const networkId = params?.network || endpoint.match(/\/networks\/([^\/]+)/)?.[1] || 'unknown';
            throw new NetworkNotFoundError(networkId);
          }
          if (message.toLowerCase().includes('pool') || endpoint.includes('/pools/')) {
            const poolAddress = endpoint.split('/').pop() || 'unknown';
            throw new PoolNotFoundError(poolAddress);
          }
        }
        
        throw new ApiError(message, status);
      }
      
      // Handle network/connection errors
      throw new DexPaprikaError(error.message || 'Unknown error occurred');
    }
  }

  /**
   * Make a POST request.
   * 
   * @param endpoint - API endpoint
   * @param data - Request body
   * @param params - Query parameters
   * @returns Response data
   */
  protected async _post<T>(
    endpoint: string, 
    data: Record<string, any>, 
    params?: Record<string, any>
  ): Promise<T> {
    return this.client.post<T>(endpoint, data, params);
  }
} 