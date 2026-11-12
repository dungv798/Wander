import type { SegmentFeature } from './geoRouteLayer.ts';

/** Clamps a finite progress, even for a negative timestamp; reduced motion returns the full route. */
export function drawProgress(elapsed: number, duration: number, reducedMotion = false): number {
  return reducedMotion || duration <= 0 ? 1 : Math.max(0, Math.min(1, elapsed / duration));
}

/** Draws each segment in turn in order, interpolating the end point instead of turning the whole route on at once. */
export function drawRouteFeatures(features: readonly SegmentFeature[], progress: number): SegmentFeature[] {
  const position = Math.max(0, Math.min(1, progress)) * features.length;
  return features.flatMap((feature, order) => {
    const local = Math.max(0, Math.min(1, position - order));
    if (!local) return [];
    if (local === 1) return [feature];
    const coordinates = feature.geometry.coordinates;
    const index = local * (coordinates.length - 1);
    const whole = Math.floor(index);
    const a = coordinates[whole]!, b = coordinates[Math.min(whole + 1, coordinates.length - 1)]!;
    const end = [a[0]! + (b[0]! - a[0]!) * (index - whole), a[1]! + (b[1]! - a[1]!) * (index - whole)];
    return [{ ...feature, geometry: { ...feature.geometry, coordinates: [...coordinates.slice(0, whole + 1), end] } }];
  });
}
