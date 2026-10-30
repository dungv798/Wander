import type { SegmentFeature } from './geoRouteLayer.ts';

/** Kẹp tiến độ hữu hạn, kể cả timestamp âm; giảm chuyển động trả tuyến đầy đủ. */
export function drawProgress(elapsed: number, duration: number, reducedMotion = false): number {
  return reducedMotion || duration <= 0 ? 1 : Math.max(0, Math.min(1, elapsed / duration));
}

/** Vẽ lần lượt từng đoạn theo thứ tự, nội suy điểm cuối thay vì bật cả tuyến cùng lúc. */
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
