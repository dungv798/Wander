/** Display-format constants shared with the prototype (docs/ux/prototype/format.js). */
export const FORMAT = {
  /** A NON-breaking space before the dong sign (D17). */
  NBSP: ' ',
  CURRENCY_SYMBOL: '₫',
  THOUSAND_SEPARATOR: '.',
  /** One thousand dong = 1000 dong (the input unit is thousand dong). */
  VND_PER_THOUSAND: 1000,
  WEEKDAYS: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  MS_PER_DAY: 86_400_000,
} as const;
