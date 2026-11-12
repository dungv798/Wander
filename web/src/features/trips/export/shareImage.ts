import type { PngFile } from './Export.types.ts';
import { PNG } from './export.const.ts';

/** The part of `navigator` that sharing an image needs (Web Share level 2); split out so it can be tested without a browser. */
export interface ShareNavigator {
  readonly share?: (data: ShareData) => Promise<void>;
  readonly canShare?: (data: ShareData) => boolean;
}

/** The result of opening the share sheet: sent, the user closed the sheet (not an error), or it could not be opened/sent. */
export type ShareOutcome = 'shared' | 'cancelled' | 'failed';

/** The current `navigator` of the running environment; undefined when there is none (server, tests). */
function currentNavigator(): ShareNavigator | undefined {
  return typeof navigator === 'undefined' ? undefined : navigator;
}

/** Wraps the blob of the drawn image into a `File` to give to the share sheet; made ready when the image is done so that when the button is pressed `share` is called right inside the user gesture. */
export function pngToFile(file: PngFile): File {
  return new File([file.blob], file.filename, { type: PNG.mime });
}

/** Whether the system can share these files through the share sheet (iPhone Safari, Android Chrome can; a computer usually cannot). An error from `canShare` counts as no. */
export function canShareFiles(files: readonly File[], nav: ShareNavigator | undefined = currentNavigator()): boolean {
  if (!nav || typeof nav.share !== 'function' || typeof nav.canShare !== 'function') return false;
  try {
    return nav.canShare({ files: [...files] });
  } catch {
    return false;
  }
}

/** Opens the system share sheet for an image. It must be called directly in the button-press handler; closing the sheet is not an error. */
export async function shareFile(file: File, title: string, nav: ShareNavigator | undefined = currentNavigator()): Promise<ShareOutcome> {
  if (!nav || typeof nav.share !== 'function') return 'failed';
  try {
    await nav.share({ files: [file], title });
    return 'shared';
  } catch (error) {
    return error instanceof DOMException && error.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}
