"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = exports.defaultCacheConfig = void 0;
/**
 * Default cache configuration
 */
exports.defaultCacheConfig = {
    ttl: 5 * 60 * 1000, // 5 minutes default
    maxSize: 1000, // Default max size
    enabled: true // Enabled by default
};
/**
 * Simple LRU cache implementation with TTL
 */
class Cache {
    /**
     * Create a new cache instance
     *
     * @param config - Cache configuration options
     */
    constructor(config = {}) {
        this.config = {
            ...exports.defaultCacheConfig,
            ...config
        };
        this.store = new Map();
    }
    /**
     * Store a value in the cache
     *
     * @param key - Cache key
     * @param value - Value to store
     */
    set(key, value) {
        if (!this.config.enabled)
            return;
        // If at capacity, remove least recently used item
        if (this.store.size >= this.config.maxSize) {
            this.evictLRU();
        }
        const now = Date.now();
        this.store.set(key, {
            data: value,
            expiresAt: now + this.config.ttl,
            lastAccessed: now
        });
    }
    /**
     * Retrieve a value from the cache
     *
     * @param key - Cache key
     * @returns The stored value or undefined if not found or expired
     */
    get(key) {
        if (!this.config.enabled)
            return undefined;
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        const now = Date.now();
        // Check if entry is expired
        if (now > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        // Update last accessed time for LRU tracking
        entry.lastAccessed = now;
        return entry.data;
    }
    /**
     * Check if a key exists in the cache and is not expired
     *
     * @param key - Cache key
     * @returns True if key exists and is not expired
     */
    has(key) {
        if (!this.config.enabled)
            return false;
        const entry = this.store.get(key);
        if (!entry)
            return false;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return false;
        }
        return true;
    }
    /**
     * Remove an item from the cache
     *
     * @param key - Cache key
     * @returns True if the item was in the cache
     */
    delete(key) {
        return this.store.delete(key);
    }
    /**
     * Clear all items from the cache
     */
    clear() {
        this.store.clear();
    }
    /**
     * Get the number of items in the cache
     */
    get size() {
        return this.store.size;
    }
    /**
     * Remove the least recently accessed item
     * @private
     */
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Infinity;
        // Find the least recently used item
        for (const [key, entry] of this.store.entries()) {
            if (entry.lastAccessed < oldestTime) {
                oldestTime = entry.lastAccessed;
                oldestKey = key;
            }
        }
        // Remove it if found
        if (oldestKey !== null) {
            this.store.delete(oldestKey);
        }
    }
}
exports.Cache = Cache;
