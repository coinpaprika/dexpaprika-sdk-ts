"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DexesAPI = void 0;
const base_1 = require("./base");
/**
 * API service for DEX-related endpoints.
 */
class DexesAPI extends base_1.BaseAPI {
    /**
     * Get a list of DEXes on a specific network.
     *
     * @param networkId - Network ID (e.g., "ethereum", "solana")
     * @param options - Pagination options
     * @returns Paginated response containing a list of DEXes on the network
     */
    async listByNetwork(networkId, options) {
        var _a, _b;
        const params = {
            page: (_a = options === null || options === void 0 ? void 0 : options.page) !== null && _a !== void 0 ? _a : 0,
            limit: (_b = options === null || options === void 0 ? void 0 : options.limit) !== null && _b !== void 0 ? _b : 10
        };
        return this._get(`/networks/${networkId}/dexes`, params);
    }
}
exports.DexesAPI = DexesAPI;
