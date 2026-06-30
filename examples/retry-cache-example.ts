// Retry and Cache Example
import { DexPaprikaClient } from '../src';

async function main() {
  try {
    // Create client with custom configuration
    const client = new DexPaprikaClient(
      undefined, // Default URL
      {}, // No special axios options
      {
        retry: {
          maxRetries: 4,
          delaySequenceMs: [100, 500, 1000, 5000], // Boss's preferred sequence
          retryableStatuses: [408, 429, 500, 502, 503, 504]
        },
        cache: {
          ttl: 60 * 1000, // 1 minute for demo purposes
          maxSize: 100,
        }
      }
    );

    console.log('1. Demonstrating cache functionality:');
    
    // First call - should hit the API
    console.time('First call (API)');
    const networks1 = await client.networks.list();
    console.timeEnd('First call (API)');
    console.log(`   - Found ${networks1.length} networks`);
    
    // Second call - should use cache
    console.time('Second call (cached)');
    const networks2 = await client.networks.list();
    console.timeEnd('Second call (cached)');
    console.log(`   - Found ${networks2.length} networks (from cache)`);
    console.log(`   - Current cache size: ${client.cacheSize} entries`);
    
    // Clear cache
    console.log('\n2. Clearing cache and making a new request:');
    client.clearCache();
    console.log(`   - Cache cleared. Current size: ${client.cacheSize} entries`);
    
    // Third call - should hit API again
    console.time('Third call (API, after cache clear)');
    const networks3 = await client.networks.list();
    console.timeEnd('Third call (API, after cache clear)');
    console.log(`   - Found ${networks3.length} networks`);
    
    // Disable cache
    console.log('\n3. Disabling cache:');
    client.setCacheEnabled(false);
    console.log('   - Cache disabled');
    
    // Fourth call - should hit API despite previous caching
    console.time('Fourth call (API, cache disabled)');
    await client.networks.list();
    console.timeEnd('Fourth call (API, cache disabled)');
    
    // Re-enable cache
    client.setCacheEnabled(true);
    console.log('   - Cache re-enabled');
    
    // Fifth call - should hit API and cache again
    console.time('Fifth call (API, cache re-enabled)');
    await client.networks.list();
    console.timeEnd('Fifth call (API, cache re-enabled)');
    
    // Sixth call - should use cache
    console.time('Sixth call (cached)');
    await client.networks.list();
    console.timeEnd('Sixth call (cached)');
    
    // Demonstrate pooling
    console.log('\n4. Different queries have different cache entries:');
    
    // Get Ethereum pools (first request)
    console.time('Ethereum pools (first request)');
    const ethPools = await client.pools.listByNetwork('ethereum', { limit: 5 });
    console.timeEnd('Ethereum pools (first request)');
    console.log(`   - Found ${ethPools.results.length} Ethereum pools`);
    console.log(`   - Cache size: ${client.cacheSize} entries`);

    // Get Solana pools (different query, should hit API)
    console.time('Solana pools (different query)');
    const solPools = await client.pools.listByNetwork('solana', { limit: 5 });
    console.timeEnd('Solana pools (different query)');
    console.log(`   - Found ${solPools.results.length} Solana pools`);
    console.log(`   - Cache size: ${client.cacheSize} entries`);

    // Get Ethereum pools again (should use cache)
    console.time('Ethereum pools (cached)');
    await client.pools.listByNetwork('ethereum', { limit: 5 });
    console.timeEnd('Ethereum pools (cached)');
    
    console.log('\nExample completed successfully!');
  } catch (error: any) {
    console.error('Example failed:', error.message);
  }
}

main(); 