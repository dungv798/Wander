/**
 * The read port of the sample itineraries (the D of SOLID): the UI does not know whether the data comes from a fake file or the real API.
 * Returns RAW JSON (untrusted); `toTemplateViews` checks it and joins it with the place catalog.
 */
export interface TemplateRepository {
  /** The sample itineraries of a destination; if there is none it returns an empty object (not an error). It does not accept a cancel signal because the request is shared. */
  templates(destId: string): Promise<unknown>;
}
