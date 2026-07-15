/**
 * Test migration from deprecated pools.list() to network-specific methods
 */

/// <reference types="node" />
import { DexPaprikaClient, DeprecatedEndpointError } from '../src';

async function testMigration() {
  console.log('🔄 Testing migration from deprecated pools.list() method...');
  
  const client = new DexPaprikaClient();
  
  try {
    // Test 1: Verify deprecated method throws correct error
    console.log('\n1. Testing deprecated pools.list() method...');
    try {
      await client.pools.list();
      throw new Error('Expected DeprecatedEndpointError but method succeeded');
    } catch (error: unknown) {
      if (error instanceof DeprecatedEndpointError) {
        console.log('✅ Correctly threw DeprecatedEndpointError:', error.message);
      } else {
        const errorName = error instanceof Error ? error.constructor.name : 'unknown';
        throw new Error(`Expected DeprecatedEndpointError but got: ${errorName}`);
      }
    }
    
    // Test 2: Verify network-specific method works
    console.log('\n2. Testing network-specific pools.listByNetwork() method...');
    const ethereumPools = await client.pools.listByNetwork('ethereum', { limit: 5 });
    console.log(`✅ Successfully fetched ${ethereumPools.results.length} Ethereum pools`);
    
    // Test 3: Test multiple networks
    console.log('\n3. Testing multiple networks...');
    const networks = ['ethereum', 'solana', 'fantom'];
    
    for (const network of networks) {
      try {
        const pools = await client.pools.listByNetwork(network, { limit: 3 });
        console.log(`✅ ${network}: ${pools.results.length} pools`);
      } catch (error: any) {
        console.log(`⚠️  ${network}: ${error.message}`);
      }
    }
    
    // Test 4: Test parameter validation
    console.log('\n4. Testing parameter validation...');
    try {
      await client.pools.listByNetwork('', { limit: 5 });
      throw new Error('Expected error for empty network ID');
    } catch (error: any) {
      if (error.message.includes('Network ID is required')) {
        console.log('✅ Correctly validated empty network ID');
      } else {
        throw error;
      }
    }
    
    // Test 5: tokens.getPools() now targets /pools/search with token_address
    console.log('\n5. Testing tokens.getPools() against /pools/search...');
    const weth = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    const wethPools = await client.tokens.getPools('ethereum', weth, { limit: 3 });
    if (wethPools.results.length === 0) {
      throw new Error('Expected WETH pools, got an empty result set');
    }
    for (const pool of wethPools.results) {
      const ids = (pool.tokens ?? []).map(t => t.id);
      if (!ids.includes(weth)) {
        throw new Error(`Pool ${pool.id} does not contain the requested token`);
      }
    }
    console.log(`✅ ${wethPools.results.length} pools, all contain WETH`);

    if (!wethPools.has_next_page || !wethPools.next_cursor) {
      throw new Error('Expected a next cursor for WETH pools');
    }
    const wethPage2 = await client.tokens.getPools('ethereum', weth, {
      limit: 3,
      cursor: wethPools.next_cursor,
    });
    if (wethPage2.results.length === 0 || wethPage2.results[0].id === wethPools.results[0].id) {
      throw new Error('Cursor pagination did not advance to the next page');
    }
    console.log('✅ Cursor pagination works for token pools');

    // Test 6: Show migration example
    console.log('\n6. Migration example:');
    console.log('❌ OLD (deprecated):');
    console.log('   const pools = await client.pools.list();');
    console.log('✅ NEW (required):');
    console.log('   const pools = await client.pools.listByNetwork(\'ethereum\');');
    
    console.log('\n🎉 All migration tests passed!');
    console.log('\n📚 Migration guide:');
    console.log('   https://docs.dexpaprika.com/changelog/changelog');
    
  } catch (error) {
    console.error('❌ Migration test failed:', error);
    process.exit(1);
  }
}

// Run the test
testMigration(); 