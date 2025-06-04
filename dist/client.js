"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DexPaprikaClient = void 0;
const axios_1 = __importDefault(require("axios"));
const networks_1 = require("./api/networks");
const pools_1 = require("./api/pools");
const tokens_1 = require("./api/tokens");
const search_1 = require("./api/search");
const utils_1 = require("./api/utils");
const dexes_1 = require("./api/dexes");
const helpers_1 = require("./utils/helpers");
const cache_1 = require("./utils/cache");
// Main client class
class DexPaprikaClient {
    constructor(baseUrl = 'https://api.dexpaprika.com', options = {}, config = {}) {
        this.baseUrl = baseUrl.replace(/\/+$/, '');
        // Initialize configs with defaults
        this.retryConfig = { ...helpers_1.defaultRetryConfig, ...config.retry };
        this.cache = new cache_1.Cache(config.cache);
        // Initialize HTTP client
        this.httpClient = axios_1.default.create({
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'DexPaprika-SDK-JavaScript/0.1.0',
                ...options.headers,
            },
        });
        // Initialize API instances
        this.networks = new networks_1.NetworksAPI(this);
        this.pools = new pools_1.PoolsAPI(this);
        this.tokens = new tokens_1.TokensAPI(this);
        this.search = new search_1.SearchAPI(this);
        this.utils = new utils_1.UtilsAPI(this);
        this.dexes = new dexes_1.DexesAPI(this);
    }
    /**
     * Generate a cache key from endpoint and params
     * @private
     */
    getCacheKey(endpoint, params) {
        return `${endpoint}:${JSON.stringify(params || {})}`;
    }
    /**
     * Make a GET request with caching and retry
     *
     * @param endpoint - API endpoint
     * @param params - Query parameters
     * @returns Response data
     */
    async get(endpoint, params) {
        const cacheKey = this.getCacheKey(endpoint, params);
        // Check cache first
        const cachedData = this.cache.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }
        // If not in cache, fetch with retry
        const operation = async () => {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await this.httpClient.get(url, { params });
            // Cache the result
            this.cache.set(cacheKey, response.data);
            return response.data;
        };
        return (0, helpers_1.withRetry)(operation, this.retryConfig);
    }
    /**
     * Make a POST request with retry (not cached)
     *
     * @param endpoint - API endpoint
     * @param data - Request body
     * @param params - Query parameters
     * @returns Response data
     */
    async post(endpoint, data, params) {
        const operation = async () => {
            const url = `${this.baseUrl}${endpoint}`;
            const response = await this.httpClient.post(url, data, { params });
            return response.data;
        };
        return (0, helpers_1.withRetry)(operation, this.retryConfig);
    }
    /**
     * Clear all cached data
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get current cache size
     */
    get cacheSize() {
        return this.cache.size;
    }
    /**
     * Check if caching is enabled
     */
    get isCacheEnabled() {
        return this.cache.config.enabled;
    }
    /**
     * Enable or disable cache
     */
    setCacheEnabled(enabled) {
        this.cache.config.enabled = enabled;
    }
}
exports.DexPaprikaClient = DexPaprikaClient;
