/// <reference types="node" />
// Offline checks on the query the SDK builds for the two search endpoints.
//
// Why this file exists: /pools/search and /tokens/search answer 200 for query
// parameters they do not recognize, and silently ignore them. A bound that the
// SDK spells wrong, or drops on the floor, therefore comes back as a full
// unfiltered page rather than an error, and a live test that only checks the
// status code cannot tell the two apart. These checks read the params off the
// client before any request goes out, so a rename or a typo in src/api fails
// here immediately, with no network and no market conditions involved.
//
// The live counterpart lives in tests/test-new-endpoints.ts and proves the API
// still honours each bound today.

import { DexPaprikaClient } from '../src';
import { PoolsAPI } from '../src/api/pools';
import { TokensAPI } from '../src/api/tokens';
import { mapPoolSortField, mapTokenSortField } from '../src/utils/searchParams';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`PASS  ${name}`);
      passed++;
    })
    .catch((err: any) => {
      console.error(`FAIL  ${name}: ${err.message || err}`);
      failed++;
    });
}

// A client that records the endpoint and params of every GET and answers with
// an empty search page instead of calling the API.
class RecordingClient extends DexPaprikaClient {
  public calls: { endpoint: string; params: Record<string, any> }[] = [];

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    this.calls.push({ endpoint, params: { ...(params ?? {}) } });
    return { results: [], has_next_page: false, next_cursor: null } as unknown as T;
  }

  lastParams(): Record<string, any> {
    const call = this.calls[this.calls.length - 1];
    if (!call) throw new Error('No request was made');
    return call.params;
  }

  lastEndpoint(): string {
    const call = this.calls[this.calls.length - 1];
    if (!call) throw new Error('No request was made');
    return call.endpoint;
  }
}

function assertEqual(actual: unknown, expected: unknown, what: string) {
  if (actual !== expected) {
    throw new Error(`${what}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
}

// Every price-change bound pools.filter() accepts, with the exact query
// parameter name it has to reach /pools/search under. Getting a name wrong here
// is invisible over the wire, so this table is the specification.
const POOL_BOUNDS: [keyof import('../src/models/options').PoolFilterOptions, string][] = [
  ['priceChange24hMin', 'price_change_percentage_24h_min'],
  ['priceChange24hMax', 'price_change_percentage_24h_max'],
  ['priceChange6hMin', 'price_change_percentage_6h_min'],
  ['priceChange6hMax', 'price_change_percentage_6h_max'],
  ['priceChange1hMin', 'price_change_percentage_1h_min'],
  ['priceChange1hMax', 'price_change_percentage_1h_max'],
  ['priceChange5mMin', 'price_change_percentage_5m_min'],
  ['priceChange5mMax', 'price_change_percentage_5m_max'],
];

const TOKEN_BOUNDS: [keyof import('../src/models/options').TokenFilterOptions, string][] = [
  ['priceChange24hMin', 'price_change_percentage_24h_min'],
  ['priceChange24hMax', 'price_change_percentage_24h_max'],
];

async function main() {
  console.log('Checking the query the SDK builds for pools/search and tokens/search\n');

  for (const [option, param] of POOL_BOUNDS) {
    await test(`pools.filter sends ${String(option)} as ${param}`, async () => {
      const client = new RecordingClient();
      const pools = new PoolsAPI(client);
      // 17.5 rather than a round number so a value picked up from the wrong
      // option would not coincide with anything else in the request.
      await pools.filter('ethereum', { [option]: 17.5 } as any);
      assertEqual(client.lastEndpoint(), '/networks/ethereum/pools/search', 'endpoint');
      assertEqual(client.lastParams()[param], 17.5, `params.${param}`);
    });
  }

  await test('pools.filter keeps negative bounds negative', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    await pools.filter('ethereum', { priceChange24hMax: -20, priceChange5mMin: -3.5 });
    assertEqual(client.lastParams().price_change_percentage_24h_max, -20, 'params.price_change_percentage_24h_max');
    assertEqual(client.lastParams().price_change_percentage_5m_min, -3.5, 'params.price_change_percentage_5m_min');
  });

  await test('pools.filter sends a zero bound rather than dropping it', async () => {
    // 0 is falsy, so an `if (options.x)` guard would silently discard it and
    // hand back the unfiltered page. The guards use `!== undefined` for this.
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    await pools.filter('ethereum', { priceChange1hMin: 0 });
    assertEqual(client.lastParams().price_change_percentage_1h_min, 0, 'params.price_change_percentage_1h_min');
  });

  await test('pools.filter sends no price-change param when none was asked for', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    await pools.filter('ethereum', { volume24hMin: 100000 });
    const params = client.lastParams();
    const stray = Object.keys(params).filter(k => k.startsWith('price_change_'));
    if (stray.length > 0) {
      throw new Error(`Unrequested price-change params in the query: ${stray.join(', ')}`);
    }
    assertEqual(params.volume_usd_24h_min, 100000, 'params.volume_usd_24h_min');
  });

  await test('pools.filter sends all eight bounds together, none overwriting another', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    const options: Record<string, number> = {};
    POOL_BOUNDS.forEach(([option], i) => {
      options[String(option)] = i + 1;
    });
    await pools.filter('ethereum', options as any);
    const params = client.lastParams();
    POOL_BOUNDS.forEach(([option, param], i) => {
      assertEqual(params[param], i + 1, `params.${param} (from ${String(option)})`);
    });
  });

  for (const [option, param] of TOKEN_BOUNDS) {
    await test(`tokens.filter sends ${String(option)} as ${param}`, async () => {
      const client = new RecordingClient();
      const tokens = new TokensAPI(client);
      await tokens.filter('ethereum', { [option]: 17.5 } as any);
      assertEqual(client.lastEndpoint(), '/networks/ethereum/tokens/search', 'endpoint');
      assertEqual(client.lastParams()[param], 17.5, `params.${param}`);
    });
  }

  await test('tokens.filter takes no bound on the short windows', async () => {
    // tokens/search ignores 6h/1h/5m bounds instead of rejecting them, so the
    // SDK must not offer an option that would look like it worked. Passing one
    // anyway has to leave the query alone.
    const client = new RecordingClient();
    const tokens = new TokensAPI(client);
    await tokens.filter('ethereum', { priceChange1hMin: 50, priceChange5mMax: -5 } as any);
    const shortWindows = Object.keys(client.lastParams()).filter(
      k => /price_change_percentage_(6h|1h|5m)_/.test(k)
    );
    if (shortWindows.length > 0) {
      throw new Error(`tokens/search query carries short-window bounds it ignores: ${shortWindows.join(', ')}`);
    }
  });

  await test('pool sort fields pass through for all four windows', async () => {
    for (const field of [
      'price_change_percentage_24h',
      'price_change_percentage_6h',
      'price_change_percentage_1h',
      'price_change_percentage_5m',
    ]) {
      assertEqual(mapPoolSortField(field), field, `mapPoolSortField('${field}')`);
    }
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    await pools.filter('ethereum', { sortBy: 'price_change_percentage_5m' });
    assertEqual(client.lastParams().order_by, 'price_change_percentage_5m', 'params.order_by');
  });

  await test('token sort keeps 24h and folds the three short windows', async () => {
    assertEqual(
      mapTokenSortField('price_change_percentage_24h'),
      'price_change_percentage_24h',
      "mapTokenSortField('price_change_percentage_24h')"
    );
    for (const field of [
      'price_change_percentage_6h',
      'price_change_percentage_1h',
      'price_change_percentage_5m',
    ]) {
      assertEqual(mapTokenSortField(field), 'volume_usd_24h', `mapTokenSortField('${field}')`);
    }
    // tokens/search also answers 400 on price_usd ordering, despite listing it
    // in its own error enum, so that one folds to the default as well.
    assertEqual(mapTokenSortField('price_usd'), 'volume_usd_24h', "mapTokenSortField('price_usd')");
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(`${'='.repeat(50)}`);

  if (failed > 0) process.exit(1);
}

main();
