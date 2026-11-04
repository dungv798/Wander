import { useCallback, useState } from 'react';
import type { RefObject } from 'react';
import { HALF } from '../../../shared/const/math.const.ts';
import type { PlaceView } from '../../discover/index.ts';
import { SWIPE } from '../model/onboarding.const.ts';

/** Ảnh thu nhỏ đang bay từ thẻ vừa chọn xuống khay "đã chọn" (tọa độ theo sân khấu, px). */
export interface FlyingChip {
  readonly id: number;
  readonly place: PlaceView;
  readonly fx: number;
  readonly fy: number;
  readonly tx: number;
  readonly ty: number;
}

/** Khay "đã chọn": ảnh đã đáp xuống và ảnh đang bay. */
export interface SelectedTray {
  readonly thumbs: readonly PlaceView[];
  readonly chips: readonly FlyingChip[];
  /** Cho ảnh của địa điểm bay từ khung thẻ `from` (tọa độ màn hình) xuống chỗ tiếp theo của khay. */
  readonly fly: (place: PlaceView, from: DOMRect) => void;
  /** Ảnh bay xong: thêm vào khay (bộ đếm tăng cùng lúc). */
  readonly land: (id: number) => void;
  readonly clear: () => void;
}

/** Quản lý khay "đã chọn" của cảnh quẹt; `stage` là phần tử sân khấu làm gốc tọa độ. */
export function useSelectedTray(stage: RefObject<HTMLElement | null>): SelectedTray {
  const [thumbs, setThumbs] = useState<readonly PlaceView[]>([]);
  const [chips, setChips] = useState<readonly FlyingChip[]>([]);
  const [seq, setSeq] = useState(0);
  const fly = useCallback(
    /** Tính điểm đi/đến theo sân khấu rồi thêm một ảnh bay. */
    (place: PlaceView, from: DOMRect) => {
      const box = stage.current?.getBoundingClientRect();
      if (!box) return;
      const slot = SWIPE.THUMB_LEFT_PX + (thumbs.length + chips.length) * SWIPE.THUMB_STEP_PX + SWIPE.THUMB_R_PX;
      const chip: FlyingChip = { id: seq, place, fx: from.left - box.left + from.width / HALF, fy: from.top - box.top + from.height / HALF, tx: slot, ty: box.height - SWIPE.THUMB_BOTTOM_PX - SWIPE.THUMB_R_PX };
      setSeq(seq + 1);
      setChips((list) => [...list, chip]);
    },
    [stage, thumbs.length, chips.length, seq],
  );
  const land = useCallback(
    /** Chuyển ảnh đã bay xong từ danh sách bay sang khay (hai cập nhật riêng, không lồng nhau). */
    (id: number) => {
      const chip = chips.find((c) => c.id === id);
      if (!chip) return;
      setThumbs((t) => [...t, chip.place]);
      setChips((list) => list.filter((c) => c.id !== id));
    },
    [chips],
  );
  const clear = useCallback(() => {
    setThumbs([]);
    setChips([]);
  }, []);
  return { thumbs, chips, fly, land, clear };
}
