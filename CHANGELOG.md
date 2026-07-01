# Changelog

All notable changes to the DexPaprika SDK will be documented in this file.

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