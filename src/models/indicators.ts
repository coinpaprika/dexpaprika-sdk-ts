/**
 * Technical indicators for pools and tokens, computed server-side from OHLCV
 * candles.
 */

/**
 * Which indicator to compute.
 */
export type IndicatorType = 'rsi' | 'ema' | 'macd' | 'bbands' | 'vwap';

/**
 * Candle interval for an indicator request. `1d` is the same as `24h`.
 */
export type IndicatorInterval =
  | '1m'
  | '5m'
  | '10m'
  | '15m'
  | '30m'
  | '1h'
  | '6h'
  | '12h'
  | '24h'
  | '1d';

/**
 * The parameters the API actually used to compute the series, defaults
 * included. Which keys are present depends on the indicator: rsi, ema and
 * vwap report `period`; macd reports `fast_period`, `slow_period` and
 * `signal_period`; bbands reports `period` and `std_dev`.
 */
export interface IndicatorParameters {
  period?: number;
  fast_period?: number;
  slow_period?: number;
  signal_period?: number;
  std_dev?: number;
}

/**
 * One point of an indicator's time series. `timestamp` (the candle's open
 * time, RFC3339) is always present; which other fields are set depends on the
 * indicator:
 * - rsi, ema, vwap: `value`
 * - macd: `macd`, `signal`, `histogram`
 * - bbands: `upper`, `middle`, `lower`
 *
 * The index signature covers any further numeric field the API adds for a
 * future indicator without requiring an SDK update to read it.
 */
export interface IndicatorDataPoint {
  timestamp: string;
  value?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  upper?: number;
  middle?: number;
  lower?: number;
  [key: string]: string | number | undefined;
}

/**
 * Response of the pool indicator endpoint
 * (`GET /networks/{network}/pools/{pool_address}/indicators`).
 */
export interface PoolIndicatorResponse {
  network: string;
  pool_address: string;
  indicator: IndicatorType;
  interval: string;
  parameters: IndicatorParameters;
  /** Oldest first, one item per completed candle. */
  data: IndicatorDataPoint[];
  has_next_page: boolean;
  /** Pass as `cursor` to fetch the next page. Empty on the last page. */
  next_cursor: string;
}

/**
 * Response of the token indicator endpoint
 * (`GET /networks/{network}/tokens/{token_address}/indicators`). Same shape
 * as {@link PoolIndicatorResponse}, with `token_address` in place of
 * `pool_address`.
 */
export interface TokenIndicatorResponse {
  network: string;
  token_address: string;
  indicator: IndicatorType;
  interval: string;
  parameters: IndicatorParameters;
  /** Oldest first, one item per completed candle. */
  data: IndicatorDataPoint[];
  has_next_page: boolean;
  /** Pass as `cursor` to fetch the next page. Empty on the last page. */
  next_cursor: string;
}
