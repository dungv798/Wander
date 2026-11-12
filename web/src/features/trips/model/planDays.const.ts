/** The thresholds of suggested day scheduling. All are ASSUMPTIONS for suggesting, not facts about the trip. */
export const PLAN_DAYS = {
  /** An arc longer than a day or of unknown duration must have its route fixed before suggesting. */
  fullDayMin: 480,
  /** The maximum total suggested sightseeing duration in one day (minutes); a longer item takes a whole day by itself. */
  dayCapacityMin: 360,
  /** The assumed total budget for visiting + travel: 8 hours; not a confirmed start/end time window. */
  dayTotalMin: 480,
  /** Two places farther apart (as the crow flies, km) than this threshold count as two different clusters, not packed into one day. */
  sameAreaKm: 20,
  /** An internal weight when a place lacks a duration: only for packing days, NOT shown as a real duration. */
  unknownVisitMin: 90,
  /** An internal assumption when the duration is missing, NOT shown as a verified number of minutes. */
  unknownByKind: { sightseeing: 90, tour: 90, food: 60, rest: 30, task: 15, shopping: 60, transport: 60, lodging: 30, car_rental: 30 },
} as const;
