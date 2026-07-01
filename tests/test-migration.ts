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
    
    // Test 5: Show migration example
    console.log('\n5. Migration example:');
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