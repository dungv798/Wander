import { fill } from '../../../shared/const/copy.vi.ts';
import { HALF } from '../../../shared/const/math.const.ts';
import type { Run } from '../../../shared/lib/RunScope.ts';
import type { PlaceView } from '../../discover/index.ts';
import { MEMBERS, PROPOSAL, SHARE_TIMING } from './onboarding.const.ts';
import { ONBOARD_COPY as T } from './onboarding.copy.ts';
import type { ShareAction } from './shareState.ts';
import type { TouchMark } from './swipeDemo.ts';

/** Những nút mà câu chuyện "chạm" vào. */
export type ShareTarget = 'share' | 'copy' | 'accept';

/** Cầu nối từ kịch bản chia sẻ sang giao diện (kịch bản không biết gì về React). */
export interface ShareApi {
  readonly dispatch: (action: ShareAction) => void;
  readonly toast: (text: string) => void;
  readonly touch: (mark: TouchMark | null) => void;
  /** Tâm của nút theo tọa độ sân khấu; null nếu chưa có trên màn hình. */
  readonly center: (target: ShareTarget) => { x: number; y: number } | null;
}

/** Thông báo sau khi chủ chuyến chấp nhận: địa điểm và ngày được thêm vào. */
export function acceptedText(place: PlaceView): string {
  return fill(T.share.accepted, { place: place.name, day: fill(T.trip.day, { n: PROPOSAL.dayIndex + 1 }) });
}

/** Dấu chạm trượt tới nút, nhấn, thực hiện hành động rồi biến mất (người xem thấy rõ "ai bấm gì"). */
export async function tapOn(run: Run, api: ShareApi, target: ShareTarget, act: () => void): Promise<void> {
  const c = api.center(target);
  if (c) api.touch({ ...c, press: false });
  await run.wait(SHARE_TIMING.TAP_MOVE_MS);
  if (c) api.touch({ ...c, press: true });
  await run.wait(SHARE_TIMING.TAP_PRESS_MS);
  act();
  api.touch(null);
  await run.wait(SHARE_TIMING.TAP_AFTER_MS);
}

/** Hai người bạn lần lượt vào bằng liên kết và đặt tên hiển thị. */
export async function joinFriends(run: Run, api: ShareApi): Promise<void> {
  const friends = MEMBERS.filter((m) => m.id !== 'me');
  for (const [i, f] of friends.entries()) {
    await run.wait(i === 0 ? SHARE_TIMING.JOIN_FIRST_MS : SHARE_TIMING.JOIN_NEXT_MS);
    api.dispatch({ type: 'join', member: f.id });
    api.toast(fill(T.share.joined, { name: f.name }));
  }
  await run.wait(SHARE_TIMING.JOIN_AFTER_MS);
}

/** Kịch bản cảnh chia sẻ: chia sẻ liên kết → sao chép → Mai/Bảo tham gia → Mai đề xuất → chủ chuyến chấp nhận. `ready` chờ bản đồ (hoặc sơ đồ thay thế). */
export async function playShare(run: Run, api: ShareApi, ready: Promise<void>, place: PlaceView): Promise<void> {
  await run.wait(SHARE_TIMING.START_MS);
  await run.until(ready);
  await tapOn(run, api, 'share', () => api.dispatch({ type: 'share' }));
  await run.wait(SHARE_TIMING.AFTER_SHARE_MS);
  await tapOn(run, api, 'copy', () => {
    api.dispatch({ type: 'copy' });
    api.toast(T.share.toastCopied);
  });
  await joinFriends(run, api);
  await run.wait(SHARE_TIMING.BEFORE_PROPOSAL_MS);
  api.dispatch({ type: 'propose' });
  await run.wait(SHARE_TIMING.PROPOSAL_READ_MS);
  await tapOn(run, api, 'accept', () => {
    api.dispatch({ type: 'accept', place });
    api.toast(acceptedText(place));
  });
  await run.wait(SHARE_TIMING.END_MS);
}

/** Điểm giữa của một hình chữ nhật theo gốc `origin` (dùng để đổi tọa độ màn hình sang tọa độ sân khấu). */
export function centerIn(box: DOMRect, origin: DOMRect): { x: number; y: number } {
  return { x: box.left - origin.left + box.width / HALF, y: box.top - origin.top + box.height / HALF };
}
