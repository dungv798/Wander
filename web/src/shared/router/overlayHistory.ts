const OVERLAY_KEY = 'wanderOverlayRoute';

/** Nhận diện mục lịch sử của tờ phủ trên đúng URL, giữ Back của màn nền độc lập. */
export function isOverlayEntry(state: unknown, hash: string): boolean {
  return !!state && typeof state === 'object' && OVERLAY_KEY in state && state[OVERLAY_KEY] === hash;
}

/** Gỡ dấu tờ phủ nhưng giữ state của màn nền và độ sâu điều hướng. */
export function withoutOverlay(state: unknown): Record<string, unknown> {
  const result: Record<string, unknown> = { ...(state && typeof state === 'object' ? state : {}) };
  delete result[OVERLAY_KEY];
  return result;
}

/** Thêm mục cho tờ phủ mà không tăng độ sâu của tuyến hoặc thay state sẵn có. */
export function withOverlay(state: unknown, hash: string): Record<string, unknown> {
  return { ...withoutOverlay(state), [OVERLAY_KEY]: hash };
}
