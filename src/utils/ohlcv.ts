import { OHLCVRecord } from '../models/pools';

/**
 * The API leaves `volume` out of a candle whose USD volume rounds down to 0
 * (coinpaprika/dexpaprika-go#2430), so a record typed `volume: number` could
 * arrive with `volume` undefined. Fill it with 0, the value it stands for.
 */
export function withVolume(rows: OHLCVRecord[]): OHLCVRecord[] {
  if (!Array.isArray(rows)) return rows;
  return rows.map((row) => (row.volume === undefined || row.volume === null ? { ...row, volume: 0 } : row));
}
