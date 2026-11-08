/** Nhịp chuyển ảnh và phản hồi chạm, tính bằng mili giây. */
export const MOTION = { DURATION_MS: 240, REVEAL_MS: 160, EASING: 'cubic-bezier(.2,.8,.2,1)', NAME: 'place-photo', REDUCED_QUERY: '(prefers-reduced-motion: reduce)', MAP_PIN_PX: 44, DECODE_ERROR: 'IMAGE_DECODE_FAILED' } as const;
export const IMAGE_SIZE = { WIDTH: 1280, HEIGHT: 720 } as const;
