/** Thử nghiệm riêng cho PO; không thay bộ nhận diện mặc định. */
export const LOOK = {
  PARAM: 'look',
  STORAGE: 'wander.web.look.v1',
  OFF: 'off',
  VALUES: ['nunito', 'jakarta', 'lexend'],
} as const;
export type TrialLook = (typeof LOOK.VALUES)[number];
