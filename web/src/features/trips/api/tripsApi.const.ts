import type { ApiMember } from '../../../shared/api/contract.ts';

/** Trip API paths (match the backend `PlanningApiConstants`) and the response members the client reads, checked against the generated contract. */
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
} as const satisfies {
  readonly KEY_TRIPS: ApiMember<'TripsResponse'> & ApiMember<'DeletedTripsResponse'>;
  readonly KEY_DELETED_AT: ApiMember<'DeletedTrip'>;
  readonly KEY_TRIP: ApiMember<'TripResponse'>;
  readonly KEY_ITEM: ApiMember<'ItemResponse'>;
  readonly KEY_ITEMS: ApiMember<'ItemsResponse'>;
} & Record<string, string>;
