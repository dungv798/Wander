import { MEDIA } from '../../../shared/const/app.const.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';

/** Tên gợi nhớ cho máy này ("Điện thoại" hoặc "Máy tính" theo cỡ màn). Chưa phân biệt được nhiều máy cùng loại: bản thật cho người dùng tự đặt tên. */
export function deviceLabel(): string {
  return window.matchMedia(MEDIA.WIDE).matches ? C.security.deviceNames.computer : C.security.deviceNames.phone;
}
