import { DexPaprikaClient } from '../src';

// Testing DexPaprika SDK
async function main() {
  console.log("Testing DexPaprika SDK");
  const client = new DexPaprikaClient();
  
  try {
    // Get supported networks
    const networks = await client.networks.list();
    console.log(`Got ${networks.length} networks`);
    
    // Find Ethereum network
    const eth = networks.find(n => n.id === 'ethereum');
    if (!eth) {
      throw new Error('Ethereum network not found');
    }
    
    // Check DEXes on Ethereum
    const dexes = await client.dexes.listByNetwork('ethereum', {
      page: 0,
      limit: 5
    });
    console.log(`Got ${dexes.dexes.length} ETH dexes`);
    
    // Get some top pools on Ethereum (updated to use network-specific method)
    const pools = await client.pools.listByNetwork('ethereum', {
      page: 0,
      limit: 3
    });
    console.log(`Got ${pools.pools.length} top pools on Ethereum`);
    
    if (pools.pools.length > 0) {
      // Check first pool details
      const pool = pools.pools[0];
      console.log(`Testing pool: ${pool.id} on ${pool.chain}`);
      
      // Pool details
      try {
        const details = await client.pools.getDetails(pool.chain, pool.id);
        console.log(`Pool ${details.dex_name}: ${details.tokens.map(t => t.symbol).join('/')}`);
        
        // Check price history
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        const date = lastWeek.toISOString().split('T')[0];
        
        const history = await client.pools.getOHLCV(pool.chain, pool.id, {
          start: date,
          limit: 3
        });
        console.log(`Got ${history.length} price points`);
        
        // Check transactions
        const txs = await client.pools.getTransactions(pool.chain, pool.id, {
          page: 0,
          limit: 2
        }) as any;
        console.log(`Got ${txs.transactions?.length || 0} transactions`);
      } catch (err: any) {
        console.log(`Pool detail error: ${err.message || 'Unknown error'}`);
      }
    }
    
    // Check WETH
    const weth = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
    try {
      const token = await client.tokens.getDetails('ethereum', weth);
      console.log(`WETH details: ${token.name} (${token.symbol})`);
      
      const wethPools = await client.tokens.getPools('ethereum', weth, {
        page: 0,
        limit: 3
      });
      console.log(`WETH is in ${wethPools.pools.length} pools`);
    } catch (err: any) {
      console.log(`Token error: ${err.message || 'Unknown error'}`);
    }
    
    // Search
    const results = await client.search.search("bitcoin");
    console.log(`Search found: ${results.tokens.length} tokens, ${results.pools.length} pools`);
    
    // Stats
    const stats = await client.utils.getStats();
    console.log(`Stats: ${stats.pools} pools on ${stats.chains} chains`);
    
    console.log("All tests completed!");
  } catch (err: any) {
    console.error(`Test failed: ${err.message || 'Unknown error'}`);
  }
}

main(); 