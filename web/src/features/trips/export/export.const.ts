/** The PNG size and the text rhythm leave room for Vietnamese accents; segmented to avoid the canvas limit. */
export const PNG = {
  width: 1080, maxHeight: 1920, minHeight: 1350, margin: 72, coverHeight: 380, gap: 24, tightGap: 6,
  titleSize: 58, headingSize: 38, bodySize: 32, smallSize: 26,
  titleLine: 82, headingLine: 58, bodyLine: 48, smallLine: 40,
  maxNameLines: 4, maxFileName: 100, imageTimeoutMs: 8000,
  edgeCount: 2, centerDivisor: 2, timeParts: 2,
  mime: 'image/png', extension: '.png',
} as const;
