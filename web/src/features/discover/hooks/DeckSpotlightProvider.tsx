import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

interface DeckFocus { readonly destinationId: string; readonly placeId: string | null }
interface DeckSpotlightValue { readonly focus: DeckFocus | null; readonly publish: Dispatch<SetStateAction<DeckFocus | null>> }
const DeckSpotlightContext = createContext<DeckSpotlightValue | null>(null);

/** Tọa độ nhìn theo thẻ đang xem là UI tạm thời, không ghi thành quyết định hoặc lưu localStorage. */
export function DeckSpotlightProvider({ children }: { readonly children: ReactNode }) {
  const [focus, publish] = useState<DeckFocus | null>(null);
  const value = useMemo(() => ({ focus, publish }), [focus]);
  return <DeckSpotlightContext.Provider value={value}>{children}</DeckSpotlightContext.Provider>;
}

/** Map đọc đúng thẻ của bộ quẹt, kể cả chế độ thêm vào chuyến có bộ loại trừ/bỏ qua riêng. */
export function useDeckSpotlight(): DeckSpotlightValue {
  const value = useContext(DeckSpotlightContext);
  if (!value) throw new Error('DeckSpotlightProvider');
  return value;
}

/** Chỉ đổi focus khi đổi thẻ; đổi ảnh trên cùng thẻ không làm camera bay lại. Rời bộ quẹt thì giải phóng focus. */
export function usePublishDeckSpotlight(destinationId: string, placeId: string | null): void {
  const { publish } = useDeckSpotlight();
  useEffect(() => { publish({ destinationId, placeId }); }, [destinationId, placeId, publish]);
  useEffect(() => () => publish(null), [publish]);
}
