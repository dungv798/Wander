import { fill } from '../../../shared/const/copy.vi.ts';
import { IDENTITY } from './identity.const.ts';
import { IDENTITY_COPY as C } from './identity.copy.ts';

/** The result of checking a device name. */
export type DeviceNameResult = { readonly ok: true; readonly value: string } | { readonly ok: false; readonly error: string };

/** Checks the device name the user set: trims both ends, not empty, at most `MAX_DEVICE_NAME` characters. */
export function parseDeviceName(text: string): DeviceNameResult {
  const value = text.trim();
  if (!value) return { ok: false, error: C.settings.nameEmpty };
  if (value.length > IDENTITY.MAX_DEVICE_NAME) return { ok: false, error: fill(C.settings.nameLong, { max: IDENTITY.MAX_DEVICE_NAME }) };
  return { ok: true, value };
}
