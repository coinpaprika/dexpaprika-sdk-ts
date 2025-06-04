import { DexPaprikaClient } from '../client';
export declare class BaseAPI {
    protected client: DexPaprikaClient;
    /**
     * Initialize a new API service.
     *
     * @param client - DexPaprika client instance
     */
    constructor(client: DexPaprikaClient);
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
    protected _get<T>(endpoint: string, params?: Record<string, any>): Promise<T>;
    /**
     * Make a POST request.
     *
     * @param endpoint - API endpoint
     * @param data - Request body
     * @param params - Query parameters
     * @returns Response data
     */
    protected _post<T>(endpoint: string, data: Record<string, any>, params?: Record<string, any>): Promise<T>;
}
