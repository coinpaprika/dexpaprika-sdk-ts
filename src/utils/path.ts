import { DexPaprikaError } from './errors';

// Separators and anything a URL parser or the server could decode into one:
// slash, backslash, query and fragment marks, percent escapes, whitespace and
// control characters. Ids the API returns do not contain these; Sui and Aptos
// ids with "::" and TON addresses with "-" and "_" are unaffected.
const UNSAFE = /[/\\?#%\s\x00-\x1f\x7f]/;

/**
 * Return `value` unchanged if it is safe to place in the request path as one
 * segment, else throw. A value such as `../../usage` or `x?limit=1000` would
 * otherwise send the request, and the client's API key, to a different path or
 * query than the method was written for.
 */
export function pathSegment(name: string, value: string): string {
  if (typeof value !== 'string' || value === '' || value === '.' || value === '..' || UNSAFE.test(value)) {
    throw new DexPaprikaError(`${name} must be a single id or address, got ${JSON.stringify(String(value).slice(0, 100))}`);
  }
  return value;
}
