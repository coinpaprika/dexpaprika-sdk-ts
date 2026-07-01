/**
 * Custom error classes for DexPaprika SDK
 */

/**
 * Base error class for all DexPaprika SDK errors
 */
export class DexPaprikaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DexPaprikaError';
  }
}

/**
 * Error thrown when a network is not found or invalid
 */
export class NetworkNotFoundError extends DexPaprikaError {
  constructor(networkId: string) {
    super(`Network not found: ${networkId}`);
    this.name = 'NetworkNotFoundError';
  }
}

/**
 * Error thrown when a pool is not found
 */
export class PoolNotFoundError extends DexPaprikaError {
  constructor(poolAddress: string) {
    super(`Pool not found: ${poolAddress}`);
    this.name = 'PoolNotFoundError';
  }
}

/**
 * General API error with status code
 */
export class ApiError extends DexPaprikaError {
  public statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(`API Error (${statusCode}): ${message}`);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

/**
 * Optional deprecation hints surfaced by the API response body.
 */
export interface DeprecationDetails {
  /** Replacement path advertised by the API (e.g. "/networks/:network/pools/search"). */
  replacement?: string;
  /** Raw deprecation message from the API response body (e.g. "endpoint removed"). */
  apiMessage?: string;
}

/**
 * Error thrown when trying to use a deprecated endpoint.
 *
 * When the API response body carries a "replacement" hint, it is surfaced on
 * the {@link DeprecatedEndpointError.replacement} field and folded into the
 * error message, so future deprecations self-document without an SDK change.
 */
export class DeprecatedEndpointError extends DexPaprikaError {
  /** The deprecated endpoint that was called. */
  public readonly endpoint: string;
  /** Human-facing suggestion for what to use instead. */
  public readonly alternative: string;
  /** Replacement path advertised by the API response body, when present. */
  public readonly replacement?: string;
  /** Raw deprecation message from the API response body, when present. */
  public readonly apiMessage?: string;

  constructor(endpoint: string, alternative: string, details: DeprecationDetails = {}) {
    const { replacement, apiMessage } = details;
    const parts: string[] = [];

    // Surface the API's own deprecation message first, when it sent one.
    if (apiMessage) {
      const trimmed = apiMessage.trim().replace(/[.:;\s]+$/, '');
      if (trimmed) {
        parts.push(`${trimmed}.`);
      }
    }

    parts.push(`The ${endpoint} endpoint has been deprecated and removed.`);
    parts.push(`Please use ${alternative} instead.`);

    // Point at the exact path the API advertised, if it differs from the
    // human-facing suggestion above (avoids repeating it verbatim).
    if (replacement && replacement !== alternative) {
      parts.push(`API replacement: ${replacement}.`);
    }

    parts.push('For more information, visit: https://docs.dexpaprika.com/changelog/changelog');

    super(parts.join(' '));
    this.name = 'DeprecatedEndpointError';
    this.endpoint = endpoint;
    this.alternative = alternative;
    this.replacement = replacement;
    this.apiMessage = apiMessage;
  }
} 