# Changelog

All notable changes to the DexPaprika SDK will be documented in this file.

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