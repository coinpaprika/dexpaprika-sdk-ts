/**
 * Optional API key, and the header rules that go with it.
 *
 * Assertions run against the axios instance the client actually built, so they
 * describe what leaves the process rather than what was stored.
 *
 * Run: npm run test:unit
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DexPaprikaClient, resolveApiKey } from '../src/client';
import { VERSION } from '../src/version';

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

/** Headers the client would send, read off the axios instance it built. */
function headersFor(config: ConstructorParameters<typeof DexPaprikaClient>[2] = {}): Record<string, any> {
  const client = new DexPaprikaClient('https://api.dexpaprika.com', {}, config);
  return ((client as any).httpClient.defaults.headers ?? {}) as Record<string, any>;
}

// ── The Bearer rule ────────────────────────────────────────────────────────
// Authorization: Bearer api_... returns 401 because the API checksums the raw
// header value. The mistake has come back three times in four months.

test('the key is the entire Authorization value', () => {
  assert.equal(headersFor({ apiKey: 'api_abc123' }).Authorization, 'api_abc123');
});

test('no scheme word is ever prepended', () => {
  const value = String(headersFor({ apiKey: 'api_abc123' }).Authorization);
  for (const scheme of ['Bearer', 'Token', 'ApiKey', 'Basic', 'Key']) {
    assert.ok(!value.toLowerCase().startsWith(scheme.toLowerCase()), `starts with ${scheme}`);
  }
});

// ── Keyless stays the default ──────────────────────────────────────────────

test('no key sends no Authorization header', () => {
  assert.equal('Authorization' in headersFor(), false);
});

test('a blank key is keyless, not an empty header', () => {
  for (const apiKey of ['', '   ', '\t']) {
    assert.equal('Authorization' in headersFor({ apiKey }), false, `blank value ${JSON.stringify(apiKey)}`);
  }
});

// ── Precedence and resolution ──────────────────────────────────────────────

test('the environment variable is used when no key is passed', () => {
  assert.equal(resolveApiKey(undefined, { DEXPAPRIKA_API_KEY: 'api_from_env' }), 'api_from_env');
});

test('an explicit key beats the environment', () => {
  assert.equal(resolveApiKey('api_explicit', { DEXPAPRIKA_API_KEY: 'api_from_env' }), 'api_explicit');
});

test('surrounding whitespace is trimmed', () => {
  assert.equal(resolveApiKey('  api_padded\n'), 'api_padded');
});

test('a key with control characters is dropped, not mangled', () => {
  for (const value of ['api_a\r\nX-Evil: 1', 'api_a\nb', 'api_a\0b']) {
    assert.equal(resolveApiKey(value), undefined, `expected ${JSON.stringify(value)} to be rejected`);
  }
});

test('reading the environment does not throw where process is absent', () => {
  assert.equal(resolveApiKey(undefined, {}), undefined);
});

// ── Identification ─────────────────────────────────────────────────────────

test('the User-Agent carries the real package version', () => {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
  // The guard that was missing: the User-Agent said 0.1.0 while the package
  // shipped 1.9.0, so every request misreported which SDK sent it.
  assert.equal(VERSION, pkg.version, 'src/version.ts drifted from package.json');
  assert.equal(headersFor()['User-Agent'], `DexPaprika-SDK-JavaScript/${pkg.version}`);
});

test('the User-Agent is not the literal that went stale', () => {
  assert.notEqual(headersFor()['User-Agent'], 'DexPaprika-SDK-JavaScript/0.1.0');
});

// ── Host rules ─────────────────────────────────────────────────────────────

test('a key alone never changes the host', () => {
  // Free keys are served from the default host; only Pro moves, and a free key
  // sent to the Pro host returns 403.
  const client = new DexPaprikaClient(undefined as any, {}, { apiKey: 'api_abc123' });
  assert.equal((client as any).baseUrl, 'https://api.dexpaprika.com');
});

test('Pro customers set the host explicitly', () => {
  const client = new DexPaprikaClient('https://api-pro.dexpaprika.com', {}, { apiKey: 'api_pro' });
  assert.equal((client as any).baseUrl, 'https://api-pro.dexpaprika.com');
});

if (failures > 0) {
  console.error(`\n${failures} failing`);
  process.exit(1);
}
console.log('\nall api-key tests passed');
