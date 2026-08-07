/// <reference types="node" />
import { DexPaprikaClient } from '../src';
import { mapPoolSortField, mapTokenSortField } from '../src/utils/searchParams';
import { sleep } from '../src/utils/helpers';

// Test all 4 new endpoints against the live API
async function main() {
  console.log("Testing DexPaprika SDK search endpoints against the live API\n");
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
  //
  // The names the SDK puts on the wire are pinned offline in
  // tests/test-search-params.ts, which needs no network and no market. What
  // follows proves the live API still honours each bound.
  await test('pools.filter - all eight price-change bounds apply', async () => {
    const baseline = await client.pools.filter('ethereum', { limit: 5 });
    if (baseline.results.length === 0) throw new Error('No baseline results');

    type Window = '24h' | '6h' | '1h' | '5m';
    const read = (pool: any, w: Window): number | null | undefined =>
      pool[`price_change_percentage_${w}`];

    // 10 percent is far enough outside the ordinary spread that the unfiltered
    // page never clears it, on any of the four windows, and close enough in
    // that ethereum usually has rows on the daily and hourly ones.
    const BOUND = 10;
    const checks: { option: string; window: Window; kind: 'min' | 'max' }[] = [];
    for (const w of ['24h', '6h', '1h', '5m'] as Window[]) {
      checks.push({ option: `priceChange${w}Min`, window: w, kind: 'min' });
      checks.push({ option: `priceChange${w}Max`, window: w, kind: 'max' });
    }

    const notes: string[] = [];
    for (const { option, window, kind } of checks) {
      const bound = kind === 'min' ? BOUND : -BOUND;

      // The baseline has to fail the bound, otherwise a filter that did nothing
      // would pass this check by accident.
      const baselineClears = baseline.results.every(p => {
        const v = read(p, window);
        if (v === undefined || v === null) return false;
        return kind === 'min' ? v >= bound : v <= bound;
      });
      if (baselineClears) {
        throw new Error(`Unfiltered page already satisfies ${option}: ${bound}, so the check proves nothing`);
      }

      const page = await client.pools.filter('ethereum', { [option]: bound, limit: 5 } as any);

      if (page.results.length === 0) {
        // An ignored bound returns the full unfiltered page, never an empty
        // one, so zero rows still tells the two apart. It happens on the 5m
        // window in a quiet market and is not a failure.
        notes.push(`${option} empty`);
        continue;
      }

      for (const pool of page.results) {
        const v = read(pool, window);
        if (v === undefined || v === null) {
          throw new Error(`Pool ${pool.id} came back under ${option}: ${bound} with no ${window} value`);
        }
        if (kind === 'min' ? v < bound : v > bound) {
          throw new Error(`Pool ${pool.id} reports a ${window} change of ${v}, the bound was ${option}: ${bound}`);
        }
      }
      notes.push(`${option} ${page.results.length} rows`);
      await sleep(400);
    }
    console.log(`   ${notes.join(', ')}`);
  });

  await test('pools.filter - sorting by a short price-change window', async () => {
    const byVolume = await client.pools.filter('ethereum', { sortBy: 'volume_usd_24h', limit: 5 });
    const byChange = await client.pools.filter('ethereum', { sortBy: 'price_change_percentage_1h', limit: 5 });
    if (byChange.results.length === 0) throw new Error('No results');
    // An unknown sort field folds to volume_usd_24h before the request goes
    // out, which would hand back the volume-sorted page with a 200. Comparing
    // whole pages rather than the top row alone makes a chance match unlikely.
    if (byChange.results.map(p => p.id).join(',') === byVolume.results.map(p => p.id).join(',')) {
      throw new Error('Sorting by 1h price change returned the volume-sorted page');
    }
    // Null 1h values are skipped rather than coerced. Coercing them to
    // -Infinity would let a page of nulls pass the ordering check having
    // compared nothing at all.
    const ordered = byChange.results
      .map(p => p.price_change_percentage_1h)
      .filter((c): c is number => typeof c === 'number');
    if (ordered.length < 2) {
      throw new Error(`Only ${ordered.length} rows carry a 1h value, cannot check ordering`);
    }
    for (let i = 1; i < ordered.length; i++) {
      if (ordered[i] > ordered[i - 1]) {
        throw new Error(`Page is not ordered by 1h change: ${ordered[i]} came after ${ordered[i - 1]}`);
      }
    }
    console.log(`   Top 1h mover: ${ordered[0].toFixed(2)}%, ${ordered.length} rows checked for order`);
  });

  await test('short price-change windows are pools only', async () => {
    // The 24h window works on both endpoints, for sorting and for filtering.
    // Only 6h, 1h and 5m are pools-only, and they fail differently: tokens/search
    // returns 400 for them as a sort field, and ignores them as a filter bound.
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
    if (mapTokenSortField('price_change_percentage_24h') !== 'price_change_percentage_24h') {
      throw new Error('The 24h window must keep passing through on tokens/search');
    }
    const tokens = await client.tokens.getTop('ethereum', { limit: 1 });
    if (tokens.results.length === 0) throw new Error('No tokens');
    const row = tokens.results[0] as unknown as Record<string, unknown>;
    for (const field of windows) {
      if (row[field] !== undefined) {
        throw new Error(`Token rows now carry ${field}; recheck whether tokens/search accepts the window`);
      }
    }
    if (row.price_change_percentage_24h === undefined) {
      throw new Error('Token rows no longer carry price_change_percentage_24h');
    }
    console.log('   6h/1h/5m pass through on pools and fall back on tokens, 24h works on both');
  });

  await test('tokens.filter - 24h price change bounds apply', async () => {
    const baseline = await client.tokens.getTop('ethereum', { limit: 5 });
    if (baseline.results.length === 0) throw new Error('No baseline tokens');
    const baselineChanges = baseline.results.map(t => t.price_change_percentage_24h);
    if (baselineChanges.every(c => typeof c === 'number' && c >= 20)) {
      throw new Error(`Unfiltered page already clears the bound: ${baselineChanges}`);
    }

    const gainers = await client.tokens.filter('ethereum', { priceChange24hMin: 20, limit: 5 });
    for (const token of gainers.results) {
      const change = token.price_change_percentage_24h;
      if (typeof change !== 'number' || change < 20) {
        throw new Error(`Token ${token.address} reports a 24h change of ${change}, the bound was 20`);
      }
    }

    await sleep(400);
    const losers = await client.tokens.filter('ethereum', { priceChange24hMax: -20, limit: 5 });
    for (const token of losers.results) {
      const change = token.price_change_percentage_24h;
      if (typeof change !== 'number' || change > -20) {
        throw new Error(`Token ${token.address} reports a 24h change of ${change}, the bound was -20`);
      }
    }
    // An ignored bound hands back the unfiltered page, so an empty page is
    // still a filter that ran. Both pages empty at once would mean ethereum
    // has nothing moving 20% either way, which is worth looking at by hand.
    if (gainers.results.length === 0 && losers.results.length === 0) {
      throw new Error('Both 24h bounds returned nothing, so neither direction was exercised');
    }
    console.log(`   ${gainers.results.length} tokens up 20%+, ${losers.results.length} down 20%+`);
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
