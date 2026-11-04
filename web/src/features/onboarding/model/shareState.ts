import type { PlaceView } from '../../discover/index.ts';
import type { TripDay } from './onboarding.types.ts';
import { applyProposal } from './sampleTrip.ts';

/** Trạng thái minh họa của cảnh chia sẻ (không có liên kết thật, không gửi dữ liệu ra ngoài). */
export interface ShareState {
  readonly days: readonly TripDay[];
  /** Đã mở bảng mời; đã "sao chép" liên kết; các thành viên đã tham gia (mã); đã có đề xuất; chủ chuyến đã quyết chưa. */
  readonly shared: boolean;
  readonly copied: boolean;
  readonly members: readonly string[];
  readonly proposed: boolean;
  readonly decided: 'accepted' | 'rejected' | null;
}

/** Hành động của cảnh chia sẻ theo đúng thứ tự cơ chế ở kế hoạch 1b: mời bằng liên kết → thành viên vào bằng tên hiển thị → đề xuất → chủ chuyến chấp nhận hoặc từ chối. */
export type ShareAction =
  | { readonly type: 'share' }
  | { readonly type: 'copy' }
  | { readonly type: 'join'; readonly member: string }
  | { readonly type: 'propose' }
  | { readonly type: 'accept'; readonly place: PlaceView }
  | { readonly type: 'reject' }
  | { readonly type: 'reset'; readonly state: ShareState };

/** Trạng thái đầu: chỉ có chủ chuyến, lịch gốc, chưa mở bảng mời. */
export function initialShare(days: readonly TripDay[], owner: string): ShareState {
  return { days, shared: false, copied: false, members: [owner], proposed: false, decided: null };
}

/** Cập nhật trạng thái; hành động sai thứ tự hoặc lặp lại bị bỏ qua nên xem lại cảnh không tạo trùng địa điểm hay thành viên. */
export function shareReducer(state: ShareState, action: ShareAction): ShareState {
  switch (action.type) {
    case 'reset':
      return action.state;
    case 'share':
      return state.shared || state.proposed ? state : { ...state, shared: true };
    case 'copy':
      return !state.shared || state.copied ? state : { ...state, copied: true };
    case 'join':
      return state.members.includes(action.member) ? state : { ...state, members: [...state.members, action.member] };
    case 'propose':
      return state.proposed ? state : { ...state, shared: false, proposed: true };
    case 'accept':
      return !state.proposed || state.decided ? state : { ...state, decided: 'accepted', days: applyProposal(state.days, action.place) };
    case 'reject':
      return !state.proposed || state.decided ? state : { ...state, decided: 'rejected' };
  }
}
