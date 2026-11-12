import { MEDIA } from '../../../shared/const/app.const.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';

/** A memorable name for this device ('Phone' or 'Computer' by screen size). It cannot yet tell several devices of the same kind apart: the real version lets the user name it. */
export function deviceLabel(): string {
  return window.matchMedia(MEDIA.WIDE).matches ? C.security.deviceNames.computer : C.security.deviceNames.phone;
}
