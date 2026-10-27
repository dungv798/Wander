import { IDENTITY } from './identity.const.ts';
import type { Device, EventKind, PairingRequest, ServerIdentity, ServerState } from './identity.types.ts';
import { PairingCode } from '../../../shared/domain/PairingCode.ts';
import { RecoveryCode, browserRandom } from '../../../shared/domain/RecoveryCode.ts';
import type { RandomSource } from '../../../shared/domain/RecoveryCode.ts';

/** Trạng thái ban đầu của máy chủ giả: chưa có danh tính. */
export const INITIAL_SERVER: ServerState = { identity: null, pairing: null, requests: [] };

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;
const HASH_ROUNDS = 4;
const HEX_RADIX = 16;
const HEX_WIDTH = 8;
const HASH_PREFIX = 'h1:';
const BYTE_RANGE = 256;

/**
 * Băm giả của bản thử (FNV-1a, KHÔNG phải mật mã): chỉ để máy chủ giả không giữ mã đọc được. Máy chủ thật dùng HMAC-SHA-256 có khóa
 * (DR-018 B3, Secrets Manager); đừng dùng hàm này ngoài bản thử.
 */
export function fakeHash(text: string): string {
  return (
    HASH_PREFIX +
    Array.from({ length: HASH_ROUNDS }, (_, seed) => {
      let h = (FNV_OFFSET ^ seed) >>> 0;
      for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), FNV_PRIME) >>> 0;
      return h.toString(HEX_RADIX).padStart(HEX_WIDTH, '0');
    }).join('')
  );
}

/** Thêm một sự kiện vào đầu danh sách (giữ tối đa `MAX_EVENTS`), có thể đánh dấu "chưa xem". */
function withEvent(id: ServerIdentity, kind: EventKind, now: number, device?: string, unseen = false): ServerIdentity {
  const events = [{ at: now, kind, ...(device ? { device } : {}) }, ...id.events].slice(0, IDENTITY.MAX_EVENTS);
  return { ...id, events, unseen: id.unseen || unseen };
}

/** Thay danh tính bằng kết quả của `change`; chưa có danh tính thì giữ nguyên. */
function mapIdentity(s: ServerState, change: (id: ServerIdentity) => ServerIdentity): ServerState {
  return s.identity ? { ...s, identity: change(s.identity) } : s;
}

/** Một số ngẫu nhiên trong [min, max] (lệch nhẹ do lấy dư của một byte; đủ cho số khớp). */
function randomIn(min: number, max: number, random: RandomSource): number {
  const bytes = new Uint8Array(1);
  random.fill(bytes);
  return min + ((bytes[0] ?? 0) % Math.min(BYTE_RANGE, max - min + 1));
}

/** Một số khớp ngẫu nhiên 2 chữ số (hiện ở máy xin duyệt). */
export function newMatchNumber(random: RandomSource = browserRandom): number {
  return randomIn(IDENTITY.MATCH_MIN, IDENTITY.MATCH_MAX, random);
}

/** Tạo danh tính ẩn danh với thiết bị đầu tiên (chưa có mã khôi phục). */
export function createIdentity(s: ServerState, deviceId: string, deviceName: string, now: number): ServerState {
  const device: Device = { id: deviceId, name: deviceName, at: now };
  return { ...s, identity: withEvent({ createdAt: now, codeHash: null, devices: [device], events: [], unseen: false }, 'created', now, deviceName) };
}

/** Đã có mã khôi phục hiệu lực chưa. */
export function hasCode(s: ServerState): boolean {
  return Boolean(s.identity?.codeHash);
}

/** Mã người dùng nhập có khớp mã hiệu lực không (so băm; sai định dạng thì không khớp). */
export function checkCode(s: ServerState, input: string): boolean {
  const code = RecoveryCode.parse(input);
  return Boolean(code && s.identity?.codeHash && fakeHash(code.normalized) === s.identity.codeHash);
}

/** Chốt mã mới có hiệu lực (CHỈ gọi sau khi người dùng nhập lại đúng; mã cũ mất hiệu lực cùng lúc: một lần commit, QĐ-6). */
export function commitCode(s: ServerState, code: RecoveryCode, now: number): ServerState {
  return mapIdentity(s, (id) => withEvent({ ...id, codeHash: fakeHash(code.normalized) }, 'code', now));
}

/** Thêm một thiết bị tin cậy (ghép hoặc khôi phục); bật "chưa xem" để người dùng thấy hoạt động mới ở Bảo mật. */
export function addDevice(s: ServerState, device: Device, kind: 'paired' | 'recovered', now: number): ServerState {
  return mapIdentity(s, (id) => withEvent({ ...id, devices: [...id.devices, device] }, kind, now, device.name, true));
}

/** Thu hồi một thiết bị (không hoàn tác); thiết bị không có thì giữ nguyên. */
export function revokeDevice(s: ServerState, deviceId: string, now: number): ServerState {
  const gone = s.identity?.devices.find((d) => d.id === deviceId);
  if (!gone) return s;
  return mapIdentity(s, (id) => withEvent({ ...id, devices: id.devices.filter((d) => d.id !== deviceId) }, 'revoked', now, gone.name));
}

/** Ghi nhận thiết bị vừa hoạt động (cập nhật `at` để "Hoạt động … trước" đúng). */
export function touchDevice(s: ServerState, deviceId: string, now: number): ServerState {
  return mapIdentity(s, (id) => ({ ...id, devices: id.devices.map((d) => (d.id === deviceId ? { ...d, at: now } : d)) }));
}

/** Đổi tên một thiết bị (đã kiểm tên ở `parseDeviceName`). */
export function renameDevice(s: ServerState, deviceId: string, name: string, now: number): ServerState {
  return mapIdentity(s, (id) => ({ ...id, devices: id.devices.map((d) => (d.id === deviceId ? { ...d, name, at: now } : d)) }));
}

/** Hết phiên thuộc nhánh nào (S19): `A` còn mã khôi phục hoặc thiết bị tin cậy khác (mở lại được); `B` không còn gì để khôi phục (D20, D26). */
export function expiredBranch(s: ServerState): 'A' | 'B' {
  return s.identity && (s.identity.codeHash || s.identity.devices.length > 0) ? 'A' : 'B';
}

/** Đánh dấu đã xem hoạt động mới. */
export function markSeen(s: ServerState): ServerState {
  return s.identity?.unseen ? mapIdentity(s, (id) => ({ ...id, unseen: false })) : s;
}

/** Kết quả xin ghép: thành công, hoặc bị chặn vì hạn mức yêu cầu (DR-018 E1). */
export type RequestResult =
  | { readonly ok: true; readonly state: ServerState; readonly pairing: PairingRequest }
  | { readonly ok: false; readonly state: ServerState };

/** Máy mới xin ghép: sinh mã ghép + số khớp. Quá hạn mức (3 yêu cầu / 10 phút) thì từ chối. */
export function requestPairing(s: ServerState, name: string, now: number, random: RandomSource = browserRandom): RequestResult {
  const recent = s.requests.filter((t) => now - t < IDENTITY.PAIR_REQUEST_WINDOW_MS);
  if (recent.length >= IDENTITY.PAIR_REQUEST_LIMIT) return { ok: false, state: { ...s, requests: recent } };
  const pairing: PairingRequest = { code: PairingCode.generate(random).normalized, number: newMatchNumber(random), name, at: now, status: 'waiting' };
  return { ok: true, state: { ...s, pairing, requests: [...recent, now] }, pairing };
}

/** Yêu cầu ghép đã hết hạn chưa. */
export function pairingExpired(p: PairingRequest, now: number): boolean {
  return now - p.at >= IDENTITY.PAIR_TTL_MS;
}

/** Kết quả tra mã ghép: không có/đã dùng, hết hạn, hoặc tìm thấy. */
export type FindResult = { readonly result: 'none' | 'expired' } | { readonly result: 'found'; readonly pairing: PairingRequest };

/** Tra mã ghép người dùng nhập ở thiết bị tin cậy. */
export function findPairing(s: ServerState, input: string, now: number): FindResult {
  const code = PairingCode.parse(input);
  const p = s.pairing;
  if (!code || !p || p.status !== 'waiting' || p.code !== code.normalized) return { result: 'none' };
  return pairingExpired(p, now) ? { result: 'expired' } : { result: 'found', pairing: p };
}

/** Đặt kết quả cho yêu cầu ghép đang chờ (thiết bị tin cậy duyệt hoặc từ chối). */
export function decidePairing(s: ServerState, status: 'approved' | 'denied'): ServerState {
  return s.pairing ? { ...s, pairing: { ...s.pairing, status } } : s;
}

/** Kết quả thiết bị tin cậy trả lời yêu cầu ghép. */
export type AnswerOutcome = 'approved' | 'denied' | 'wrong' | 'expired';

/** Thiết bị tin cậy trả lời yêu cầu ghép bằng SỐ KHỚP: đúng số = duyệt, sai số hoặc từ chối (null) = từ chối; yêu cầu hết hạn/đã xử lý thì báo hết hạn (DR-018 E1). */
export function answerPairing(s: ServerState, choice: number | null, now: number): { readonly state: ServerState; readonly outcome: AnswerOutcome } {
  const p = s.pairing;
  if (!p || p.status !== 'waiting' || pairingExpired(p, now)) return { state: s, outcome: 'expired' };
  if (choice === p.number) return { state: decidePairing(s, 'approved'), outcome: 'approved' };
  return { state: decidePairing(s, 'denied'), outcome: choice === null ? 'denied' : 'wrong' };
}

/** Xóa yêu cầu ghép (máy mới đã nhận kết quả hoặc hủy). */
export function clearPairing(s: ServerState): ServerState {
  return { ...s, pairing: null };
}

/** Các lựa chọn "số khớp" hiện ở thiết bị duyệt: số đúng cộng các số nhiễu khác nhau, đã xáo trộn. */
export function matchChoices(real: number, random: RandomSource = browserRandom): number[] {
  const picks = new Set<number>([real]);
  while (picks.size < IDENTITY.MATCH_OPTIONS) picks.add(randomIn(IDENTITY.MATCH_MIN, IDENTITY.MATCH_MAX, random));
  const list = [...picks];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = randomIn(0, i, random);
    [list[i], list[j]] = [list[j] as number, list[i] as number];
  }
  return list;
}
