import { DexPaprikaClient } from '../src';

// Test all 4 new endpoints against the live API
async function main() {
  console.log("Testing new DexPaprika SDK endpoints (v1.5.0)\n");
  const client = new DexPaprikaClient();
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ ${name}: ${err.message || err}`);
      failed++;
    }
  }

  // 1. Pool Filter
  await test('pools.filter - basic', async () => {
    const result = await client.pools.filter('ethereum', {
      volume24hMin: 100000,
      limit: 5,
    });
    if (!result.results || result.results.length === 0) throw new Error('No results');
    if (!result.page_info) throw new Error('No page_info');
    const pool = result.results[0];
    if (!pool.id) throw new Error('Pool missing id');
    if (!pool.tokens || pool.tokens.length === 0) throw new Error('Pool missing tokens');
    console.log(`   Got ${result.results.length} filtered pools, first: ${pool.tokens.map(t => t.symbol).join('/')}`);
  });

  await test('pools.filter - multiple params', async () => {
    const result = await client.pools.filter('ethereum', {
      volume24hMin: 50000,
      txns24hMin: 10,
      sortBy: 'volume_24h',
      sortDir: 'desc',
      limit: 3,
    });
    if (!result.results) throw new Error('No results');
    console.log(`   Got ${result.results.length} pools with multi-filter`);
  });

  // 2. Top Tokens
  await test('tokens.getTop - basic', async () => {
    const result = await client.tokens.getTop('ethereum', { limit: 5 });
    if (!result.tokens || result.tokens.length === 0) throw new Error('No tokens');
    if (!result.page_info) throw new Error('No page_info');
    const token = result.tokens[0];
    if (!token.address) throw new Error('Token missing address');
    if (!token.symbol) throw new Error('Token missing symbol');
    console.log(`   Top token: ${token.symbol} at $${token.price_usd?.toFixed(4)}`);
  });

  await test('tokens.getTop - with sort', async () => {
    const result = await client.tokens.getTop('ethereum', {
      orderBy: 'volume_24h',
      sort: 'asc',
      limit: 3,
    });
    if (!result.tokens) throw new Error('No tokens');
    console.log(`   Got ${result.tokens.length} tokens (asc sort)`);
  });

  // 3. Token Filter
  await test('tokens.filter - basic', async () => {
    const result = await client.tokens.filter('ethereum', {
      volume24hMin: 100000,
      limit: 5,
    });
    if (!result.results || result.results.length === 0) throw new Error('No results');
    if (!result.page_info) throw new Error('No page_info');
    const token = result.results[0];
    if (!token.address) throw new Error('Token missing address');
    if (!token.chain) throw new Error('Token missing chain');
    console.log(`   Got ${result.results.length} filtered tokens, first: ${token.address.substring(0, 10)}...`);
  });

  await test('tokens.filter - with FDV', async () => {
    const result = await client.tokens.filter('ethereum', {
      volume24hMin: 100000,
      fdvMin: 1000000,
      limit: 3,
    });
    if (!result.results) throw new Error('No results');
    console.log(`   Got ${result.results.length} tokens with FDV filter`);
  });

  // 4. Multi Prices
  await test('tokens.getMultiPrices - two tokens', async () => {
    const prices = await client.tokens.getMultiPrices('ethereum', [
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    ]);
    if (!Array.isArray(prices)) throw new Error('Expected array');
    if (prices.length !== 2) throw new Error(`Expected 2 prices, got ${prices.length}`);
    const weth = prices.find(p => p.id === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
    if (!weth) throw new Error('WETH price not found');
    if (!weth.price_usd) throw new Error('WETH price_usd missing');
    console.log(`   WETH: $${weth.price_usd.toFixed(2)}, USDC: $${prices.find(p => p.id !== weth.id)?.price_usd?.toFixed(4)}`);
  });

  await test('tokens.getMultiPrices - single token', async () => {
    const prices = await client.tokens.getMultiPrices('ethereum', [
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    ]);
    if (prices.length !== 1) throw new Error(`Expected 1 price, got ${prices.length}`);
  });

  await test('tokens.getMultiPrices - empty validation', async () => {
    try {
      await client.tokens.getMultiPrices('ethereum', []);
      throw new Error('Should have thrown');
    } catch (err: any) {
      if (!err.message.includes('required')) throw new Error(`Wrong error: ${err.message}`);
    }
  });

  // Also verify existing endpoints still work
  await test('existing: networks.list', async () => {
    const networks = await client.networks.list();
    if (networks.length === 0) throw new Error('No networks');
  });

  await test('existing: pools.listByNetwork', async () => {
    const pools = await client.pools.listByNetwork('ethereum', { limit: 2 });
    if (pools.pools.length === 0) throw new Error('No pools');
  });

  await test('existing: tokens.getDetails', async () => {
    const token = await client.tokens.getDetails('ethereum', '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
    if (!token.symbol) throw new Error('No symbol');
  });

  await test('existing: utils.getStats', async () => {
    const stats = await client.utils.getStats();
    if (!stats.chains) throw new Error('No chains');
  });

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(`${'='.repeat(50)}`);

  if (failed > 0) process.exit(1);
}

main();
