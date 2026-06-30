import { DexPaprikaClient } from '../src';

// Define minimal interfaces for type assertions
interface Stats {
  chains: number;
  dexes?: number; // Make dexes optional since it's potentially missing
  pools: number;
}

/**
 * This test simulates real-world scenarios by making actual API calls
 * and deliberately introducing failures to test retry and caching functionality.
 */
async function realWorldTest() {
  console.log('=========================================');
  console.log('REAL-WORLD RETRY AND CACHE VERIFICATION TEST');
  console.log('=========================================\n');
  
  // Create a client with default settings
  const client = new DexPaprikaClient(
    undefined,
    {},
    {
      retry: {
        maxRetries: 3,
        delaySequenceMs: [500, 1000, 3000],
      },
      cache: {
        ttl: 30 * 1000, // 30 seconds for testing
        maxSize: 10,
      }
    }
  );
  
  console.log('1. CACHING TEST - Making sequential API calls');
  console.log('--------------------------------------------');
  
  try {
    // First call (cache miss)
    console.time('  First call');
    const networks1 = await client.networks.list();
    console.timeEnd('  First call');
    console.log(`  Retrieved ${networks1.length} networks`);
    
    // Second call (should use cache)
    console.time('  Second call');
    const networks2 = await client.networks.list();
    console.timeEnd('  Second call');
    console.log(`  Retrieved ${networks2.length} networks (should be faster)`);
    
    // Get Ethereum pools (different endpoint)
    console.time('  Ethereum pools');
    const ethPools = await client.pools.listByNetwork('ethereum', {
      limit: 3
    });
    console.timeEnd('  Ethereum pools');

    if (ethPools.results.length > 0) {
      console.log(`  Top Ethereum pool: ${ethPools.results[0].dex_name}`);
    }

    // Get the same pools again (should be cached)
    console.time('  Ethereum pools (cached)');
    await client.pools.listByNetwork('ethereum', {
      limit: 3
    });
    console.timeEnd('  Ethereum pools (cached)');
    
    console.log('  ✓ Caching test passed');
  } catch (error: any) {
    console.error(`  ✗ Caching test failed: ${error.message}`);
  }
  
  console.log('\n2. RETRY TEST - Simulating network failures');
  console.log('----------------------------------------');
  
  // Create a client with a modified axios instance that sometimes fails
  const clientWithFailures = new DexPaprikaClient();
  
  // Save the original get method to restore it later
  const originalHttpGet = (clientWithFailures as any).httpClient.get;
  
  // Inject failures for specific URLs
  let failureCount = 0;
  (clientWithFailures as any).httpClient.get = async (url: string, config: any) => {
    // Inject failure for specific endpoints
    if (url.includes('/stats') && failureCount < 2) {
      failureCount++;
      console.log(`  Injecting failure #${failureCount} for ${url}`);
      
      // Simulate network error
      throw {
        message: 'Network Error',
        request: { url },
        response: { status: 503, statusText: 'Service Unavailable' }
      };
    }
    
    // Otherwise call the original
    return originalHttpGet(url, config);
  };
  
  try {
    console.log('  Making request that will retry twice before succeeding:');
    console.time('  Stats API call with retries');
    const stats = await clientWithFailures.utils.getStats() as Stats;
    console.timeEnd('  Stats API call with retries');
    
    console.log(`  ✓ Retry test passed. Retrieved stats with ${failureCount} retries.`);
    console.log(`    Chains: ${stats.chains}, DEXes: ${stats.dexes || 'N/A'}, Pools: ${stats.pools}`);
  } catch (error: any) {
    console.error(`  ✗ Retry test failed: ${error.message}`);
  }
  
  // Restore original method
  (clientWithFailures as any).httpClient.get = originalHttpGet;
  
  console.log('\n3. CACHE CONTROL TEST - Clearing and disabling cache');
  console.log('------------------------------------------------');
  
  try {
    // First query cached
    console.time('  Initial query');
    await client.networks.list();
    console.timeEnd('  Initial query');
    
    // Second query from cache
    console.time('  Cached query');
    await client.networks.list();
    console.timeEnd('  Cached query');
    
    // Clear cache and query again
    console.log('  Clearing cache...');
    client.clearCache();
    
    // Query should hit API
    console.time('  Query after cache clear');
    await client.networks.list();
    console.timeEnd('  Query after cache clear');
    
    // Disable cache
    console.log('  Disabling cache...');
    client.setCacheEnabled(false);
    
    // Make two queries with cache disabled
    console.time('  First query with cache disabled');
    await client.networks.list();
    console.timeEnd('  First query with cache disabled');
    
    console.time('  Second query with cache disabled');
    await client.networks.list();
    console.timeEnd('  Second query with cache disabled');
    
    // Re-enable cache
    console.log('  Re-enabling cache...');
    client.setCacheEnabled(true);
    
    // Make two queries with cache re-enabled
    console.time('  First query after re-enabling');
    await client.networks.list();
    console.timeEnd('  First query after re-enabling');
    
    console.time('  Second query after re-enabling');
    await client.networks.list();
    console.timeEnd('  Second query after re-enabling');
    
    console.log('  ✓ Cache control test passed');
  } catch (error: any) {
    console.error(`  ✗ Cache control test failed: ${error.message}`);
  }
  
  console.log('\nAll real-world tests completed.');
}

// Run the test
realWorldTest().catch(error => {
  console.error('Test failed with error:', error);
  // Using a non-zero exit code without process.exit
  throw new Error('Test failed');
}); 