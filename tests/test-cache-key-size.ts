/**
 * A request whose cache key is longer than any real one must not be held in
 * the cache. `getCacheKey()` built the key by concatenating the endpoint string
 * (which embeds a raw network id, pool address or token address) with the
 * stringified params, so a caller who passed an unusually long id had that
 * whole string retained, verbatim, in the cache for as long as the entry
 * survived, for every one of up to `maxSize` such entries. Runs against a
 * stubbed HTTP adapter, so no request leaves the process.
 *
 * Run: npm run test:cache-key-size
 */
import assert from 'node:assert/strict';
import { DexPaprikaClient, MAX_CACHE_KEY_LENGTH } from '../src/client';

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

/** A client whose adapter answers a small fixed body without leaving the process. */
function stubbedClient(calls: { count: number }): DexPaprikaClient {
  return new DexPaprikaClient('https://api.dexpaprika.com', {
    adapter: async (config) => {
      calls.count += 1;
      return { data: { pool: 'ok' }, status: 200, statusText: 'OK', headers: {}, config };
    },
  });
}

// Long enough to prove the point without being slow; a real address would
// pass the same path-segment check at a few dozen characters.
const HUGE_ID = '0x' + 'a'.repeat(100_000);

async function main(): Promise<void> {
  await test('a request with a very long id is not held in the cache', async () => {
    const calls = { count: 0 };
    const client = stubbedClient(calls);

    await client.pools.getDetails('ethereum', HUGE_ID);
    await client.pools.getDetails('ethereum', HUGE_ID);
    assert.equal(calls.count, 2, 'an oversized request should reach the adapter every time');

    const store: Map<string, unknown> = (client as any).cache.store;
    for (const key of store.keys()) {
      assert.ok(key.length <= MAX_CACHE_KEY_LENGTH, `cache holds a key of ${key.length} chars`);
    }
    assert.equal(store.size, 0, 'nothing should be cached for an oversized key');
  });

  await test('an ordinary id is still cached and keyed exactly', async () => {
    const calls = { count: 0 };
    const client = stubbedClient(calls);
    const id = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640';

    await client.pools.getDetails('ethereum', id);
    await client.pools.getDetails('ethereum', id);
    assert.equal(calls.count, 1, 'the second call with the same id should be served from cache');
    const [key] = (client as any).cache.store.keys();
    assert.ok(key.includes(id), 'the key is the request itself, not a digest that could collide');
  });

  await test('two different ids land in two distinct cache entries', async () => {
    const calls = { count: 0 };
    const client = stubbedClient(calls);

    await client.pools.getDetails('ethereum', '0x' + 'a'.repeat(40));
    await client.pools.getDetails('ethereum', '0x' + 'b'.repeat(40));
    assert.equal(calls.count, 2);
    assert.equal((client as any).cache.store.size, 2);
  });

  if (failures > 0) {
    console.error(`\n${failures} test(s) failed`);
    process.exit(1);
  }
  console.log('\nall cache-key-size tests passed');
}

main();
