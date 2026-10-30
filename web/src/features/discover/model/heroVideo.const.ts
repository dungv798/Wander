/** Tắt mặc định (PO 30/10: clip chưa đạt 'wow'); bật thử bằng ?hero=video. Bật hẳn bằng cách đặt enabled: true khi clip mới đạt. */
export const HERO_VIDEO = {
  enabled: false,
  forceParam: 'hero',
  forceValue: 'video',
  minWidth: 360,
  widthQuery: '(min-width: 360px)',
  motionQuery: '(prefers-reduced-motion: reduce)',
  src: '/video/journey.webm',
  poster: '/video/journey-poster.jpg',
  pause: 'Tạm dừng video nền',
  play: 'Phát video nền',
  pauseSymbol: 'Ⅱ',
  playSymbol: '▷',
} as const;
