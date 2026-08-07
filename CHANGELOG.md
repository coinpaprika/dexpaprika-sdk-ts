# Changelog

All notable changes to the DexPaprika SDK will be documented in this file.

## 1.8.0 (2026-08-07)

### Added
- `pools.filter()` accepts price-change bounds on all four windows the pools/search endpoint supports: `priceChange24hMin`/`Max`, `priceChange6hMin`/`Max`, `priceChange1hMin`/`Max`, `priceChange5mMin`/`Max`. Values are percentages and negative bounds are meaningful, so `priceChange24hMax: -20` selects pools down at least a fifth on the day.
- `tokens.filter()` accepts `priceChange24hMin`/`Max`. The 24h window is the one price-change bound `/networks/{network}/tokens/search` applies.
- `price_change_percentage_6h`, `price_change_percentage_1h` and `price_change_percentage_5m` are accepted as pool sort fields (`orderBy`/`sortBy`) and reach the API unchanged.
- `SearchPool` gained the `price_change_percentage_6h` field that pool rows already return.

### Fixed
- The test scripts run again. They invoked `ts-node`, which fails to start against the TypeScript 7 this SDK builds with, so `npm test` and every script chained after it died before executing anything. They now run under `tsx`, and `ts-node` is gone from the devDependencies.

### Notes
- The three short windows, 6h, 1h and 5m, exist on pools only, and they fail two different ways on `/networks/{network}/tokens/search`: HTTP 400 as a sort value, silently ignored as a filter bound. `TOKEN_SORT_FIELD_MAP` leaves them out on purpose and folds them to the default `volume_usd_24h`, and `TokenFilterOptions` does not offer them. The 24h window works on both endpoints, for sorting and for filtering.
- Both search endpoints answer 200 for query parameters they do not recognize and then ignore them, so a bound the SDK spelled wrong would come back as a full unfiltered page. `tests/test-search-params.ts` pins the exact parameter names the SDK puts on the wire without touching the network.

## 1.7.0 (2026-07-15)

### Breaking Changes
- The DexPaprika API removed `GET /networks/{network}/tokens/{address}/pools` (now HTTP 410). `tokens.getPools()` now calls the unified `/networks/{network}/pools/search` endpoint with its new `token_address` parameter.
- `tokens.getPools()` returns the cursor-paginated search shape `{ results, has_next_page, next_cursor }` instead of `{ pools, page_info }`. Read the next page from `next_cursor` and pass it back via `cursor` (`page` is ignored).
- The token filter is network-scoped only: the cross-network `/pools/search` endpoint accepts `token_address` but silently ignores it, so a network is always required.
- `TokenPoolsOptions.pairWith` is deprecated and ignored: `/pools/search` has no pair filter. Repeating `token_address` does not act as a pair filter; the API uses only one of the values (not guaranteed by order). Filter the returned pools client-side by their `tokens` field to match a pair.
- The old `reorder` pair-perspective flip has no equivalent on `/pools/search`; metrics come from the pool's own perspective.
- An unknown token address returns HTTP 200 with an empty result set, not an error. Legacy `orderBy` values (e.g. `volume_usd`) are mapped to canonical sort fields internally.

## 1.6.1 (2026-07-01)

### Changed
- **`DeprecatedEndpointError` now surfaces the API replacement**: on an error whose body carries a `replacement` field, the thrown error includes the API's own message and points at the real replacement path (not just the hardcoded `/pools` alternative), and exposes `.replacement` / `.apiMessage` accessors. Generic across any error status carrying a `replacement`.

## 1.6.0 (2026-06-30)

### Breaking Changes
- The DexPaprika API removed four REST endpoints (now HTTP 410): `/networks/{network}/pools`, `/networks/{network}/pools/filter`, `/networks/{network}/tokens/top`, and `/networks/{network}/tokens/filter`.
- `pools.listByNetwork()`, `pools.filter()`, `tokens.getTop()`, and `tokens.filter()` now call the unified search endpoints `/networks/{network}/pools/search` and `/networks/{network}/tokens/search`.
- These four methods now return the cursor-paginated search shape: `{ results, has_next_page, next_cursor }` instead of `{ pools | tokens, page_info }`. Read the next page from `next_cursor` and pass it back via the new `cursor` option (`page` is ignored).
- Item field changes: pool results expose `volume_usd_24h`/`volume_usd_7d`/`volume_usd_30d`, `liquidity_usd`, `transactions_24h`, and `price_change_percentage_5m`/`1h`/`24h` (the flat `volume_usd`, `transactions`, and `last_price_change_usd_*` fields are gone). Pool `tokens` are lean refs (`id`, `chain`, `has_image`) by default; `name`/`symbol`/`decimals` are typed as optional. Token results are flat (`address`, `volume_usd_24h`, `fdv_usd`, `txns_24h`, `price_change_percentage_24h`, ...) with no `name`/`symbol`/nested timeframe objects.

### Changed
- Public method signatures and option types are unchanged for back-compat: legacy `orderBy`/`sortBy` values (e.g. `volume_usd`, `volume_24h`, `txns`, `fdv`, `price_change`) and legacy filter param names are mapped to canonical search fields/params internally.
- Added `cursor` to `PoolListOptions`, `PoolFilterOptions`, `TopTokensOptions`, and `TokenFilterOptions`.

### Removed
- Dead types from the old top-tokens response: `TopToken`, `TopTokenTimeMetrics`, `TopTokensPaginatedResponse`.

### Added
- New TypeScript interfaces: `SearchPool`, `PoolTokenRef`, `PoolSearchResponse`, `SearchToken`, `TokenSearchResponse`. `FilteredPool`/`FilteredToken` and `PoolFilterPaginatedResponse`/`TokenFilterPaginatedResponse` are retained as back-compat aliases.

## 1.5.0 (2026-03-31)

### Added
- **Pool filtering**: `pools.filter()` method for advanced pool filtering by volume, liquidity, transactions, and creation date
- **Top tokens**: `tokens.getTop()` method for discovering top tokens on a network ranked by volume, price, liquidity, or other metrics
- **Token filtering**: `tokens.filter()` method for filtering tokens by volume, liquidity, FDV, transactions, and creation date
- **Batch prices**: `tokens.getMultiPrices()` method for getting prices of up to 10 tokens in a single request
- New TypeScript interfaces: `PoolFilterOptions`, `TopTokensOptions`, `TokenFilterOptions`, `PoolFilterPaginatedResponse`, `TopToken`, `TopTokenTimeMetrics`, `TopTokensPaginatedResponse`, `FilteredToken`, `TokenFilterPaginatedResponse`, `TokenPrice`
- Optional `volume_usd_7d` and `liquidity_usd` fields on `Pool` interface
- Test suite for all new endpoints

### Changed
- Pool price change fields are now optional (nullable) to match API behavior
- Updated SDK version to 1.5.0

## 1.4.0 (2025-01-27) - API v1.3.0 Support

### Breaking Changes
- **DEPRECATED**: Global `pools.list()` method due to API changes
- **MIGRATION REQUIRED**: All pool queries now require network specification

### Added
- New error classes for better error handling:
  - `DeprecatedEndpointError` for deprecated endpoints
  - `NetworkNotFoundError` for invalid networks
  - `PoolNotFoundError` for pool lookup failures
  - `ApiError` for general API errors
  - `DexPaprikaError` as base error class
- Enhanced error handling for 410 Gone responses from deprecated endpoints
- Better parameter validation in all pool-related methods

### Changed
- `pools.list()` now throws `DeprecatedEndpointError` with migration guidance
- Improved error messages with specific migration instructions
- Enhanced JSDoc documentation with deprecation warnings

### Migration Guide
```typescript
// OLD (deprecated) - will throw DeprecatedEndpointError:
const pools = await client.pools.list();

// NEW (required) - specify network:
const ethereumPools = await client.pools.listByNetwork('ethereum');
const solanaPools = await client.pools.listByNetwork('solana');
const fantomPools = await client.pools.listByNetwork('fantom');

// Using options:
const pools = await client.pools.listByNetwork('ethereum', {
  page: 0,
  limit: 20,
  sort: 'desc',
  orderBy: 'volume_usd'
});
```

For more information about the API changes, visit: https://docs.dexpaprika.com/changelog/changelog

## 1.3.2 (2025-05-03)

### Changed
- Updated dependencies to latest versions

## 1.3.0 (2025-04-24)

### Added
- Added new options-based parameter system for all methods
- Added TypeScript interfaces for all API options in `options.ts`
- Improved JSDoc documentation for all methods and parameters
- Exported response and options types from the main package

### Changed
- Methods now accept options objects instead of positional parameters
  - `pools.list(page, limit, sort, orderBy)` → `pools.list(options)`
  - `pools.listByNetwork(networkId, page, limit, sort, orderBy)` → `pools.listByNetwork(networkId, options)`
  - `pools.getOHLCV(...)` → `pools.getOHLCV(networkId, poolAddress, options)`
  - And other similar methods
- Default values are now handled more consistently

### Fixed
- Improved parameter naming consistency across methods
- Better type safety for API parameters

## 1.1.0 (2025-04-10)

### Added
- Added support for new API endpoints
- Improved error handling with specific error types
- Enhanced type definitions for better TypeScript support

### Fixed
- Fixed caching mechanism for better performance
- Resolved issues with pagination in some endpoints

## 1.0.0 (2025-03)

### Added
- Initial release of the DexPaprika SDK
- Support for all core API endpoints
- Built-in caching and retry mechanisms
- TypeScript definitions
- Comprehensive documentation 