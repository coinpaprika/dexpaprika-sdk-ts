import { IndicatorOptions } from '../models/options';

/**
 * Build the query for the pool/token indicator endpoints from
 * {@link IndicatorOptions}, sending only the fields the caller actually set.
 *
 * The API refuses a parameter that belongs to a different indicator (e.g.
 * `fast_period` with `indicator: 'rsi'` answers HTTP 400), and fills in its
 * own defaults for anything left out. So the SDK must never invent a default
 * here, including `interval`: the server's own default differs by plan and
 * caller (keyless pool indicators default to `1h`, everything else to `24h`).
 */
export function buildIndicatorParams(options: IndicatorOptions): Record<string, any> {
  const params: Record<string, any> = { indicator: options.indicator };

  if (options.interval !== undefined) params.interval = options.interval;
  if (options.limit !== undefined) params.limit = options.limit;
  if (options.start !== undefined) params.start = options.start;
  if (options.end !== undefined) params.end = options.end;
  if (options.cursor !== undefined) params.cursor = options.cursor;
  if (options.period !== undefined) params.period = options.period;
  if (options.fast_period !== undefined) params.fast_period = options.fast_period;
  if (options.slow_period !== undefined) params.slow_period = options.slow_period;
  if (options.signal_period !== undefined) params.signal_period = options.signal_period;
  if (options.std_dev !== undefined) params.std_dev = options.std_dev;

  return params;
}
