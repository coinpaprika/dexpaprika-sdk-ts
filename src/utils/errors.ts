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
 * Extra fields the API's error envelope may carry, surfaced on {@link ApiError}
 * when present: `{"error": "<code>", "message": "...", "param": "...",
 * "required_tier": "..."}`.
 */
export interface ApiErrorDetails {
  /** The `error` code from the API's envelope (e.g. "plan_required", "not_found", "invalid_param"). */
  errorCode?: string;
  /** The plan that would be required, sent on a 403 `plan_required` response (e.g. "dev"). */
  requiredTier?: string;
  /** The query parameter the error refers to, when the API sent one. */
  param?: string;
}

/**
 * General API error with status code
 */
export class ApiError extends DexPaprikaError {
  public statusCode: number;
  /** The `error` code from the API's envelope, when present. */
  public errorCode?: string;
  /** The plan required for this request, when the API sent one (403 `plan_required`). */
  public requiredTier?: string;
  /** The query parameter the error refers to, when the API sent one. */
  public param?: string;

  constructor(message: string, statusCode: number, details: ApiErrorDetails = {}) {
    super(`API Error (${statusCode}): ${message}`);
    this.statusCode = statusCode;
    this.name = 'ApiError';
    this.errorCode = details.errorCode;
    this.requiredTier = details.requiredTier;
    this.param = details.param;
  }
}

/**
 * True when `err` is the API's `plan_required` response for paging a search
 * endpoint without a key: `errorCode === 'plan_required'` and `param ===
 * 'cursor'`. Without an API key you get the first page; paging with cursor
 * needs a key (a free key pages without limit). Safe to call with any
 * thrown value, not just an {@link ApiError}.
 *
 * @param err - The value caught from a failed request
 * @returns Whether this error means paging needs an API key
 */
export function isKeyRequiredForPaging(err: unknown): boolean {
  return err instanceof ApiError && err.errorCode === 'plan_required' && err.param === 'cursor';
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
      // Strip trailing sentence punctuation and whitespace without a
      // backtracking regex (ReDoS-safe) and without trimEnd (ES2019+).
      let trimmed = apiMessage.trim();
      while (trimmed.length > 0 && '.:; \t\n\r\f\v'.indexOf(trimmed[trimmed.length - 1]) !== -1) {
        trimmed = trimmed.slice(0, -1);
      }
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