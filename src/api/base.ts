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
        const apiMessage: string | undefined = bodyIsObject ? errorText(data) : undefined;
        const message = apiMessage || 'Unknown API error';

        // Structured fields from the API's error envelope
        // (`{"error": "<code>", "message": "...", "param": "...", "required_tier": "..."}`),
        // surfaced on ApiError below so a caller can branch on them instead of
        // parsing the message text.
        const errorCode: string | undefined =
          bodyIsObject && typeof data.error === 'string' && data.error !== '' ? data.error : undefined;
        const requiredTier: string | undefined =
          bodyIsObject && typeof data.required_tier === 'string' && data.required_tier !== ''
            ? data.required_tier
            : undefined;
        const param: string | undefined =
          bodyIsObject && typeof data.param === 'string' && data.param !== '' ? data.param : undefined;

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

        // A 403 whose body is not JSON never came from the API itself: it is
        // the edge in front of it (Cloudflare) rejecting the request before
        // app logic ran, typically because the key was malformed. The API's
        // own 403s (e.g. `plan_required`) always carry a JSON body and are
        // untouched above, since `bodyIsObject` is true for those.
        if (status === 403 && !bodyIsObject) {
          throw new ApiError(
            'The API key was refused before it reached the API. Check that the whole key was pasted into the Authorization header with nothing in front of it. Keys are at https://console.dexpaprika.com.',
            status
          );
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
        
        throw new ApiError(message, status, { errorCode, requiredTier, param });
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

/**
 * The human-readable message in an error body. The error envelope used across
 * the API (`{"error": "<code>", "message": "<human text>", ...}`) puts the
 * short machine code in `error` and the readable sentence in `message`, so
 * `message` is preferred when both are present. Some bodies carry only one of
 * the two, and the edge in front of the API answers 5xx with
 * `{"success": false, "error": {"code": "...", "message": "..."}}`, where
 * `error` is an object and printing it directly gives "[object Object]".
 */
function errorText(data: any): string | undefined {
  if (typeof data.message === 'string' && data.message !== '') return data.message;
  if (typeof data.error === 'string' && data.error !== '') return data.error;
  if (data.error && typeof data.error === 'object' && typeof data.error.message === 'string') {
    return data.error.message;
  }
  return undefined;
}
