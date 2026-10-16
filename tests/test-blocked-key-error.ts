/**
 * A 403 whose body is not JSON (a Cloudflare block page) means the request
 * never reached the API: the key was malformed. This maps to a clear
 * ApiError instead of "Unknown API error".
 *
 * A 403 WITH a JSON body (the API's own `plan_required` refusal, for
 * example) is a different thing and must keep its existing handling.
 *
 * Run: npm run test:blocked-key-error
 */
import assert from 'node:assert/strict';
import { DexPaprikaClient, ApiError } from '../src';

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

/** A client whose httpClient.get rejects with an axios-shaped 403. */
function clientRejectingWith(data: unknown): DexPaprikaClient {
  const client = new DexPaprikaClient('https://api-pro.dexpaprika.com');
  (client as any).httpClient = {
    get: async () => {
      const error: any = new Error('Request failed with status code 403');
      error.response = { status: 403, data };
      throw error;
    },
  };
  return client;
}

async function main(): Promise<void> {
  await test('a 403 HTML body (Cloudflare block page) reports the key was refused', async () => {
    const client = clientRejectingWith('<html>Sorry, you have been blocked</html>');
    let caught: unknown;
    try {
      await client.networks.list();
    } catch (error) {
      caught = error;
    }
    assert.ok(caught instanceof ApiError, 'expected an ApiError');
    const err = caught as ApiError;
    assert.equal(err.statusCode, 403);
    assert.match(err.message, /The API key was refused before it reached the API\./);
    assert.match(err.message, /console\.dexpaprika\.com/);
    assert.equal(/bearer/i.test(err.message), false, 'must never mention a scheme word');
    assert.equal(err.errorCode, undefined);
  });

  await test('a 403 JSON plan_required body keeps its existing handling untouched', async () => {
    const client = clientRejectingWith({
      error: 'plan_required',
      message: 'Search results beyond the first page require an API key',
      param: 'cursor',
      required_tier: 'free',
    });
    let caught: unknown;
    try {
      await client.networks.list();
    } catch (error) {
      caught = error;
    }
    assert.ok(caught instanceof ApiError, 'expected an ApiError');
    const err = caught as ApiError;
    assert.equal(err.statusCode, 403);
    assert.equal(err.errorCode, 'plan_required');
    assert.equal(err.param, 'cursor');
    assert.equal(err.requiredTier, 'free');
    assert.equal(
      /refused before it reached the API/.test(err.message),
      false,
      'the plan_required path must not be rewritten',
    );
  });

  if (failures > 0) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall blocked-key-error tests passed');
}

main();
