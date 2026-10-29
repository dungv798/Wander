/** Kích thước PNG và nhịp chữ đủ chỗ cho dấu tiếng Việt; phân đoạn để tránh giới hạn canvas. */
export const PNG = {
  width: 1080, height: 1920, margin: 72, coverHeight: 380, gap: 24,
  titleSize: 58, headingSize: 38, bodySize: 32, smallSize: 26,
  titleLine: 82, headingLine: 58, bodyLine: 48, smallLine: 40,
  maxNameLines: 4, maxFileName: 100, imageTimeoutMs: 8000,
  edgeCount: 2, centerDivisor: 2, timeParts: 2,
  mime: 'image/png', extension: '.png',
} as const;
