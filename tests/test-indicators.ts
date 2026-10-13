/// <reference types="node" />
// Offline checks for pools.getIndicator() and tokens.getIndicator(): the path
// and query they build, that only the options the caller set are sent (never
// a default for a parameter the caller left out, and never a parameter that
// belongs to a different indicator), that the rsi and macd response shapes
// come through unchanged, and that a 403 plan_required body surfaces cleanly
// on ApiError with requiredTier set. No network involved; see
// tests/test-token-ohlcv.ts for the same RecordingClient/FailingClient
// pattern applied to tokens.getOHLCV().
//
// Run: npx tsx tests/test-indicators.ts

import { DexPaprikaClient } from '../src';
import { PoolsAPI } from '../src/api/pools';
import { TokensAPI } from '../src/api/tokens';
import { ApiError, PoolNotFoundError } from '../src/utils/errors';
import { PoolIndicatorResponse, TokenIndicatorResponse } from '../src/models/indicators';

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
// an empty indicator response instead of calling the API.
class RecordingClient extends DexPaprikaClient {
  public calls: { endpoint: string; params: Record<string, any> }[] = [];

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    this.calls.push({ endpoint, params: { ...(params ?? {}) } });
    return {
      network: 'ethereum',
      indicator: params?.indicator,
      interval: params?.interval ?? '1h',
      parameters: {},
      data: [],
      has_next_page: false,
      next_cursor: '',
    } as unknown as T;
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

// A client that returns a fixed payload, for response-shape checks.
class ReturningClient extends DexPaprikaClient {
  constructor(private payload: any) {
    super();
  }

  async get<T>(): Promise<T> {
    return this.payload as T;
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

const POOL = '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640';
const TOKEN = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; // WETH

async function main() {
  console.log('Checking the query pools.getIndicator()/tokens.getIndicator() build, response parsing and error handling\n');

  // --- Query building, per indicator -------------------------------------

  await test('pools.getIndicator sends the correct path and only indicator when nothing else is set', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    await pools.getIndicator('ethereum', POOL, { indicator: 'rsi' });
    assertEqual(client.lastEndpoint(), `/networks/ethereum/pools/${POOL}/indicators`, 'endpoint');
    assertEqual(JSON.stringify(client.lastParams()), JSON.stringify({ indicator: 'rsi' }), 'params');
  });

  await test('pools.getIndicator(rsi) sends period only when given, never interval by default', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    await pools.getIndicator('ethereum', POOL, { indicator: 'rsi', period: 21, start: '-6h', interval: '1h' });
    const params = client.lastParams();
    assertEqual(params.indicator, 'rsi', 'params.indicator');
    assertEqual(params.period, 21, 'params.period');
    assertEqual(params.start, '-6h', 'params.start');
    assertEqual(params.interval, '1h', 'params.interval');
    assertEqual('fast_period' in params, false, 'params.fast_period absent for rsi');
    assertEqual('std_dev' in params, false, 'params.std_dev absent for rsi');
  });

  await test('pools.getIndicator(ema) sends only indicator and period', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    await pools.getIndicator('ethereum', POOL, { indicator: 'ema', period: 20 });
    assertEqual(JSON.stringify(client.lastParams()), JSON.stringify({ indicator: 'ema', period: 20 }), 'params');
  });

  await test('pools.getIndicator(macd) sends fast_period, slow_period and signal_period, never period', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    await pools.getIndicator('ethereum', POOL, {
      indicator: 'macd',
      fast_period: 12,
      slow_period: 26,
      signal_period: 9,
    });
    const params = client.lastParams();
    assertEqual(params.fast_period, 12, 'params.fast_period');
    assertEqual(params.slow_period, 26, 'params.slow_period');
    assertEqual(params.signal_period, 9, 'params.signal_period');
    assertEqual('period' in params, false, 'params.period absent for macd');
  });

  await test('pools.getIndicator(bbands) sends period and std_dev only', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    await pools.getIndicator('ethereum', POOL, { indicator: 'bbands', period: 20, std_dev: 2 });
    assertEqual(
      JSON.stringify(client.lastParams()),
      JSON.stringify({ indicator: 'bbands', period: 20, std_dev: 2 }),
      'params'
    );
  });

  await test('pools.getIndicator(vwap) sends only indicator and period', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    await pools.getIndicator('ethereum', POOL, { indicator: 'vwap', period: 14 });
    assertEqual(JSON.stringify(client.lastParams()), JSON.stringify({ indicator: 'vwap', period: 14 }), 'params');
  });

  await test('pools.getIndicator forwards limit, end and cursor only when given', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    await pools.getIndicator('ethereum', POOL, {
      indicator: 'rsi',
      limit: 500,
      end: '-1h',
      cursor: '1791882000',
    });
    const params = client.lastParams();
    assertEqual(params.limit, 500, 'params.limit');
    assertEqual(params.end, '-1h', 'params.end');
    assertEqual(params.cursor, '1791882000', 'params.cursor');
  });

  await test('tokens.getIndicator sends the correct path and only the given options', async () => {
    const client = new RecordingClient();
    const tokens = new TokensAPI(client);
    await tokens.getIndicator('ethereum', TOKEN, { indicator: 'macd', fast_period: 12 });
    assertEqual(client.lastEndpoint(), `/networks/ethereum/tokens/${TOKEN}/indicators`, 'endpoint');
    assertEqual(
      JSON.stringify(client.lastParams()),
      JSON.stringify({ indicator: 'macd', fast_period: 12 }),
      'params'
    );
  });

  // --- Validation ----------------------------------------------------------

  await test('pools.getIndicator requires a network ID', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    let threw = false;
    try {
      await pools.getIndicator('', POOL, { indicator: 'rsi' });
    } catch {
      threw = true;
    }
    assertEqual(threw, true, 'expected a throw for an empty network ID');
    assertEqual(client.calls.length, 0, 'no request should have been made');
  });

  await test('pools.getIndicator requires a pool address', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    let threw = false;
    try {
      await pools.getIndicator('ethereum', '', { indicator: 'rsi' });
    } catch {
      threw = true;
    }
    assertEqual(threw, true, 'expected a throw for an empty pool address');
    assertEqual(client.calls.length, 0, 'no request should have been made');
  });

  await test('pools.getIndicator requires an indicator', async () => {
    const client = new RecordingClient();
    const pools = new PoolsAPI(client);
    let threw = false;
    try {
      await pools.getIndicator('ethereum', POOL, {} as any);
    } catch {
      threw = true;
    }
    assertEqual(threw, true, 'expected a throw for a missing indicator');
    assertEqual(client.calls.length, 0, 'no request should have been made');
  });

  await test('tokens.getIndicator requires a token address', async () => {
    const client = new RecordingClient();
    const tokens = new TokensAPI(client);
    let threw = false;
    try {
      await tokens.getIndicator('ethereum', '', { indicator: 'rsi' });
    } catch {
      threw = true;
    }
    assertEqual(threw, true, 'expected a throw for an empty token address');
    assertEqual(client.calls.length, 0, 'no request should have been made');
  });

  // --- Response parsing ----------------------------------------------------

  await test('pools.getIndicator(rsi) parses the response shape (value per point)', async () => {
    // Captured from api.dexpaprika.com on 2026-10-13 for the sample pool.
    const payload = {
      network: 'ethereum',
      pool_address: POOL,
      indicator: 'rsi',
      interval: '1h',
      parameters: { period: 14 },
      data: [
        { timestamp: '2026-10-13T06:00:00Z', value: 54.38666301724629 },
        { timestamp: '2026-10-13T07:00:00Z', value: 53.184343874602874 },
      ],
      has_next_page: true,
      next_cursor: '1791882000',
    };
    const pools = new PoolsAPI(new ReturningClient(payload));
    const result: PoolIndicatorResponse = await pools.getIndicator('ethereum', POOL, {
      indicator: 'rsi',
      interval: '1h',
      start: '-6h',
    });
    assertEqual(result.pool_address, POOL, 'result.pool_address');
    assertEqual(result.parameters.period, 14, 'result.parameters.period');
    assertEqual(result.data.length, 2, 'result.data.length');
    assertEqual(result.data[0].timestamp, '2026-10-13T06:00:00Z', 'result.data[0].timestamp');
    assertEqual(result.data[0].value, 54.38666301724629, 'result.data[0].value');
    assertEqual(result.data[0].macd, undefined, 'result.data[0].macd is absent on rsi');
    assertEqual(result.has_next_page, true, 'result.has_next_page');
    assertEqual(result.next_cursor, '1791882000', 'result.next_cursor');
  });

  await test('tokens.getIndicator(macd) parses the response shape (macd/signal/histogram per point)', async () => {
    // Captured from api.dexpaprika.com on 2026-10-13 for the sample pool
    // (shape is identical for tokens, with token_address in place of pool_address).
    const payload = {
      network: 'ethereum',
      token_address: TOKEN,
      indicator: 'macd',
      interval: '1h',
      parameters: { fast_period: 12, signal_period: 9, slow_period: 26 },
      data: [
        { timestamp: '2026-10-13T06:00:00Z', macd: -11.534946379135818, signal: -22.75562121248413, histogram: 11.220674833348312 },
        { timestamp: '2026-10-13T07:00:00Z', macd: -8.78613090817089, signal: -19.96172315162148, histogram: 11.175592243450591 },
      ],
      has_next_page: true,
      next_cursor: '1791882000',
    };
    const tokens = new TokensAPI(new ReturningClient(payload));
    const result: TokenIndicatorResponse = await tokens.getIndicator('ethereum', TOKEN, {
      indicator: 'macd',
      interval: '1h',
      start: '-6h',
    });
    assertEqual(result.token_address, TOKEN, 'result.token_address');
    assertEqual(result.parameters.fast_period, 12, 'result.parameters.fast_period');
    assertEqual(result.parameters.slow_period, 26, 'result.parameters.slow_period');
    assertEqual(result.data[0].macd, -11.534946379135818, 'result.data[0].macd');
    assertEqual(result.data[0].signal, -22.75562121248413, 'result.data[0].signal');
    assertEqual(result.data[0].histogram, 11.220674833348312, 'result.data[0].histogram');
    assertEqual(result.data[0].value, undefined, 'result.data[0].value is absent on macd');
  });

  // --- Errors ---------------------------------------------------------------

  await test('tokens.getIndicator: a 403 plan_required surfaces cleanly with message and requiredTier', async () => {
    // Captured from api.dexpaprika.com on 2026-10-13 for a keyless token indicator call.
    const body = {
      error: 'plan_required',
      tier: 'keyless',
      message: 'this endpoint requires a Dev or Pro plan',
      required_tier: 'dev',
      links: {
        docs: 'https://docs.dexpaprika.com/',
        pricing: 'https://dexpaprika.com/api/pricing',
        register: 'https://console.dexpaprika.com',
      },
    };
    const client = new FailingClient(403, body);
    const tokens = new TokensAPI(client);
    try {
      await tokens.getIndicator('ethereum', TOKEN, { indicator: 'rsi', interval: '1h', start: '-6h' });
      throw new Error('expected getIndicator to throw');
    } catch (err: any) {
      if (!(err instanceof ApiError)) {
        throw new Error(`expected an ApiError, got ${err.constructor?.name}: ${err.message}`);
      }
      assertEqual(err.statusCode, 403, 'err.statusCode');
      assertEqual(err.errorCode, 'plan_required', 'err.errorCode');
      assertEqual(err.requiredTier, 'dev', 'err.requiredTier');
      assertEqual(
        err.message,
        'API Error (403): this endpoint requires a Dev or Pro plan',
        'err.message carries the human message, not the "plan_required" code'
      );
    }
  });

  await test('pools.getIndicator: invalid_param for a parameter the chosen indicator does not accept', async () => {
    // Captured from api.dexpaprika.com on 2026-10-13: indicator=rsi&fast_period=3.
    const body = {
      error: 'invalid_param',
      message: 'invalid query parameters: fast_period (unsupported parameter for rsi)',
      param: 'fast_period',
    };
    const client = new FailingClient(400, body);
    const pools = new PoolsAPI(client);
    try {
      await pools.getIndicator('ethereum', POOL, { indicator: 'rsi', fast_period: 3 } as any);
      throw new Error('expected getIndicator to throw');
    } catch (err: any) {
      if (!(err instanceof ApiError)) {
        throw new Error(`expected an ApiError, got ${err.constructor?.name}: ${err.message}`);
      }
      assertEqual(err.statusCode, 400, 'err.statusCode');
      assertEqual(err.errorCode, 'invalid_param', 'err.errorCode');
      assertEqual(err.param, 'fast_period', 'err.param');
      assertEqual(
        err.message,
        'API Error (400): invalid query parameters: fast_period (unsupported parameter for rsi)',
        'err.message'
      );
    }
  });

  await test('pools.getIndicator: a 404 for an unknown pool throws PoolNotFoundError', async () => {
    // Captured from api.dexpaprika.com on 2026-10-13 for an unknown pool address.
    const body = { error: 'not_found', message: 'pool not found', resource: 'pool' };
    const client = new FailingClient(404, body);
    const pools = new PoolsAPI(client);
    try {
      await pools.getIndicator('ethereum', '0x0000000000000000000000000000000000000000', { indicator: 'rsi' });
      throw new Error('expected getIndicator to throw');
    } catch (err: any) {
      if (!(err instanceof PoolNotFoundError)) {
        throw new Error(`expected a PoolNotFoundError, got ${err.constructor?.name}: ${err.message}`);
      }
    }
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log(`${'='.repeat(50)}`);

  if (failed > 0) process.exit(1);
}

main();
