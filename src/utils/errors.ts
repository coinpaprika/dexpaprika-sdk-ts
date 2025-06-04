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
 * Error thrown when trying to use a deprecated endpoint
 */
export class DeprecatedEndpointError extends DexPaprikaError {
  constructor(endpoint: string, alternative: string) {
    super(
      `The ${endpoint} endpoint has been deprecated and removed. ` +
      `Please use ${alternative} instead. ` +
      `For more information, visit: https://docs.dexpaprika.com/changelog/changelog`
    );
    this.name = 'DeprecatedEndpointError';
  }
} 