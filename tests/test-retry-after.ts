/**
 * withRetry() honours the server's requested wait on a 429: a Retry-After
 * header (seconds) first, the body's retry_after field as a fallback, never
 * an HTTP-date form, clamped to 60s, and only when it is longer than the
 * normal backoff. A 404 (or any other 4xx besides 429) is never retried.
 *
 * No real sleeping: every test injects a fake sleepFn that records the
 * requested delay instead of waiting it out.
 *
 * Run: npm run test:retry-after
 */
import assert from 'node:assert/strict';
import { withRetry } from '../src/utils/helpers';

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

/** A fake sleep that records every requested delay instead of waiting. */
function fakeSleep(): { sleepFn: (ms: number) => Promise<void>; calls: number[] } {
  const calls: number[] = [];
  const sleepFn = async (ms: number) => {
    calls.push(ms);
  };
  return { sleepFn, calls };
}

/** An axios-shaped 429 error with a Retry-After header, a retry_after body field, or both. */
function rateLimitError(opts: { header?: string; body?: Record<string, unknown> } = {}): any {
  const error: any = new Error('Request failed with status code 429');
  error.response = {
    status: 429,
    headers: opts.header !== undefined ? { 'retry-after': opts.header } : {},
    data: opts.body ?? { error: 'rate_limited', tier: 'keyless' },
  };
  return error;
}

function notFoundError(): any {
  const error: any = new Error('Request failed with status code 404');
  error.response = { status: 404, headers: {}, data: { error: 'not_found' } };
  return error;
}

async function main(): Promise<void> {
  await test('a 404 is never retried', async () => {
    const { sleepFn, calls } = fakeSleep();
    let attempts = 0;
    const operation = async () => {
      attempts += 1;
      throw notFoundError();
    };
    await assert.rejects(
      withRetry(operation, { maxRetries: 3, delaySequenceMs: [1, 1, 1] }, sleepFn),
    );
    assert.equal(attempts, 1, 'a 404 must not be retried');
    assert.deepEqual(calls, [], 'no delay was ever awaited');
  });

  await test('a 429 is retried', async () => {
    const { sleepFn } = fakeSleep();
    let attempts = 0;
    const operation = async () => {
      attempts += 1;
      if (attempts < 2) throw rateLimitError();
      return 'ok';
    };
    const result = await withRetry(operation, { maxRetries: 3, delaySequenceMs: [1, 1, 1] }, sleepFn);
    assert.equal(result, 'ok');
    assert.equal(attempts, 2);
  });

  await test('the Retry-After header wins over a short local backoff', async () => {
    const { sleepFn, calls } = fakeSleep();
    let attempts = 0;
    const operation = async () => {
      attempts += 1;
      if (attempts < 2) throw rateLimitError({ header: '12' });
      return 'ok';
    };
    await withRetry(operation, { maxRetries: 3, delaySequenceMs: [1, 1, 1] }, sleepFn);
    assert.deepEqual(calls, [12_000], 'should have waited the 12s the header asked for, not 1ms');
  });

  await test("falls back to the body's retry_after when there is no header", async () => {
    const { sleepFn, calls } = fakeSleep();
    let attempts = 0;
    const operation = async () => {
      attempts += 1;
      if (attempts < 2) throw rateLimitError({ body: { error: 'rate_limited', retry_after: 9 } });
      return 'ok';
    };
    await withRetry(operation, { maxRetries: 3, delaySequenceMs: [1, 1, 1] }, sleepFn);
    assert.deepEqual(calls, [9_000]);
  });

  await test('the header is preferred over the body when both are present', async () => {
    const { sleepFn, calls } = fakeSleep();
    let attempts = 0;
    const operation = async () => {
      attempts += 1;
      if (attempts < 2) {
        throw rateLimitError({ header: '5', body: { error: 'rate_limited', retry_after: 40 } });
      }
      return 'ok';
    };
    await withRetry(operation, { maxRetries: 3, delaySequenceMs: [1, 1, 1] }, sleepFn);
    assert.deepEqual(calls, [5_000], 'the header value should win, not the body value');
  });

  await test('an HTTP-date Retry-After is not parsed, and falls through to the normal backoff', async () => {
    const { sleepFn, calls } = fakeSleep();
    let attempts = 0;
    const operation = async () => {
      attempts += 1;
      if (attempts < 2) throw rateLimitError({ header: 'Wed, 21 Oct 2026 07:28:00 GMT' });
      return 'ok';
    };
    await withRetry(operation, { maxRetries: 3, delaySequenceMs: [250, 1, 1] }, sleepFn);
    assert.deepEqual(calls, [250], 'an unparsed date must fall back to the configured backoff, not 0 or NaN');
  });

  await test('an accepted wait is clamped to 60 seconds', async () => {
    const { sleepFn, calls } = fakeSleep();
    let attempts = 0;
    const operation = async () => {
      attempts += 1;
      if (attempts < 2) throw rateLimitError({ header: '3600' });
      return 'ok';
    };
    await withRetry(operation, { maxRetries: 3, delaySequenceMs: [1, 1, 1] }, sleepFn);
    assert.deepEqual(calls, [60_000], 'an hour-long ask must be clamped to 60s');
  });

  await test('the server figure only wins when it is longer than the local backoff', async () => {
    const { sleepFn, calls } = fakeSleep();
    let attempts = 0;
    const operation = async () => {
      attempts += 1;
      if (attempts < 2) throw rateLimitError({ header: '1' });
      return 'ok';
    };
    await withRetry(operation, { maxRetries: 3, delaySequenceMs: [5_000, 1, 1] }, sleepFn);
    assert.deepEqual(calls, [5_000], 'a 1s ask must not shorten a longer local backoff');
  });

  if (failures > 0) {
    console.error(`\n${failures} failing`);
    process.exit(1);
  }
  console.log('\nall retry-after tests passed');
}

main();
