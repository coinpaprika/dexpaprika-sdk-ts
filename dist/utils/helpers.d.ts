/**
 * Format currency with appropriate suffix
 */
export declare const formatVolume: (vol: number) => string;
export declare function parseDate(input: string | number): Date;
export declare function formatPair(token0: string, token1: string): string;
export declare const parseError: (err: any) => any;
export declare const now: () => number;
export declare const yesterday: () => number;
export declare const lastWeek: () => number;
export declare const sleep: (ms: number) => Promise<unknown>;
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
export declare const defaultRetryConfig: RetryConfig;
/**
 * Execute an operation with retry and specified delays
 *
 * @param operation - The async operation to execute
 * @param config - Retry configuration
 * @returns Result of the operation
 * @throws Last error encountered if all retries fail
 */
export declare function withRetry<T>(operation: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T>;
