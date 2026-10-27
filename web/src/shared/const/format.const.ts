/** Hằng số định dạng hiển thị dùng chung với prototype (docs/ux/prototype/format.js). */
export const FORMAT = {
  /** Khoảng trắng KHÔNG ngắt trước ký hiệu đồng (D17). */
  NBSP: ' ',
  CURRENCY_SYMBOL: '₫',
  THOUSAND_SEPARATOR: '.',
  /** Một nghìn đồng = 1000 đồng (đơn vị nhập liệu là nghìn đồng). */
  VND_PER_THOUSAND: 1000,
  WEEKDAYS: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  MS_PER_DAY: 86_400_000,
} as const;
