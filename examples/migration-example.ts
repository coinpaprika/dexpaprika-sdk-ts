import { 
  DexPaprikaClient, 
  DeprecatedEndpointError, 
  NetworkNotFoundError,
  ApiError 
} from '../src';

// Migration example - demonstrating error handling and new patterns
async function main() {
  const client = new DexPaprikaClient();

  console.log('🔄 DexPaprika SDK Migration Example\n');

  // Demonstrate deprecated method error
  console.log('1. Attempting to use deprecated pools.list() method:');
  try {
    await client.pools.list();
  } catch (error) {
    if (error instanceof DeprecatedEndpointError) {
      console.log('❌ Caught DeprecatedEndpointError:');
      console.log(`   ${error.message}\n`);
    }
  }

  // Show correct approach
  console.log('2. Using the new network-specific approach:');
  try {
    const ethereumPools = await client.pools.listByNetwork('ethereum', {
      page: 0,
      limit: 3,
      sort: 'desc',
      orderBy: 'volume_usd'
    });
    console.log(`✅ Successfully fetched ${ethereumPools.pools.length} Ethereum pools`);
    
    // Show multiple networks
    const solanaPools = await client.pools.listByNetwork('solana', { limit: 2 });
    console.log(`✅ Successfully fetched ${solanaPools.pools.length} Solana pools`);
    
    const fantomPools = await client.pools.listByNetwork('fantom', { limit: 2 });
    console.log(`✅ Successfully fetched ${fantomPools.pools.length} Fantom pools\n`);
  } catch (error) {
    console.error('Unexpected error:', error);
  }

  // Demonstrate other error handling
  console.log('3. Error handling examples:');
  
  // Network not found
  try {
    await client.pools.listByNetwork('nonexistent-network');
  } catch (error) {
    if (error instanceof NetworkNotFoundError) {
      console.log(`❌ Network error: ${error.message}`);
    } else if (error instanceof ApiError) {
      console.log(`❌ API error: ${error.message}`);
    }
  }

  // Parameter validation
  try {
    await client.pools.listByNetwork('');
  } catch (error: any) {
    console.log(`❌ Validation error: ${error.message}`);
  }

  console.log('\n📚 Migration Summary:');
  console.log('   OLD: await client.pools.list()');
  console.log('   NEW: await client.pools.listByNetwork(\'ethereum\')');
  console.log('\n   For more networks:');
  console.log('   - await client.pools.listByNetwork(\'solana\')');
  console.log('   - await client.pools.listByNetwork(\'fantom\')');
  console.log('   - await client.pools.listByNetwork(\'arbitrum\')');
  console.log('\n✅ Migration complete!');
}

main(); 