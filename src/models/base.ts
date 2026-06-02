// We'll need to import these types to avoid reference errors
import { Dex } from './dexes';
import { Pool, FilteredPool } from './pools';

// page info for pagination
export interface PageInfo {
  limit: number;
  page: number;
  total_items?: number; // might be missing in some responses
  total_pages?: number; // might be missing in some responses
  next_cursor?: string; // for cursor pagination
}

// generic paginated response
export interface PaginatedResponse<T> {
  items: T[];
  page_info: PageInfo;
}

// dex list response
export interface DexPaginatedResponse {
  dexes: Dex[];
  page_info: PageInfo;
}

// pool list response
export interface PoolPaginatedResponse {
  pools: Pool[];
  page_info: PageInfo;
}

// pool filter response (uses 'results' key)
export interface PoolFilterPaginatedResponse {
  results: FilteredPool[];
  page_info: PageInfo;
}