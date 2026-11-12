/** The DR-031 contract, matching the backend's CoverConstants. */
export const COVER = { maxPhotos: 12, thumbnail: 96, maxRefLength: 120, slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, photoPath: /^\/catalog\/photos\/([a-z0-9]+(?:-[a-z0-9]+)*)\.(?:jpe?g|webp|png)$/ } as const;

/** Six fixed choices, only referencing tokens of the existing palette. */
export const COVER_GRADIENTS = [
  { ref: 'cover-1', label: 'Nắng sớm' },
  { ref: 'cover-2', label: 'Trời xanh' },
  { ref: 'cover-3', label: 'Chiều ấm' },
  { ref: 'cover-4', label: 'Chân trời' },
  { ref: 'cover-5', label: 'Sương nhẹ' },
  { ref: 'cover-6', label: 'Đêm trong' },
] as const;
