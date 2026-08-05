/// <reference types="node" />
import http from 'http';
import { AddressInfo } from 'net';
import axios from 'axios';
import { DexPaprikaClient, DeprecatedEndpointError } from '../src';

// Regression tests for the removal of GET /networks/{network}/dexes/{dex}/pools.
//
// The first two blocks run against a local stub server so the exact request the
// SDK puts on the wire can be asserted without spending live API quota. The last
// block proves both directions against the real API: the old path answers 410,
// the new path answers 200 and honours the dex_name filter.

const LIVE_BASE_URL = 'https://api.dexpaprika.com';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`PASS  ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`FAIL  ${name}: ${err.message || err}`);
    failed++;
  }
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`);
  }
}

interface CapturedRequest {
  pathname: string;
  query: URLSearchParams;
}

// Start a stub server that records the incoming request and replies with `body`
// at `status`. Returns the base URL and the captured request holder.
async function withStubServer(
  status: number,
  body: string,
  run: (baseUrl: string, captured: { request?: CapturedRequest }) => Promise<void>
) {
  const captured: { request?: CapturedRequest } = {};
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    captured.request = { pathname: url.pathname, query: url.searchParams };
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(body);
  });

  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`, captured);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

// Field names copied from a live /pools/search response captured on 2026-08-05:
// rows under "results", 24h volume as "volume_usd_24h", cursor pagination, and
// no page_info anywhere.
const SEARCH_RESPONSE = JSON.stringify({
  results: [
    {
      id: '0x4f493b7de8aac7d55f71853688b1f7c8f0243c85',
      dex_id: 'curve',
      dex_name: 'Curve',
      chain: 'ethereum',
      volume_usd_24h: 15883391.558251368,
      created_at: '2025-01-25T17:20:47Z',
      created_at_block_number: 21702976,
      transactions_24h: 289,
      price_usd: 0.9995787501356217,
      price_change_percentage_5m: null,
      price_change_percentage_1h: 0.02422482089565938,
      price_change_percentage_6h: 0.009802157529374174,
      price_change_percentage_24h: 0.007018797950998323,
      fee: null,
      volume_usd_7d: 31781851.73428885,
      volume_usd_30d: 136889876.39037386,
      liquidity_usd: 7407910.088430515,
      tokens: [
        { id: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', chain: 'ethereum', has_image: true },
        { id: '0xdac17f958d2ee523a2206206994597c13d831ec7', chain: 'ethereum', has_image: true },
      ],
    },
  ],
  has_next_page: true,
  next_cursor: 'eyJjaGFpbiI6ImV0aGVyZXVtIn0',
  query: { network: 'ethereum', limit: 1, dex_name: 'curve', order_by: 'volume_usd_24h' },
});

const GONE_RESPONSE = JSON.stringify({
  code: 410,
  message: 'endpoint removed',
  replacement: '/networks/:network/pools/search',
});

async function main() {
  console.log('Testing pools.listByDex after the dexes/{dex}/pools removal\n');

  await test('listByDex requests /pools/search with dex_name', async () => {
    await withStubServer(200, SEARCH_RESPONSE, async (baseUrl, captured) => {
      const client = new DexPaprikaClient(baseUrl);
      const result = await client.pools.listByDex('ethereum', 'curve', {
        limit: 1,
        page: 7,
        orderBy: 'volume_usd',
        sort: 'desc',
      });

      const req = captured.request;
      assert(req, 'stub server recorded no request');
      assertEqual(req!.pathname, '/networks/ethereum/pools/search', 'request path');
      assertEqual(req!.query.get('dex_name'), 'curve', 'dex_name param');

      // The legacy page parameter must not travel: /pools/search is cursor-based.
      assert(!req!.query.has('page'), 'listByDex must not send page');

      // Legacy sort values are rejected upstream with HTTP 400, so order_by is
      // normalized to the canonical field name.
      assertEqual(req!.query.get('order_by'), 'volume_usd_24h', 'order_by param');

      assertEqual(result.results.length, 1, 'results length');
      assertEqual(result.results[0].dex_id, 'curve', 'result dex_id');
      assertEqual(result.results[0].volume_usd_24h, 15883391.558251368, 'volume_usd_24h');
      assertEqual(result.results[0].transactions_24h, 289, 'transactions_24h');
      assertEqual(
        result.results[0].price_change_percentage_6h,
        0.009802157529374174,
        'price_change_percentage_6h'
      );
      assertEqual(result.has_next_page, true, 'has_next_page');
      assertEqual(result.next_cursor, 'eyJjaGFpbiI6ImV0aGVyZXVtIn0', 'next_cursor');
      assert(!('page_info' in (result as any)), '/pools/search must not carry page_info');
    });
  });

  await test('listByDex passes cursor through for the next page', async () => {
    await withStubServer(200, SEARCH_RESPONSE, async (baseUrl, captured) => {
      const client = new DexPaprikaClient(baseUrl);
      await client.pools.listByDex('ethereum', 'curve', { limit: 1, cursor: 'abc123' });
      assertEqual(captured.request!.query.get('cursor'), 'abc123', 'cursor param');
    });
  });

  await test('a 410 surfaces the replacement from the response body', async () => {
    await withStubServer(410, GONE_RESPONSE, async baseUrl => {
      const client = new DexPaprikaClient(baseUrl);
      try {
        await client.pools.listByDex('ethereum', 'curve');
        throw new Error('expected a DeprecatedEndpointError, got a resolved promise');
      } catch (err: any) {
        assert(
          err instanceof DeprecatedEndpointError,
          `expected DeprecatedEndpointError, got ${err?.name ?? typeof err}`
        );
        assertEqual(err.replacement, '/networks/:network/pools/search', 'error replacement');
        assertEqual(err.apiMessage, 'endpoint removed', 'error apiMessage');
        assert(
          err.message.includes('/networks/:network/pools/search'),
          `error message should name the replacement, got: ${err.message}`
        );
      }
    });
  });

  await test('live: the old dexes/{dex}/pools path is gone', async () => {
    const res = await axios.get(`${LIVE_BASE_URL}/networks/ethereum/dexes/uniswap_v3/pools`, {
      params: { limit: 2 },
      validateStatus: () => true,
    });
    assertEqual(res.status, 410, 'old path status');
    assertEqual(res.data?.replacement, '/networks/:network/pools/search', 'old path replacement');
    console.log(`      old path -> ${res.status} ${JSON.stringify(res.data)}`);
  });

  await test('live: listByDex returns only pools from the requested DEX', async () => {
    const client = new DexPaprikaClient();
    const result = await client.pools.listByDex('ethereum', 'uniswap_v3', { limit: 5 });
    assert(result.results.length > 0, 'no results from the live endpoint');
    for (const pool of result.results) {
      assertEqual(pool.dex_id, 'uniswap_v3', `pool ${pool.id} dex_id`);
      assert(
        typeof pool.volume_usd_24h === 'number',
        `pool ${pool.id} is missing volume_usd_24h`
      );
      assert(
        !('volume_usd' in (pool as any)),
        `pool ${pool.id} unexpectedly carries a bare volume_usd`
      );
    }
    console.log(
      `      live -> ${result.results.length} uniswap_v3 pools, has_next_page=${result.has_next_page}`
    );
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(`${'='.repeat(50)}`);

  if (failed > 0) process.exit(1);
}

main();
