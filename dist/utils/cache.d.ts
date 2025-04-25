/**
 * Configuration for the cache
 */
export interface CacheConfig {
    /** Time to live in milliseconds */
    ttl: number;
    /** Maximum number of items in cache */
    maxSize: number;
    /** Whether caching is enabled (default: true) */
    enabled: boolean;
}
/**
 * Default cache configuration
 */
export declare const defaultCacheConfig: CacheConfig;
/**
 * Simple LRU cache implementation with TTL
 */
export declare class Cache<T = any> {
    private store;
    private config;
    /**
     * Create a new cache instance
     *
     * @param config - Cache configuration options
     */
    constructor(config?: Partial<CacheConfig>);
    /**
     * Store a value in the cache
     *
     * @param key - Cache key
     * @param value - Value to store
     */
    set(key: string, value: T): void;
    /**
     * Retrieve a value from the cache
     *
     * @param key - Cache key
     * @returns The stored value or undefined if not found or expired
     */
    get(key: string): T | undefined;
    /**
     * Check if a key exists in the cache and is not expired
     *
     * @param key - Cache key
     * @returns True if key exists and is not expired
     */
    has(key: string): boolean;
    /**
     * Remove an item from the cache
     *
     * @param key - Cache key
     * @returns True if the item was in the cache
     */
    delete(key: string): boolean;
    /**
     * Clear all items from the cache
     */
    clear(): void;
    /**
     * Get the number of items in the cache
     */
    get size(): number;
    /**
     * Remove the least recently accessed item
     * @private
     */
    private evictLRU;
}
