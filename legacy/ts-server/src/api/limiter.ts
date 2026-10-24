/** Bộ đếm cửa sổ cố định theo khóa (địa chỉ), lưu trong bộ nhớ. Chống lạm dụng ở mức cơ bản (Q16 câu 6, MĐ-8). */
export interface Limiter {
  /** Ghi nhận một lần; trả về false nếu đã vượt giới hạn trong cửa sổ. */
  hit(key: string): boolean;
  /** Số khóa đang theo dõi (dùng cho kiểm thử). */
  size(): number;
}

/** Khi số khóa vượt ngưỡng này, các khóa đã hết cửa sổ được dọn để bộ nhớ không tăng vô hạn. */
const PRUNE_AT = 10_000;

export function createLimiter(max: number, windowMs: number): Limiter {
  const hits = new Map<string, { start: number; count: number }>();
  return {
    hit(key) {
      const t = Date.now();
      if (hits.size >= PRUNE_AT) {
        for (const [k, v] of hits) if (t - v.start >= windowMs) hits.delete(k);
      }
      const h = hits.get(key);
      if (!h || t - h.start >= windowMs) {
        hits.set(key, { start: t, count: 1 });
        return true;
      }
      h.count++;
      return h.count <= max;
    },
    size: () => hits.size,
  };
}
