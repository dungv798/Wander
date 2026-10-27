import { fill } from '../../../shared/const/copy.vi.ts';
import { IDENTITY } from './identity.const.ts';
import { IDENTITY_COPY as C } from './identity.copy.ts';

/** Kết quả kiểm tên thiết bị. */
export type DeviceNameResult = { readonly ok: true; readonly value: string } | { readonly ok: false; readonly error: string };

/** Kiểm tên thiết bị người dùng đặt: bỏ khoảng trắng hai đầu, không rỗng, tối đa `MAX_DEVICE_NAME` ký tự. */
export function parseDeviceName(text: string): DeviceNameResult {
  const value = text.trim();
  if (!value) return { ok: false, error: C.settings.nameEmpty };
  if (value.length > IDENTITY.MAX_DEVICE_NAME) return { ok: false, error: fill(C.settings.nameLong, { max: IDENTITY.MAX_DEVICE_NAME }) };
  return { ok: true, value };
}
