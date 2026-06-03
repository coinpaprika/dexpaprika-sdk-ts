// We'll need to import these types to avoid reference errors
import { Dex } from './dexes';
import { Pool, FilteredPool, PoolRow } from './pools';

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

// Response from the advanced pool search endpoint (/frontend/v1/pools and
// /frontend/v1/networks/{network}/pools). Unlike the other pool endpoints this
// one is CURSOR-paginated: there is no page_info, you walk pages by passing
// next_cursor back in as `cursor` while has_next_page is true.
export interface AdvancedPoolSearchResponse {
  // Matching pools. Defaults to an empty array if the API omits the key.
  results: PoolRow[];
  // True while there is another page to fetch.
  has_next_page?: boolean;
  // Opaque cursor for the next page; null on the last page.
  next_cursor?: string | null;
  // Echo of the (wire-name) query parameters the API actually applied.
  query?: Record<string, unknown>;
}