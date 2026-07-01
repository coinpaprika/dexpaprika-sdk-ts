import { DexPaprikaClient } from '../src';
import { formatVolume, formatPair, lastWeek } from '../src/utils/helpers';

// Basic DexPaprika SDK usage example
async function main() {
  const client = new DexPaprikaClient();

  try {
    // Get supported networks
    const networks = await client.networks.list();
    console.log(`Found ${networks.length} networks`);
    
    // Find Ethereum network
    const eth = networks.find(n => n.id === 'ethereum');
    if (!eth) throw new Error('Ethereum network not found');
    
    // Retrieve global stats
    const stats = await client.utils.getStats();
    console.log(`Stats: ${stats.chains} chains, ${stats.pools} pools, ${stats.tokens} tokens`);

    // Get top pools on Ethereum by 24h volume (cursor-paginated pools/search)
    const poolsResp = await client.pools.listByNetwork('ethereum', {
      limit: 5,
      sort: 'desc',
      orderBy: 'volume_usd_24h'
    });
    console.log('Top Ethereum pools:');

    // Display pool information with formatting. The pools/search endpoint returns
    // lean token refs by default, so fall back to a short id when no symbol.
    for (const pool of poolsResp.results) {
      const label = (i: number) => pool.tokens[i].symbol ?? pool.tokens[i].id.slice(0, 6);
      const pair = pool.tokens.length < 2 ? 'Unknown' : formatPair(label(0), label(1));
      console.log(`${pair}: ${formatVolume(pool.volume_usd_24h ?? 0)} on ${pool.dex_name}`);
    }

    // Historical data for selected pool
    if (poolsResp.results.length) {
      const pool = poolsResp.results[0];
      
      // Get data for the past week
      const weekAgo = new Date(lastWeek() * 1000).toISOString().split('T')[0];
      console.log(`Getting price history since ${weekAgo}`);
      
      const history = await client.pools.getOHLCV(
        pool.chain, 
        pool.id, 
        {
          start: weekAgo,
          limit: 7
        }
      );
      
      if (history.length) {
        console.log(`Last price: ${history[history.length-1].close}`);
      }
    }

    // Search for tokens
    const results = await client.search.search("bitcoin");
    console.log(`Search results: ${results.tokens.length} tokens, ${results.pools.length} pools`);
    
    // Display top result if available
    if (results.tokens.length) {
      const top = results.tokens[0];
      console.log(`Top match: ${top.name} (${top.symbol}) on ${top.chain}`);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

main(); 