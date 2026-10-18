/**
 * Water volumes in litres, whatever display unit the user picked.
 *
 * The usage sensors carry the water device class, so Home Assistant reports
 * their state in the unit chosen in the entity settings. Anything that does
 * its own math converts to litres first.
 */

/** Litres in one unit, for every volume unit Home Assistant converts to. */
const LITERS_PER_UNIT: Record<string, number> = {
  mL: 0.001,
  L: 1,
  'm³': 1000,
  'fl. oz.': 0.0295735295625,
  gal: 3.785411784,
  'ft³': 28.316846592,
  CCF: 2831.6846592,
  MCF: 28316.846592,
};

/** Convert a volume to litres; a missing or unknown unit counts as `fallbackUnit`. */
export function volumeToLiters(
  value: number,
  unit: string | null | undefined,
  fallbackUnit = 'L'
): number {
  const factor = LITERS_PER_UNIT[unit ?? ''] ?? LITERS_PER_UNIT[fallbackUnit] ?? 1;
  return value * factor;
}
