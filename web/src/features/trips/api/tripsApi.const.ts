/** Đường dẫn API chuyến đi (khớp `PlanningApiConstants` của backend). */
export const TRIPS_API = {
  TRIPS: '/api/trips',
  ITEMS: '/items',
  RESTORE: '/restore',
  PERMANENT: '/permanent',
  DONE: '/done',
  DAYS: '/days',
  REORDER: '/reorder',
  SCHEDULE: '/schedule',
  TRASH: '/trash',
  DELETED: '/deleted',
  KEY_TRIPS: 'trips',
  KEY_DELETED_AT: 'deletedAt',
  KEY_TRIP: 'trip',
  KEY_ITEM: 'item',
  KEY_ITEMS: 'items',
} as const;
