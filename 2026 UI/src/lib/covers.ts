/**
 * Shared semantic labelling for covers (curtain / roller shutter).
 * Home Assistant cover position: 100 = fully open, 0 = fully closed.
 */
export function opennessLabel(pos: number): string {
  if (pos >= 99) return 'Open';
  if (pos <= 1) return 'Closed';
  return `${pos}% open`;
}
