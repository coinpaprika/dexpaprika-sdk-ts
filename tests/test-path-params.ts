/**
 * Ids that go into the request path.
 *
 * Every method that puts a network id, pool address or token address into the
 * URL path must refuse a value that would change that path or add a query, and
 * must send a real id exactly as given. Runs against a stubbed HTTP adapter, so
 * no request leaves the process.
 *
 * Run: npm run test:path-params
 */
import assert from 'node:assert/strict';
import { DexPaprikaClient } from '../src/client';
import { DexPaprikaError } from '../src/utils/errors';

let failures = 0;
async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`  FAIL ${name}\n       ${(error as Error).message}`);
  }
}

/** A client whose adapter records the path of every request it is asked for and answers `body`. */
function stubbedClient(seen: string[], body: unknown = {}): DexPaprikaClient {
  return new DexPaprikaClient('https://api.dexpaprika.com', {
    adapter: async (config) => {
      seen.push(new URL(String(config.url), 'https://api.dexpaprika.com').pathname);
      return { data: body, status: 200, statusText: 'OK', headers: {}, config };
    },
  }, { cache: { enabled: false } });
}

const POOL = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640';
const TOKEN = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

// Every method that builds a path from caller input, with the argument that
// carries the network (n), and the pool or token address (a) where there is one.
type Call = { name: string; run: (c: DexPaprikaClient, n: string, a: string) => Promise<unknown>; address: boolean };
const any = {} as any;
const CALLS: Call[] = [
  { name: 'pools.listByNetwork', address: false, run: (c, n) => c.pools.listByNetwork(n) },
  { name: 'pools.listByDex', address: false, run: (c, n) => c.pools.listByDex(n, 'uniswap_v3') },
  { name: 'pools.getDetails', address: true, run: (c, n, a) => c.pools.getDetails(n, a) },
  { name: 'pools.getOHLCV', address: true, run: (c, n, a) => c.pools.getOHLCV(n, a, { ...any, start: '-24h', interval: '1h' }) },
  { name: 'pools.getTxs', address: true, run: (c, n, a) => c.pools.getTxs(n, a) },
  { name: 'pools.filter', address: false, run: (c, n) => c.pools.filter(n) },
  { name: 'pools.getIndicator', address: true, run: (c, n, a) => c.pools.getIndicator(n, a, { ...any, indicator: 'rsi' }) },
  { name: 'tokens.getDetails', address: true, run: (c, n, a) => c.tokens.getDetails(n, a) },
  { name: 'tokens.getPools', address: false, run: (c, n, a) => c.tokens.getPools(n, a) },
  { name: 'tokens.getTop', address: false, run: (c, n) => c.tokens.getTop(n) },
  { name: 'tokens.filter', address: false, run: (c, n) => c.tokens.filter(n) },
  { name: 'tokens.getOHLCV', address: true, run: (c, n, a) => c.tokens.getOHLCV(n, a, { ...any, start: '-24h', interval: '1h' }) },
  { name: 'tokens.getMultiPrices', address: false, run: (c, n) => c.tokens.getMultiPrices(n, [TOKEN]) },
  { name: 'tokens.getIndicator', address: true, run: (c, n, a) => c.tokens.getIndicator(n, a, { ...any, indicator: 'rsi' }) },
  { name: 'dexes.listByNetwork', address: false, run: (c, n) => c.dexes.listByNetwork(n) },
];

const BAD = [
  '.', '..', '../../usage', '../../../stats', 'eth/../x', 'a\\b', 'x?limit=1000', 'x#y',
  '%2e%2e', '..%2Fusage', 'a b', 'a\nb', 'a\u0000b',
];

async function main(): Promise<void> {
  await test('every path-building method refuses a network id that leaves its segment, before any request', async () => {
    for (const call of CALLS) {
      for (const bad of BAD) {
        const seen: string[] = [];
        await assert.rejects(call.run(stubbedClient(seen), bad, POOL), DexPaprikaError, `${call.name}(network=${JSON.stringify(bad)})`);
        assert.deepEqual(seen, [], `${call.name}(network=${JSON.stringify(bad)}) sent ${seen[0]}`);
      }
    }
  });

  await test('every method with an address refuses one that leaves its segment, before any request', async () => {
    for (const call of CALLS.filter((c) => c.address)) {
      for (const bad of BAD) {
        const seen: string[] = [];
        await assert.rejects(call.run(stubbedClient(seen), 'ethereum', bad), DexPaprikaError, `${call.name}(address=${JSON.stringify(bad)})`);
        assert.deepEqual(seen, [], `${call.name}(address=${JSON.stringify(bad)}) sent ${seen[0]}`);
      }
    }
  });

  await test('real network ids and addresses reach the path exactly as given', async () => {
    const cases: Array<[string, string]> = [
      ['ethereum', POOL],
      ['bob_network', TOKEN],
      ['solana', 'So11111111111111111111111111111111111111112'],
      ['sui', '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI'],
      ['ton', 'EQA-X_yo3fzzbDbJ_0bzFWKqtRuZFIRa1sJsveZJ1YpViO3r'],
    ];
    for (const [network, address] of cases) {
      const seen: string[] = [];
      const client = stubbedClient(seen);
      await client.tokens.getDetails(network, address);
      await client.pools.getDetails(network, address);
      assert.deepEqual(seen, [
        `/networks/${network}/tokens/${address}`,
        `/networks/${network}/pools/${address}`,
      ]);
    }
  });

  if (failures > 0) {
    console.error(`\n${failures} test(s) failed`);
    process.exit(1);
  }
  console.log('\nall path parameter tests passed');
}

main();
