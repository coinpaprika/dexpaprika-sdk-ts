"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAPI = void 0;
const errors_1 = require("../utils/errors");
// base for api classes
class BaseAPI {
    /**
     * Initialize a new API service.
     *
     * @param client - DexPaprika client instance
     */
    constructor(client) {
        this.client = client;
    }
    /**
     * Make a GET request with enhanced error handling.
     *
     * @param endpoint - API endpoint
     * @param params - Query parameters
     * @returns Response data
     * @throws {DeprecatedEndpointError} If endpoint returns 410 Gone
     * @throws {NetworkNotFoundError} If network is not found
     * @throws {PoolNotFoundError} If pool is not found
     * @throws {ApiError} For other API errors
     * @throws {DexPaprikaError} For general SDK errors
     */
    async _get(endpoint, params) {
        var _a, _b, _c;
        try {
            return await this.client.get(endpoint, params);
        }
        catch (error) {
            // Handle HTTP errors
            if (error.response) {
                const status = error.response.status;
                const message = ((_a = error.response.data) === null || _a === void 0 ? void 0 : _a.error) || ((_b = error.response.data) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown API error';
                // Handle deprecated endpoint (410 Gone)
                if (status === 410) {
                    if (endpoint === '/pools') {
                        throw new errors_1.DeprecatedEndpointError('/pools', 'network-specific endpoints like client.pools.listByNetwork(\'ethereum\')');
                    }
                    throw new errors_1.DeprecatedEndpointError(endpoint, 'check API documentation for alternatives');
                }
                // Handle not found errors with context
                if (status === 404) {
                    if (message.toLowerCase().includes('network')) {
                        const networkId = (params === null || params === void 0 ? void 0 : params.network) || ((_c = endpoint.match(/\/networks\/([^\/]+)/)) === null || _c === void 0 ? void 0 : _c[1]) || 'unknown';
                        throw new errors_1.NetworkNotFoundError(networkId);
                    }
                    if (message.toLowerCase().includes('pool') || endpoint.includes('/pools/')) {
                        const poolAddress = endpoint.split('/').pop() || 'unknown';
                        throw new errors_1.PoolNotFoundError(poolAddress);
                    }
                }
                throw new errors_1.ApiError(message, status);
            }
            // Handle network/connection errors
            throw new errors_1.DexPaprikaError(error.message || 'Unknown error occurred');
        }
    }
    /**
     * Make a POST request.
     *
     * @param endpoint - API endpoint
     * @param data - Request body
     * @param params - Query parameters
     * @returns Response data
     */
    async _post(endpoint, data, params) {
        return this.client.post(endpoint, data, params);
    }
}
exports.BaseAPI = BaseAPI;
