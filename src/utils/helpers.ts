// Utility functions

/**
 * Format currency with appropriate suffix
 */
export const formatVolume = (vol: number): string => {
  if (vol >= 1_000_000_000) {
    return `$${(vol / 1_000_000_000).toFixed(2)}B`;
  }
  if (vol >= 1_000_000) {
    return `$${(vol / 1_000_000).toFixed(2)}M`;
  }
  if (vol >= 1_000) {
    return `$${(vol / 1_000).toFixed(2)}K`;
  }
  return `$${vol.toFixed(2)}`;
};

// Convert various date formats to Date object
export function parseDate(input: string | number): Date {
  if (typeof input === 'number') {
    return new Date(input * 1000); // unix timestamp
  }
  
  return new Date(input);
}

// Format token pair display
export function formatPair(token0: string, token1: string) {
  return `${token0}/${token1}`;
}

// Extract readable error message
export const parseError = (err: any) => {
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  
  if (err?.message) {
    return err.message;
  }
  
  return 'Unknown error occurred';
}

// Timestamp utility functions
export const now = () => Math.floor(Date.now() / 1000);
export const yesterday = () => now() - 86400;
export const lastWeek = () => now() - 86400 * 7;

// Async delay utility
export const sleep = (ms: number): Promise<void> => new Promise<void>(r => setTimeout(r, ms));

/**
 * Configuration for retry mechanism
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Specific delay times in milliseconds for each retry attempt */
  delaySequenceMs: number[];
  /** HTTP status codes that should trigger a retry */
  retryableStatuses: number[];
}

/**
 * Default retry configuration
 */
export const defaultRetryConfig: RetryConfig = {
  maxRetries: 4,
  delaySequenceMs: [100, 500, 1000, 5000],  // Explicit sequence as requested
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

/**
 * How long we will honour a server-supplied wait, regardless of what it asks
 * for. A hostile or buggy value must not park a caller for an hour.
 */
const MAX_RETRY_AFTER_MS = 60_000;

/**
 * How long the server asked us to wait before retrying a 429, in
 * milliseconds, or `undefined` when it did not say (or said something we do
 * not act on).
 *
 * Two shapes, because the API uses both: a standard `Retry-After` header
 * (seconds), and the same figure mirrored as `retry_after` in the JSON body,
 * which survives a proxy that strips headers. The header is checked first.
 *
 * `Retry-After` also permits an HTTP-date form. That form is deliberately
 * not parsed: a non-numeric header value falls through to the body field and,
 * failing that, to the caller's normal backoff, rather than being guessed at.
 *
 * The accepted value is clamped to {@link MAX_RETRY_AFTER_MS}.
 */
export function retryAfterMs(error: any): number | undefined {
  const response = error?.response;
  if (!response) return undefined;

  const header = response.headers?.['retry-after'] ?? response.headers?.['Retry-After'];
  if (header !== undefined && header !== null) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, MAX_RETRY_AFTER_MS);
    }
    // Non-numeric (e.g. an HTTP-date): fall through to the body field below.
  }

  const bodyValue = response.data?.retry_after;
  if (typeof bodyValue === 'number' && Number.isFinite(bodyValue) && bodyValue > 0) {
    return Math.min(bodyValue * 1000, MAX_RETRY_AFTER_MS);
  }

  return undefined;
}

/**
 * Execute an operation with retry and specified delays
 *
 * @param operation - The async operation to execute
 * @param config - Retry configuration
 * @param sleepFn - Delay function to await between attempts. Defaults to a
 *   real `setTimeout`-based sleep; tests pass a fake to run without waiting.
 * @returns Result of the operation
 * @throws Last error encountered if all retries fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  sleepFn: (ms: number) => Promise<void> = sleep
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config };
  let lastError: Error;
  // A Retry-After the previous attempt's error carried, consumed by the next
  // attempt's wait and then cleared. Without it a 429 is retried on the same
  // schedule as any other error, which is far too short for a per-minute
  // rate limit.
  let serverDelayMs = 0;

  // Try initial attempt plus retries
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // For attempts after the first one, wait using the specified delay
      if (attempt > 0) {
        const delayIndex = attempt - 1; // Adjust index to match delaySequence
        let delay = finalConfig.delaySequenceMs[delayIndex] ||
                    finalConfig.delaySequenceMs[finalConfig.delaySequenceMs.length - 1];

        // The server's own figure wins when it asked for longer than our own
        // backoff: retrying earlier than a 429 said to just spends another
        // request on the same limit.
        if (serverDelayMs > delay) {
          delay = serverDelayMs;
        }
        serverDelayMs = 0;

        await sleepFn(delay);
      }

      return await operation();
    } catch (error: any) {
      lastError = error;

      // Only retry on specified status codes or network errors
      if (error.response?.status &&
          !finalConfig.retryableStatuses.includes(error.response.status)) {
        throw error;
      }

      // Don't continue if this was the last attempt
      if (attempt === finalConfig.maxRetries) {
        throw error;
      }

      serverDelayMs = retryAfterMs(error) ?? 0;
    }
  }

  throw lastError!;
} 