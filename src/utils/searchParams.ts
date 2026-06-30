// Shared, pure helpers for the unified search endpoints
// (/networks/{network}/pools/search and /networks/{network}/tokens/search).
//
// The search endpoints return HTTP 400 on legacy sort-field values and legacy
// filter param names, so every value/name coming from the public option types
// (which stay backward-compatible) must be mapped to its canonical form here.

// ---------------------------------------------------------------------------
// Sort-field value mapping (legacy or canonical -> canonical order_by value).
// ---------------------------------------------------------------------------

// Pools: legacy aliases plus canonical pass-through. Unknown -> default.
const POOL_SORT_FIELD_MAP: Record<string, string> = {
  // legacy -> canonical
  volume_usd: 'volume_usd_24h',
  transactions: 'txns_24h',
  last_price_change_usd_24h: 'price_change_percentage_24h',
  volume_24h: 'volume_usd_24h',
  volume_7d: 'volume_usd_7d',
  volume_30d: 'volume_usd_30d',
  liquidity: 'liquidity_usd',
  // canonical pass-through
  volume_usd_24h: 'volume_usd_24h',
  volume_usd_7d: 'volume_usd_7d',
  volume_usd_30d: 'volume_usd_30d',
  liquidity_usd: 'liquidity_usd',
  txns_24h: 'txns_24h',
  created_at: 'created_at',
  price_usd: 'price_usd',
  price_change_percentage_24h: 'price_change_percentage_24h',
};

// Tokens: legacy aliases plus canonical pass-through. Unknown -> default.
// Note: tokens/search returns 400 on price ordering, so price_usd folds to the
// default volume_usd_24h.
const TOKEN_SORT_FIELD_MAP: Record<string, string> = {
  // legacy -> canonical
  volume_24h: 'volume_usd_24h',
  txns: 'txns_24h',
  price_change: 'price_change_percentage_24h',
  fdv: 'fdv_usd',
  volume_7d: 'volume_usd_7d',
  volume_30d: 'volume_usd_30d',
  price_usd: 'volume_usd_24h',
  // canonical pass-through
  volume_usd_24h: 'volume_usd_24h',
  volume_usd_7d: 'volume_usd_7d',
  volume_usd_30d: 'volume_usd_30d',
  liquidity_usd: 'liquidity_usd',
  txns_24h: 'txns_24h',
  fdv_usd: 'fdv_usd',
  created_at: 'created_at',
  price_change_percentage_24h: 'price_change_percentage_24h',
};

const DEFAULT_SORT_FIELD = 'volume_usd_24h';

/**
 * Map a pool sort field (legacy or canonical) to the canonical order_by value
 * accepted by /networks/{network}/pools/search. Unknown or missing -> default.
 */
export function mapPoolSortField(value?: string): string {
  if (!value) return DEFAULT_SORT_FIELD;
  return POOL_SORT_FIELD_MAP[value] ?? DEFAULT_SORT_FIELD;
}

/**
 * Map a token sort field (legacy or canonical) to the canonical order_by value
 * accepted by /networks/{network}/tokens/search. Unknown or missing -> default.
 */
export function mapTokenSortField(value?: string): string {
  if (!value) return DEFAULT_SORT_FIELD;
  return TOKEN_SORT_FIELD_MAP[value] ?? DEFAULT_SORT_FIELD;
}

// ---------------------------------------------------------------------------
// Filter param NAME mapping (legacy query param name -> canonical search param).
// Unmapped names pass through unchanged.
// ---------------------------------------------------------------------------

const POOL_FILTER_PARAM_MAP: Record<string, string> = {
  volume_24h_min: 'volume_usd_24h_min',
  volume_24h_max: 'volume_usd_24h_max',
  volume_7d_min: 'volume_usd_7d_min',
  volume_7d_max: 'volume_usd_7d_max',
};

const TOKEN_FILTER_PARAM_MAP: Record<string, string> = {
  volume_24h_min: 'volume_usd_24h_min',
  volume_24h_max: 'volume_usd_24h_max',
};

function remapKeys(
  params: Record<string, any>,
  map: Record<string, string>
): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(params)) {
    out[map[key] ?? key] = value;
  }
  return out;
}

/**
 * Rename legacy pool filter param names to the canonical pools/search names.
 * Names not in the map (e.g. liquidity_usd_min, txns_24h_min) pass through.
 */
export function mapPoolFilterParams(params: Record<string, any>): Record<string, any> {
  return remapKeys(params, POOL_FILTER_PARAM_MAP);
}

/**
 * Rename legacy token filter param names to the canonical tokens/search names.
 * Names not in the map (e.g. liquidity_usd_min, fdv_min) pass through.
 */
export function mapTokenFilterParams(params: Record<string, any>): Record<string, any> {
  return remapKeys(params, TOKEN_FILTER_PARAM_MAP);
}
