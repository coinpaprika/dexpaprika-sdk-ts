/**
 * Transaction and multi-price response types.
 *
 * Two checks in one file. `npm run typecheck:tests` compiles it with tsc: until
 * 1.11.1 getTransactions() returned Promise<unknown>, so reading
 * `result.transactions` did not compile without a cast. `npm run test:types`
 * then runs it against a stubbed HTTP adapter, so no request leaves the process.
 *
 * The response bodies are real ones read off the API on 2026-09-28 and trimmed
 * to one row each.
 *
 * Run: npm run typecheck:tests && npm run test:types
 */
import assert from 'node:assert/strict';
import { DexPaprikaClient } from '../src/client';
import { Transaction, TransactionsResponse } from '../src/models/pools';
import { TokenPrice } from '../src/models/tokens';

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

// GET /networks/ethereum/pools/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640/transactions?limit=1
const TRANSACTIONS_BODY = `{"transactions":[{"id":"0x5725e2d9703058c9a7061607824fb06b7b2aa93430e062db77f777246a6b6990","log_index":437,"transaction_index":151,"factory_id":"0x1f98431c8ad98523631ae4a59f267346ea31f984","pool_id":"0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640","chain":"ethereum","sender":"0x1644d2477f809cc2c71bccfd6dc9497e3f83210d","recipient":"0x1644d2477f809cc2c71bccfd6dc9497e3f83210d","token_0":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","token_0_symbol":"WETH","token_1":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","token_1_symbol":"USDC","amount_0":63263614377746491,"amount_1":-169877256,"volume_0":0.06326361437774648,"volume_1":169.877256,"price_0":2683.8887049164923,"price_1":0.00037259369144784055,"price_0_usd":2683.9738357574342,"price_1_usd":0.9997157408105811,"created_at_block_number":26076148,"created_at_block_hash":"0xfc7c3f1e176ea23f178a03656ad806a13f0c712f578f03cd8731affd055fb567","created_at":"2026-09-28T13:07:11Z","canonical_chain":true}],"page_info":{"limit":1,"page":1,"total_items":48913,"total_pages":48913}}`;

// GET /networks/ethereum/multi/prices?tokens=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
const MULTI_PRICES_BODY = `[{"chain":"ethereum","id":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","price_usd":2683.9242610156934,"last_updated":"2026-09-28T13:06:30Z"}]`;

/** A client whose HTTP adapter answers with `body` and records the URL asked for. */
function stubbedClient(body: string, seen: string[]): DexPaprikaClient {
  return new DexPaprikaClient('https://api.dexpaprika.com', {
    adapter: async (config) => {
      seen.push(`${config.url}?${new URLSearchParams(config.params).toString()}`);
      return { data: JSON.parse(body), status: 200, statusText: 'OK', headers: {}, config };
    },
  }, { cache: { enabled: false } });
}

async function main(): Promise<void> {
  await test('getTransactions() is typed, so .transactions compiles without a cast', async () => {
    const seen: string[] = [];
    const client = stubbedClient(TRANSACTIONS_BODY, seen);
    const result: TransactionsResponse = await client.pools.getTransactions(
      'ethereum',
      '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      { limit: 1, from: '-1h' },
    );
    const tx: Transaction = result.transactions[0];

    assert.equal(tx.id, '0x5725e2d9703058c9a7061607824fb06b7b2aa93430e062db77f777246a6b6990');
    assert.equal(tx.created_at, '2026-09-28T13:07:11Z');
    assert.equal(tx.token_0_symbol, 'WETH');
    assert.equal(tx.token_1_symbol, 'USDC');
    assert.equal(tx.volume_1, 169.877256);
    assert.equal(tx.price_0_usd, 2683.9738357574342);
    assert.equal(result.page_info.total_items, 48913);
    assert.match(seen[0], /\/pools\/0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640\/transactions\?/);
    assert.match(seen[0], /from=-1h/);
  });

  await test('getTxs() returns the same type', async () => {
    const client = stubbedClient(TRANSACTIONS_BODY, []);
    const result = await client.pools.getTxs('ethereum', '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640');
    const createdAt: string | undefined = result.transactions[0].created_at;
    assert.equal(createdAt, '2026-09-28T13:07:11Z');
  });

  await test('multi-price rows carry last_updated', async () => {
    const client = stubbedClient(MULTI_PRICES_BODY, []);
    const prices: TokenPrice[] = await client.tokens.getMultiPrices('ethereum', [
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    ]);
    const lastUpdated: string | undefined = prices[0].last_updated;
    assert.equal(lastUpdated, '2026-09-28T13:06:30Z');
  });

  if (failures > 0) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall transaction and price type tests passed');
}

main();
