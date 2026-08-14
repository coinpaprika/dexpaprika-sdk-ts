/**
 * SDK version, reported in the User-Agent.
 *
 * Kept here rather than imported from package.json because `rootDir` is `./src`,
 * so reaching outside it breaks the build. `tests/test-api-key.ts` asserts this
 * matches package.json, which is the guard that was missing: the User-Agent was
 * pinned to 0.1.0 while the package shipped 1.9.0.
 */
export const VERSION = '1.10.0';

/** Environment variable consulted when no key is passed to the constructor. */
export const API_KEY_ENV_VAR = 'DEXPAPRIKA_API_KEY';
