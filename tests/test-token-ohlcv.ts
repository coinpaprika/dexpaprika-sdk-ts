/// <reference types="node" />
// Offline checks for tokens.getOHLCV(): the path and query it builds, that it
// never sends `inversed` (the endpoint has no such parameter, unlike pool
// OHLCV), and that a 403 from the API surfaces its own message on the thrown
// ApiError. No network involved; see tests/test-search-params.ts for the same
// RecordingClient pattern applied to the search endpoints.
//
// Run: npx tsx tests/test-token-ohlcv.ts

import { DexPaprikaClient } from '../src';
import { TokensAPI } from '../src/api/tokens';
import { ApiError } from '../src/utils/errors';

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

function assertEqual(actual: unknown, expected: unknown, what: string) {
  if (actual !== expected) {
    throw new Error(`${what}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
  }
}

// A client that records the endpoint and params of every GET and answers with
// an empty array instead of calling the API.
class RecordingClient extends DexPaprikaClient {
  public calls: { endpoint: string; params: Record<string, any> }[] = [];

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    this.calls.push({ endpoint, params: { ...(params ?? {}) } });
    return [] as unknown as T;
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

// A client that fails every GET the way axios does for an HTTP error
// response, so BaseAPI._get's error handling runs the same as it would live.
class FailingClient extends DexPaprikaClient {
  constructor(private status: number, private body: any) {
    super();
  }

  async get<T>(): Promise<T> {
    const error: any = new Error('Request failed');
    error.response = { status: this.status, data: this.body };
    throw error;
  }
}

async function main() {
  console.log('Checking the query tokens.getOHLCV() builds, and its error handling\n');

  await test('sends the correct path and query with defaults', async () => {
    const client = new RecordingClient();
    const tokens = new TokensAPI(client);
    await tokens.getOHLCV('ethereum', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', { start: '-24h' });
    assertEqual(
      client.lastEndpoint(),
      '/networks/ethereum/tokens/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2/ohlcv',
      'endpoint'
    );
    const params = client.lastParams();
    assertEqual(params.start, '-24h', 'params.start');
    assertEqual(params.limit, 10, 'params.limit (server default)');
    assertEqual(params.interval, '24h', 'params.interval (server default)');
    assertEqual('end' in params, false, 'params.end absent when not given');
  });

  await test('passes limit, interval and end through when given', async () => {
    const client = new RecordingClient();
    const tokens = new TokensAPI(client);
    await tokens.getOHLCV('solana', 'So11111111111111111111111111111111111111112', {
      start: '-7d',
      end: '-1d',
      interval: '1h',
      limit: 168,
    });
    const params = client.lastParams();
    assertEqual(params.start, '-7d', 'params.start');
    assertEqual(params.end, '-1d', 'params.end');
    assertEqual(params.interval, '1h', 'params.interval');
    assertEqual(params.limit, 168, 'params.limit');
  });

  await test('accepts a limit up to the documented maximum of 1000', async () => {
    const client = new RecordingClient();
    const tokens = new TokensAPI(client);
    await tokens.getOHLCV('ethereum', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', {
      start: '-24h',
      limit: 1000,
    });
    assertEqual(client.lastParams().limit, 1000, 'params.limit');
  });

  await test('never sends inversed, unlike pools.getOHLCV', async () => {
    const client = new RecordingClient();
    const tokens = new TokensAPI(client);
    // There is no `inversed` field on TokenOHLCVOptions; `as any` proves the
    // method does not forward a stray one even if a caller sneaks it in.
    await tokens.getOHLCV('ethereum', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', {
      start: '-24h',
      inversed: true,
    } as any);
    assertEqual('inversed' in client.lastParams(), false, 'params.inversed must be absent');
  });

  await test('requires a network ID', async () => {
    const client = new RecordingClient();
    const tokens = new TokensAPI(client);
    let threw = false;
    try {
      await tokens.getOHLCV('', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', { start: '-24h' });
    } catch {
      threw = true;
    }
    assertEqual(threw, true, 'expected a throw for an empty network ID');
    assertEqual(client.calls.length, 0, 'no request should have been made');
  });

  await test('requires a token address', async () => {
    const client = new RecordingClient();
    const tokens = new TokensAPI(client);
    let threw = false;
    try {
      await tokens.getOHLCV('ethereum', '', { start: '-24h' });
    } catch {
      threw = true;
    }
    assertEqual(threw, true, 'expected a throw for an empty token address');
    assertEqual(client.calls.length, 0, 'no request should have been made');
  });

  await test('a 403 surfaces the API\'s own message on ApiError', async () => {
    const client = new FailingClient(403, { message: 'this endpoint requires a Dev or Pro plan' });
    const tokens = new TokensAPI(client);
    try {
      await tokens.getOHLCV('ethereum', '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', { start: '-24h' });
      throw new Error('expected getOHLCV to throw');
    } catch (err: any) {
      if (!(err instanceof ApiError)) {
        throw new Error(`expected an ApiError, got ${err.constructor?.name}: ${err.message}`);
      }
      assertEqual(err.statusCode, 403, 'err.statusCode');
      assertEqual(
        err.message,
        'API Error (403): this endpoint requires a Dev or Pro plan',
        'err.message'
      );
    }
  });

  await test('a 5xx edge body shows its message, not [object Object]', async () => {
    // Captured from api-pro on 2026-09-29 for an unknown token address.
    const client = new FailingClient(500, {
      success: false,
      error: { code: 'ORIGIN_ERROR', message: 'Upstream service failed to respond successfully.' },
    });
    const tokens = new TokensAPI(client);
    try {
      await tokens.getOHLCV('ethereum', '0x0000000000000000000000000000000000000001', { start: '-24h' });
      throw new Error('expected getOHLCV to throw');
    } catch (err: any) {
      if (!(err instanceof ApiError)) {
        throw new Error(`expected an ApiError, got ${err.constructor?.name}: ${err.message}`);
      }
      assertEqual(err.message, 'API Error (500): Upstream service failed to respond successfully.', 'err.message');
    }
  });

  await test('a candle without volume comes back with volume 0', async () => {
    // A real 1m UNI candle from api-pro on 2026-09-29: USD volume under $1,
    // so the API left the field out (coinpaprika/dexpaprika-go#2430).
    class ReturningClient extends DexPaprikaClient {
      async get<T>(): Promise<T> {
        return [
          { time_open: '2026-09-29T09:12:00Z', time_close: '2026-09-29T09:13:00Z', open: 8.97, high: 8.98, low: 8.97, close: 8.98, volume: 152 },
          { time_open: '2026-09-29T09:13:00Z', time_close: '2026-09-29T09:14:00Z', open: 8.977335891233913, high: 8.977335891233913, low: 8.977335891233913, close: 8.977335891233913 },
        ] as unknown as T;
      }
    }
    const tokens = new TokensAPI(new ReturningClient());
    const rows = await tokens.getOHLCV('ethereum', '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', { start: '-2h', interval: '1m' });
    assertEqual(rows[0].volume, 152, 'rows[0].volume');
    assertEqual(rows[1].volume, 0, 'rows[1].volume');
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(`${'='.repeat(50)}`);

  if (failed > 0) process.exit(1);
}

main();
