/**
 * isKeyRequiredForPaging(): does an error mean paging a search endpoint
 * needs an API key?
 *
 * Run: npm run test:paging-key-error
 */
import assert from 'node:assert/strict';
import { ApiError, isKeyRequiredForPaging } from '../src/utils/errors';

let failures = 0;
function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`  FAIL ${name}\n       ${(error as Error).message}`);
  }
}

// ── The specific case: plan_required on the cursor param ───────────────────

test('plan_required on cursor means paging needs a key', () => {
  const err = new ApiError('Search results beyond the first page require an API key', 403, {
    errorCode: 'plan_required',
    requiredTier: 'free',
    param: 'cursor',
  });
  assert.equal(isKeyRequiredForPaging(err), true);
});

test('requiredTier does not have to be "free" to match', () => {
  const err = new ApiError('plan required', 403, {
    errorCode: 'plan_required',
    requiredTier: 'dev',
    param: 'cursor',
  });
  assert.equal(isKeyRequiredForPaging(err), true);
});

// ── Near misses: same error family, wrong detail ────────────────────────────

test('plan_required on a different param is not a paging error', () => {
  const err = new ApiError('Token OHLCV requires a plan', 403, {
    errorCode: 'plan_required',
    requiredTier: 'dev',
    param: 'interval',
  });
  assert.equal(isKeyRequiredForPaging(err), false);
});

test('a different errorCode on the cursor param is not a paging error', () => {
  const err = new ApiError('bad cursor', 400, {
    errorCode: 'invalid_param',
    param: 'cursor',
  });
  assert.equal(isKeyRequiredForPaging(err), false);
});

test('an ApiError with no details at all is not a paging error', () => {
  const err = new ApiError('generic failure', 500);
  assert.equal(isKeyRequiredForPaging(err), false);
});

// ── Any thrown value is safe to pass, not just ApiError ────────────────────

test('a plain Error is not a paging error', () => {
  assert.equal(isKeyRequiredForPaging(new Error('plan_required')), false);
});

test('a plain object shaped like the envelope is not a paging error', () => {
  assert.equal(isKeyRequiredForPaging({ error: 'plan_required', param: 'cursor' }), false);
});

test('undefined, null and strings are all safe', () => {
  assert.equal(isKeyRequiredForPaging(undefined), false);
  assert.equal(isKeyRequiredForPaging(null), false);
  assert.equal(isKeyRequiredForPaging('plan_required'), false);
});

if (failures > 0) {
  console.error(`\n${failures} failing`);
  process.exit(1);
}
console.log('\nall paging-key-error tests passed');
