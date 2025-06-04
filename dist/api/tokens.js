"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokensAPI = void 0;
const base_1 = require("./base");
/**
 * API service for token-related endpoints.
 */
class TokensAPI extends base_1.BaseAPI {
    /**
     * Get detailed information about a specific token on a network.
     *
     * @param networkId - Network ID (e.g., "ethereum", "solana")
     * @param tokenAddress - Token address or identifier
     * @returns Detailed information about the token
     */
    async getDetails(networkId, tokenAddress) {
        return this._get(`/networks/${networkId}/tokens/${tokenAddress}`);
    }
    /**
     * Get a list of top liquidity pools for a specific token on a network.
     *
     * @param networkId - Network ID (e.g., "ethereum", "solana")
     * @param tokenAddress - Token address or identifier
     * @param options - Options for pagination, sorting, and filtering
     * @returns Response containing a list of pools that include the specified token
     */
    async getPools(networkId, tokenAddress, options) {
        var _a, _b, _c, _d;
        // build params
        const params = {
            page: (_a = options === null || options === void 0 ? void 0 : options.page) !== null && _a !== void 0 ? _a : 0,
            limit: (_b = options === null || options === void 0 ? void 0 : options.limit) !== null && _b !== void 0 ? _b : 10,
            sort: (_c = options === null || options === void 0 ? void 0 : options.sort) !== null && _c !== void 0 ? _c : 'desc',
            order_by: (_d = options === null || options === void 0 ? void 0 : options.orderBy) !== null && _d !== void 0 ? _d : 'volume_usd'
        };
        // add pair token if specified
        if (options === null || options === void 0 ? void 0 : options.pairWith)
            params['address'] = options.pairWith;
        // get pools filtered by token
        return this._get(`/networks/${networkId}/tokens/${tokenAddress}/pools`, params);
    }
}
exports.TokensAPI = TokensAPI;
