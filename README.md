# DexPaprika SDK

[![npm version](https://img.shields.io/npm/v/dexpaprika-sdk.svg)](https://www.npmjs.com/package/dexpaprika-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official JavaScript client library for the [DexPaprika API](https://api.dexpaprika.com), providing easy access to decentralized exchange data across multiple blockchain networks.

Developed and maintained by [Coinpaprika](https://coinpaprika.com).

## Installation

```bash
npm install dexpaprika-sdk
```

## Important: API v1.3.0 Migration Notice

**⚠️ Breaking Changes in v1.4.0**: The global pools endpoint has been deprecated. All pool queries now require a network specification.

```javascript
// ❌ OLD (deprecated) - will throw DeprecatedEndpointError:
const pools = await client.pools.list();

// ✅ NEW (required) - specify network:
const ethereumPools = await client.pools.listByNetwork('ethereum');
const solanaPools = await client.pools.listByNetwork('solana');
```

## Usage

```javascript
import { DexPaprikaClient } from 'dexpaprika-sdk';

// Create client
const client = new DexPaprikaClient();

// Get supported networks
const networks = await client.networks.list();
console.log(networks);

// Get top pools on Ethereum
const pools = await client.pools.listByNetwork('ethereum', {
  page: 0,
  limit: 10
});
console.log(pools.pools);

// Search for tokens
const results = await client.search.search('bitcoin');
console.log(`Found ${results.tokens.length} tokens`);
```

## Options Pattern API

The DexPaprika SDK uses an options pattern for API method parameters, which provides better flexibility, readability, and extensibility:

```javascript
import { DexPaprikaClient } from 'dexpaprika-sdk';

const client = new DexPaprikaClient();

// Get top pools with pagination and sorting
const pools = await client.pools.listByNetwork('ethereum', {
  page: 0,
  limit: 10,
  sort: 'desc',
  orderBy: 'volume_usd'
});

// Get pool details with options
const poolDetails = await client.pools.getDetails(
  'ethereum', 
  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
  { inversed: false }
);

// Get token pools with additional filters
const tokenPools = await client.tokens.getPools(
  'ethereum',
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  {
    limit: 5, 
    sort: 'desc', 
    orderBy: 'volume_usd',
    pairWith: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' // Filter for USDC pairs
  }
);

// Get OHLCV data with options
const ohlcv = await client.pools.getOHLCV(
  'ethereum',
  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
  {
    start: '2023-01-01',
    end: '2023-01-07',
    limit: 7,
    interval: '24h',
    inversed: false
  }
);
```

## Advanced Configuration

The SDK supports automatic retry with exponential backoff and response caching, both enabled by default:

```javascript
import { DexPaprikaClient } from 'dexpaprika-sdk';

// Custom configuration
const client = new DexPaprikaClient(
  'https://api.dexpaprika.com', // Default API URL
  {}, // Axios options (optional)
  {
    // Retry configuration (optional)
    retry: {
      maxRetries: 4,              // Maximum retry attempts
      delaySequenceMs: [100, 500, 1000, 5000], // Specific delay for each retry (in ms)
      retryableStatuses: [408, 429, 500, 502, 503, 504] // HTTP statuses to retry
    },
    // Cache configuration (optional)
    cache: {
      ttl: 5 * 60 * 1000,         // Time-to-live: 5 minutes
      maxSize: 1000,              // Maximum cache entries
      enabled: true               // Enable/disable caching
    }
  }
);

// Working with cache
const firstCall = await client.networks.list(); // Hits API
const secondCall = await client.networks.list(); // Uses cache

// Manual cache operations
client.clearCache();             // Clear all cached data
console.log(client.cacheSize);   // Get current cache size
client.setCacheEnabled(false);   // Temporarily disable caching
```

## API Reference

For detailed API documentation, visit [docs.dexpaprika.com](https://docs.dexpaprika.com)

### Networks & DEXes

```js
// Networks
const networks = await client.networks.list();

// DEXes on a network
const dexes = await client.dexes.listByNetwork('ethereum', {
  limit: 10
});
```

### Pools & Transactions

```js
// Top pools on Ethereum with pagination
const topPools = await client.pools.listByNetwork('ethereum', {
  page: 0,
  limit: 10,
  sort: 'desc',
  orderBy: 'volume_usd'
});

// Top pools on different networks
const solanaPools = await client.pools.listByNetwork('solana', { limit: 5 });
const fantomPools = await client.pools.listByNetwork('fantom', { limit: 5 });

// Pool details
const poolDetails = await client.pools.getDetails(
  'ethereum',
  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640'
);

// Transactions
const txs = await client.pools.getTransactions(
  'ethereum',
  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
  { limit: 20 }
);
```

### OHLCV Data

For price charts:

```js
// Price history (daily candles for a week)
const startDate = new Date();
startDate.setDate(startDate.getDate() - 7);

const ohlcv = await client.pools.getOHLCV(
  'ethereum', 
  '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
  {
    start: startDate.toISOString(),
    interval: '24h',
    limit: 7
  }
);
```

### Tokens

```js
// Token details (WETH)
const token = await client.tokens.getDetails(
  'ethereum', 
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
);

// Find WETH-USDC pools
const pools = await client.tokens.getPools(
  'ethereum', 
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
  {
    page: 0,
    limit: 10,
    sort: 'desc',
    orderBy: 'volume_usd',
    pairWith: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' // USDC
  }
);
```

### Search & Stats

```js
// Search
const results = await client.search.search('bitcoin');

// Stats
const stats = await client.utils.getStats();
```

## TypeScript Types

The SDK includes TypeScript types for easier development. See the documentation for response type details.

## Error Handling

The SDK includes specific error classes for better error handling:

```javascript
import { 
  DexPaprikaClient, 
  DeprecatedEndpointError, 
  NetworkNotFoundError,
  PoolNotFoundError,
  ApiError 
} from 'dexpaprika-sdk';

const client = new DexPaprikaClient();

try {
  // This will throw DeprecatedEndpointError
  const pools = await client.pools.list();
} catch (error) {
  if (error instanceof DeprecatedEndpointError) {
    console.log('Migration required:', error.message);
    // Use network-specific method instead
    const pools = await client.pools.listByNetwork('ethereum');
  } else if (error instanceof NetworkNotFoundError) {
    console.log('Invalid network:', error.message);
  } else if (error instanceof PoolNotFoundError) {
    console.log('Pool not found:', error.message);
  } else {
    console.error('Other error:', error.message);
  }
}
```

Using the error helper:

```js
import { parseError } from 'dexpaprika-sdk/dist/utils/helpers';

try {
  const pools = await client.pools.listByNetwork('ethereum');
  // Process results
} catch (err) {
  console.error(parseError(err));
}
```

## Utilities

Helper functions:

```js
import { formatVolume, formatPair } from 'dexpaprika-sdk/dist/utils/helpers';

// Format volume like $1.23M
console.log(formatVolume(1234567));  // $1.23M

// Format token pair
console.log(formatPair('ETH', 'USDC')); // ETH/USDC
```

## Retry & Caching

You can also use the retry and caching utilities directly:

```js
import { withRetry, Cache } from 'dexpaprika-sdk';

// Retry a function with custom settings
const result = await withRetry(
  async () => {
    // Your async operation here
    return await someAsyncFunction();
  },
  { maxRetries: 4, delaySequenceMs: [100, 200, 300, 400] }
);

// Create a standalone cache
const cache = new Cache({ ttl: 60 * 1000 }); // 1 minute TTL
cache.set('key', value);
const cachedValue = cache.get('key');
```

## Resources

- [Official Documentation](https://docs.dexpaprika.com) - Comprehensive API reference
- [DexPaprika Website](https://dexpaprika.com) - Main product website
- [CoinPaprika](https://coinpaprika.com) - Related cryptocurrency data platform
- [Discord Community](https://discord.gg/DhJge5TUGM) - Get support and connect with other developers

## License

MIT

## Contributing

Contributions are welcome! Please read our [contributing guidelines](https://github.com/coinpaprika/dexpaprika-sdk-js/blob/main/CONTRIBUTING.md) before submitting a Pull Request.

## Development and Testing

The SDK includes a comprehensive test suite to verify functionality:

```bash
# Run basic functionality tests
npm test

# Run real-world API tests
npx ts-node tests/test-real-world.ts

# Run all tests sequentially
npm run test:all
```

All test files are located in the `tests/` directory:
- `test-basic.ts` - Basic API functionality tests
- `test-real-world.ts` - Tests with actual API calls and simulated failures

## Support

For issues, questions, or feedback, please:
- Open an issue on our [GitHub repository](https://github.com/coinpaprika/dexpaprika-sdk-js/issues)
- Reach out to the DexPaprika team at [support@coinpaprika.com](mailto:support@coinpaprika.com)

## Disclaimer

This SDK is created and maintained by Coinpaprika. While we strive to provide accurate and up-to-date data, we make no guarantees regarding the accuracy, reliability, or completeness of the data provided through the DexPaprika API.
