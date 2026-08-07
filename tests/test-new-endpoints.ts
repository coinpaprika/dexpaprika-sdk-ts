/// <reference types="node" />
import { DexPaprikaClient } from '../src';
import { mapPoolSortField, mapTokenSortField } from '../src/utils/searchParams';

// Test all 4 new endpoints against the live API
async function main() {
  console.log("Testing new DexPaprika SDK endpoints (v1.6.0)\n");
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
    if (typeof result.has_next_page !== 'boolean') throw new Error('No has_next_page');
    const pool = result.results[0];
    if (!pool.id) throw new Error('Pool missing id');
    if (!pool.tokens || pool.tokens.length === 0) throw new Error('Pool missing tokens');
    console.log(`   Got ${result.results.length} filtered pools, first: ${pool.tokens.map(t => t.symbol ?? t.id.slice(0, 6)).join('/')}`);
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

  // 1b. Price-change windows on pools/search.
  // /pools/search ignores query parameters it does not recognize and still
  // answers 200, so a dropped or misspelled bound looks exactly like a wide
  // filter. Every check below compares against an unfiltered baseline or an
  // independently sorted page instead of trusting the status code.
  await test('pools.filter - 1h price change bound applies', async () => {
    const baseline = await client.pools.filter('ethereum', { limit: 5 });
    const baselineChanges = baseline.results.map(p => p.price_change_percentage_1h ?? 0);
    if (baselineChanges.length === 0) throw new Error('No baseline results');
    if (baselineChanges.every(c => c >= 50)) {
      throw new Error(`Baseline already clears the bound, so it proves nothing: ${baselineChanges}`);
    }

    const gainers = await client.pools.filter('ethereum', { priceChange1hMin: 50, limit: 5 });
    if (gainers.results.length === 0) throw new Error('No pools up 50% in an hour');
    for (const pool of gainers.results) {
      const change = pool.price_change_percentage_1h;
      if (change === undefined || change === null || change < 50) {
        throw new Error(`Pool ${pool.id} reports a 1h change of ${change}, the bound was 50`);
      }
    }
    const shown = (xs: (number | null | undefined)[]) => xs.map(x => (x ?? 0).toFixed(3)).join(', ');
    console.log(`   Baseline ${shown(baselineChanges)} vs filtered ${shown(gainers.results.map(p => p.price_change_percentage_1h))}`);
  });

  await test('pools.filter - negative 24h bound applies', async () => {
    // A max on a price change is usually negative. -20 means down at least a fifth.
    const losers = await client.pools.filter('ethereum', { priceChange24hMax: -20, limit: 5 });
    if (losers.results.length === 0) throw new Error('No pools down 20% on the day');
    for (const pool of losers.results) {
      const change = pool.price_change_percentage_24h;
      if (change === undefined || change === null || change > -20) {
        throw new Error(`Pool ${pool.id} reports a 24h change of ${change}, the bound was -20`);
      }
    }
    console.log(`   ${losers.results.length} pools down at least 20% on the day`);
  });

  await test('pools.filter - sorting by a short price-change window', async () => {
    const byVolume = await client.pools.filter('ethereum', { sortBy: 'volume_usd_24h', limit: 5 });
    const byChange = await client.pools.filter('ethereum', { sortBy: 'price_change_percentage_1h', limit: 5 });
    if (byChange.results.length === 0) throw new Error('No results');
    // An unknown sort field folds to volume_usd_24h before the request goes
    // out, which would hand back the volume-sorted page with a 200.
    if (byChange.results[0].id === byVolume.results[0].id) {
      throw new Error('Sorting by 1h price change returned the volume-sorted page');
    }
    let previous = Infinity;
    for (const pool of byChange.results) {
      const change = pool.price_change_percentage_1h ?? -Infinity;
      if (change > previous) {
        throw new Error(`Page is not ordered by 1h change: ${change} came after ${previous}`);
      }
      previous = change;
    }
    console.log(`   Top 1h mover: ${byChange.results[0].price_change_percentage_1h?.toFixed(2)}%`);
  });

  await test('price-change windows are pools only', async () => {
    const windows = [
      'price_change_percentage_6h',
      'price_change_percentage_1h',
      'price_change_percentage_5m',
    ];
    for (const field of windows) {
      if (mapPoolSortField(field) !== field) {
        throw new Error(`mapPoolSortField('${field}') gave '${mapPoolSortField(field)}', expected pass-through`);
      }
      // tokens/search answers 400 on these windows, so folding them to the
      // default is the correct behaviour rather than a gap to be filled.
      if (mapTokenSortField(field) !== 'volume_usd_24h') {
        throw new Error(`mapTokenSortField('${field}') gave '${mapTokenSortField(field)}', expected the volume_usd_24h fallback`);
      }
    }
    const tokens = await client.tokens.getTop('ethereum', { limit: 1 });
    if (tokens.results.length === 0) throw new Error('No tokens');
    const row = tokens.results[0] as unknown as Record<string, unknown>;
    for (const field of windows) {
      if (row[field] !== undefined) {
        throw new Error(`Token rows now carry ${field}; recheck whether tokens/search accepts the window`);
      }
    }
    console.log('   Pool sort fields pass through, token sort fields fall back, token rows carry no short window');
  });

  // 2. Top Tokens
  await test('tokens.getTop - basic', async () => {
    const result = await client.tokens.getTop('ethereum', { limit: 5 });
    if (!result.results || result.results.length === 0) throw new Error('No tokens');
    if (typeof result.has_next_page !== 'boolean') throw new Error('No has_next_page');
    const token = result.results[0];
    if (!token.address) throw new Error('Token missing address');
    if (!token.chain) throw new Error('Token missing chain');
    console.log(`   Top token: ${token.address.substring(0, 10)}... at $${token.price_usd?.toFixed(4)}`);
  });

  await test('tokens.getTop - with sort', async () => {
    const result = await client.tokens.getTop('ethereum', {
      orderBy: 'volume_24h',
      sort: 'asc',
      limit: 3,
    });
    if (!result.results) throw new Error('No tokens');
    console.log(`   Got ${result.results.length} tokens (asc sort)`);
  });

  // 3. Token Filter
  await test('tokens.filter - basic', async () => {
    const result = await client.tokens.filter('ethereum', {
      volume24hMin: 100000,
      limit: 5,
    });
    if (!result.results || result.results.length === 0) throw new Error('No results');
    if (typeof result.has_next_page !== 'boolean') throw new Error('No has_next_page');
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
    if (pools.results.length === 0) throw new Error('No pools');
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
