# Changelog

All notable changes to the DexPaprika SDK will be documented in this file.

## [1.12.1] - 2026-09-29

### Fixed
- `pools.getOHLCV()` and `tokens.getOHLCV()` return `volume: 0` for a candle the API sent without `volume`. The API leaves the field out when a candle's USD volume rounds down to 0, which happens on quiet minutes even for large tokens, so a record typed `volume: number` arrived with `volume` undefined.
- A 5xx answered by the edge in front of the API carries `{"error": {"code", "message"}}`. `ApiError` now shows that message instead of `API Error (500): [object Object]`.

## [1.12.0] - 2026-09-29

### Added
- `tokens.getOHLCV(networkId, tokenAddress, options)`: OHLCV candles for a token, priced in USD from a volume-weighted price across every pool the token trades in on the network, with volume summed the same way. Same record shape as `pools.getOHLCV()` (`OHLCVRecord`, reused as-is). `TokenOHLCVOptions` takes `start` (required), `end`, `limit` and `interval`, the same shapes as `pools.getOHLCV()`, but has no `inversed` field: a token candle is a single USD price series, not a ratio between two tokens, so there is nothing to invert.
- This endpoint requires a Dev, Pro or Enterprise plan and must be called against `api-pro.dexpaprika.com` with the key as the whole `Authorization` value; keyless and free keys get HTTP 403, and `tokens.getOHLCV()` surfaces the API's own message on the thrown `ApiError`, the same as the rest of the SDK's error handling. Dev history is limited to the last 30 days. See "Token OHLCV Data" in the README.

### Changed
- `pools.getOHLCV()` without a `limit` now asks for 10 candles, the API's own default, instead of 1. Pass `limit` to get any other number.

## [1.11.1] - 2026-09-28

Pool transactions and multi-prices are typed the way the API answers.

### Fixed
- `pools.getTransactions()` and `pools.getTxs()` returned `Promise<unknown>`, so TypeScript callers needed a cast to read `.transactions`. They now return `Promise<TransactionsResponse>`: `transactions` plus `page_info`. `TransactionsResponse` no longer claims an `items` array, which the API never sent.
- `Transaction` gains the fields the API has been returning: `created_at`, `created_at_block_hash`, `chain`, `factory_id`, `token_0_symbol`, `token_1_symbol`, `volume_0`, `volume_1`, `price_0`, `price_1`, `price_0_usd`, `price_1_usd` and `canonical_chain`. All optional. The doc comments on `amount_0` and `amount_1` note that the raw integer can exceed `Number.MAX_SAFE_INTEGER`; use `volume_0` and `volume_1` for display.
- `TokenPrice` from `tokens.getMultiPrices()` gains `last_updated`.

Nothing changes at runtime: the response bodies were already passed through whole.

### Added
- `npm run typecheck:tests` and `npm run test:types`, both run in CI. They compile and run `tests/test-transactions-type.ts` against recorded responses, so a return type that slides back to `unknown` fails the build.

## [1.11.0] - 2026-09-28

Time filters on transactions and search take relative times.

### Added
- `TransactionOptions.from` and `to` accept a string as well as a number: a relative offset from now such as `'-1h'` or `'-24h'`, RFC3339 or `YYYY-MM-DD`, next to Unix seconds. `getTransactions('ethereum', pool, { from: '-1h' })` returns the last hour of trades. The API accepts these shapes since 2026-09-28.
- `createdAfter` and `createdBefore` on `pools.filter()` and `tokens.filter()` already took a string; their documentation now lists the same shapes, so `createdAfter: '-24h'` returns what was created in the last day.

Unix seconds keep working unchanged.

## [1.10.1] - 2026-09-25

OHLCV availability now depends on your plan. Nothing in the SDK's API surface changes; this release updates the documentation and examples so they work without a key.

### API changes this release documents
- **OHLCV history depth and candle interval are per plan since 2026-09-25.** Without a key: the last 24 hours at `1h`, `6h`, `12h` and `24h`. Free key: 7 days at `10m` and longer (`1m` and `5m` are paid). Dev: 30 days at every interval. Pro and Enterprise: unlimited. A `start` or `end` outside the window, or a finer interval than the plan allows, is answered with `403`; `getOHLCV` throws an `ApiError` whose message names the plan that lifts the limit. See [OHLCV limits by plan](https://docs.dexpaprika.com/knowledge-base/rate-limits#ohlcv-limits-by-plan).
- **`start` and `end` accept a relative offset from now:** `-24h`, `-7d`, `-90m`, `-30s`. `start: '-24h'` selects the last 24 hours, which every plan may query. `OHLCVOptions.start` is a string, so this works in 1.10.0 too.
- A missing or malformed `start` or `end` is answered with `400`.

### Changed
- The README examples asked for `2023-01-01` to `2023-01-07` and for a week of daily candles, both of which now return 403 without a key. They use `start: '-24h'` with hourly candles.
- `OHLCVOptions` and `getOHLCV` doc comments describe the relative offset and the per-plan window.
- `examples/basic-example.ts` and `tests/test-basic.ts` request the last 24 hours instead of the last week.

## [1.10.0] - 2026-08-14

### Added
- **Optional API key.** `new DexPaprikaClient(baseUrl, options, { apiKey })`, falling back to the `DEXPAPRIKA_API_KEY` environment variable when none is passed. Keyless remains the default and is unchanged: without a key the client sends exactly what it sent before. The key is transmitted as the **entire** `Authorization` value, with no `Bearer` prefix and no other scheme word, because the API checksums the raw header and a scheme word returns 401.
- `resolveApiKey` is exported so callers can reuse the same precedence and validation.
- The host is never inferred from the presence of a key. Free keys are served from the default `baseUrl` and only Pro moves to `api-pro.dexpaprika.com`, which callers pass as `baseUrl`. Sending a free key to the Pro host returns 403.

### Fixed
- **The User-Agent was pinned to `DexPaprika-SDK-JavaScript/0.1.0`** while the package shipped 1.9.0, so every request misreported which version sent it and no rollout could be measured. It is now derived from a `VERSION` constant in `src/version.ts`, with a test that fails if that constant drifts from `package.json`. `rootDir` is `./src`, so importing `package.json` directly would break the build; the test is the guard instead.

### Notes
- Reading the environment is guarded rather than assumed, so the package no longer touches `process` unconditionally and can be bundled for the browser.
- New `npm run test:unit`, covering the bare-key format against five scheme words, keyless behaviour, precedence, whitespace trimming, rejection of keys carrying header-injection characters, and the host rules.

## 1.9.0 (2026-08-13)

### Breaking Changes
- The DexPaprika API removed `GET /networks/{network}/dexes/{dex}/pools` (now HTTP 410). `pools.listByDex()` now calls the unified `/networks/{network}/pools/search` endpoint and sends the DEX as the `dex_name` query parameter. The arguments are unchanged.
- `pools.listByDex()` returns `PoolSearchResponse`, the cursor-paginated shape `{ results, has_next_page, next_cursor }`, instead of `{ pools, page_info }`. This is a return-type change: code reading `.pools` or `.page_info` from it will not compile. Read the next page from `next_cursor` and pass it back via `cursor` (`page` is ignored).
- Rows are the search shape: `volume_usd_24h`, `volume_usd_7d`, `volume_usd_30d`, `transactions_24h`, `liquidity_usd` and `price_change_percentage_*`. The API no longer returns a bare `volume_usd`, a bare `transactions`, or the `last_price_change_usd_*` fields on pool rows.
- Despite its name, `dex_name` matches the DEX **id** (case-insensitively), which is what `client.networks.getDexes()` returns as `dex_id`. Passing a human display name such as `Uniswap V3` (the `dex_name` field of that same response) returns HTTP 200 with an empty result set instead of an error, so a wrong value here fails silently. Legacy `orderBy` values (e.g. `volume_usd`) are mapped to canonical sort fields internally.
- `PoolPaginatedResponse` is deprecated. No pools endpoint returns that shape any more.

### Added
- `SearchPool.price_change_percentage_6h`, which `/pools/search` returns but the SDK type was omitting.
- `npm run test:dex-pools`, which pins the request `listByDex` puts on the wire and checks both directions against the live API.

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