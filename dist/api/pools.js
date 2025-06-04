"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolsAPI = void 0;
const base_1 = require("./base");
const errors_1 = require("../utils/errors");
// Pools API implementation
class PoolsAPI extends base_1.BaseAPI {
    /**
     * @deprecated This method is deprecated since API v1.3.0. Use listByNetwork(network, options) instead.
     *
     * Get top pools across all networks with pagination and sorting.
     *
     * **MIGRATION REQUIRED**: This endpoint has been deprecated and will return a 410 error.
     * Please use network-specific methods instead:
     *
     * @example
     * ```typescript
     * // OLD (deprecated):
     * const pools = await client.pools.list();
     *
     * // NEW (required):
     * const ethereumPools = await client.pools.listByNetwork('ethereum');
     * const solanaPools = await client.pools.listByNetwork('solana');
     * ```
     *
     * @param options - Options for filtering, pagination and sorting
     * @returns Paginated list of pools
     * @throws {DeprecatedEndpointError} Always throws since endpoint is deprecated
     */
    async list(_options) {
        // This method now throws an error to guide users to the new approach
        throw new errors_1.DeprecatedEndpointError('/pools', 'client.pools.listByNetwork(network, options) - specify a network like \'ethereum\', \'solana\', or \'fantom\'');
    }
    /**
     * Get pools on a specific network with pagination and sorting.
     *
     * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
     * @param options - Options for filtering, pagination and sorting
     * @returns Paginated list of pools on the specified network
     */
    async listByNetwork(networkId, options) {
        var _a, _b, _c, _d;
        if (!networkId) {
            throw new Error('Network ID is required. Use \'ethereum\', \'solana\', \'fantom\', etc.');
        }
        const params = {
            page: (_a = options === null || options === void 0 ? void 0 : options.page) !== null && _a !== void 0 ? _a : 0,
            limit: (_b = options === null || options === void 0 ? void 0 : options.limit) !== null && _b !== void 0 ? _b : 10,
            sort: (_c = options === null || options === void 0 ? void 0 : options.sort) !== null && _c !== void 0 ? _c : 'desc',
            order_by: (_d = options === null || options === void 0 ? void 0 : options.orderBy) !== null && _d !== void 0 ? _d : 'volume_usd'
        };
        return this._get(`/networks/${networkId}/pools`, params);
    }
    /**
     * Get pools on a specific DEX within a network with pagination.
     *
     * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
     * @param dexId - DEX identifier (e.g., 'uniswap_v2', 'sushiswap')
     * @param options - Options for filtering, pagination and sorting
     * @returns Paginated list of pools on the specified DEX
     */
    async listByDex(networkId, dexId, options) {
        var _a, _b, _c, _d;
        if (!networkId) {
            throw new Error('Network ID is required');
        }
        if (!dexId) {
            throw new Error('DEX ID is required');
        }
        const params = {
            page: (_a = options === null || options === void 0 ? void 0 : options.page) !== null && _a !== void 0 ? _a : 0,
            limit: (_b = options === null || options === void 0 ? void 0 : options.limit) !== null && _b !== void 0 ? _b : 10,
            sort: (_c = options === null || options === void 0 ? void 0 : options.sort) !== null && _c !== void 0 ? _c : 'desc',
            order_by: (_d = options === null || options === void 0 ? void 0 : options.orderBy) !== null && _d !== void 0 ? _d : 'volume_usd'
        };
        return this._get(`/networks/${networkId}/dexes/${dexId}/pools`, params);
    }
    /**
     * Get detailed information about a specific pool.
     *
     * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
     * @param poolAddress - On-chain address of the pool
     * @param options - Additional options for pool details
     * @returns Detailed pool information
     */
    async getDetails(networkId, poolAddress, options) {
        if (!networkId) {
            throw new Error('Network ID is required');
        }
        if (!poolAddress) {
            throw new Error('Pool address is required');
        }
        const params = {};
        if (options === null || options === void 0 ? void 0 : options.inversed)
            params.inversed = 'true';
        return this._get(`/networks/${networkId}/pools/${poolAddress}`, params);
    }
    /**
     * Get OHLCV (Open-High-Low-Close-Volume) data for a pool.
     *
     * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
     * @param poolAddress - On-chain address of the pool
     * @param options - OHLCV options including time range and interval
     * @returns Time-series OHLCV data
     */
    async getOHLCV(networkId, poolAddress, options) {
        var _a, _b;
        if (!networkId) {
            throw new Error('Network ID is required');
        }
        if (!poolAddress) {
            throw new Error('Pool address is required');
        }
        const params = {
            start: options.start,
            limit: (_a = options.limit) !== null && _a !== void 0 ? _a : 1,
            interval: (_b = options.interval) !== null && _b !== void 0 ? _b : '24h'
        };
        if (options.end)
            params.end = options.end;
        if (options.inversed)
            params.inversed = 'true';
        return this._get(`/networks/${networkId}/pools/${poolAddress}/ohlcv`, params);
    }
    /**
     * Get transaction history for a specific pool.
     *
     * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
     * @param poolAddress - On-chain address of the pool
     * @param options - Pagination options
     * @returns List of pool transactions
     */
    async getTxs(networkId, poolAddress, options) {
        var _a, _b;
        if (!networkId) {
            throw new Error('Network ID is required');
        }
        if (!poolAddress) {
            throw new Error('Pool address is required');
        }
        const params = {
            page: (_a = options === null || options === void 0 ? void 0 : options.page) !== null && _a !== void 0 ? _a : 0,
            limit: (_b = options === null || options === void 0 ? void 0 : options.limit) !== null && _b !== void 0 ? _b : 10
        };
        if (options === null || options === void 0 ? void 0 : options.cursor)
            params.cursor = options.cursor;
        return this._get(`/networks/${networkId}/pools/${poolAddress}/transactions`, params);
    }
    /**
     * Alternative method name for getTransactions
     *
     * @param networkId - Network identifier (e.g., 'ethereum', 'solana')
     * @param poolAddress - On-chain address of the pool
     * @param options - Pagination options
     * @returns List of pool transactions
     */
    getTransactions(networkId, poolAddress, options) {
        return this.getTxs(networkId, poolAddress, options);
    }
}
exports.PoolsAPI = PoolsAPI;
