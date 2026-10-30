import { useEffect, useRef } from 'react';
import { COPY } from '../const/copy.vi.ts';
import { MAP } from './map.const.ts';
import { formatRouteKm } from './routeSegments.ts';

interface RoutePreviewProps {
  readonly name: string;
  readonly thumb?: string;
  readonly time?: string | null;
  readonly km?: number;
  readonly onClose: () => void;
  readonly onDetails: () => void;
}

/** Thẻ chọn có ảnh cố định 96×96; đóng bằng Escape hoặc chạm ngoài, giữ nguyên luồng chi tiết của màn gọi. */
export function RoutePreview({ name, thumb, time, km, onClose, onDetails }: RoutePreviewProps) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    /** Canvas xử lý chọn ghim/đoạn sau pointerdown; chỉ đóng ngay khi chạm giao diện bên ngoài canvas. */
    const outside = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && !ref.current?.contains(target) && !target.closest('.tm-gl, .tm-accessible')) onClose();
    };
    /** Đóng thẻ bằng Escape mà không sửa trạng thái chuyến. */
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [onClose]);
  return <section ref={ref} className="tm-preview" aria-label={name}>
    <div className="tm-preview-body">
      <div className="tm-preview-thumb">{thumb && <img src={thumb} width={MAP.THUMB_PX} height={MAP.THUMB_PX} alt="" loading="lazy" />}</div>
      <div className="tm-preview-copy" aria-live="polite"><h3>{name}</h3><p>{time || COPY.map.noTime}</p><p>{km === undefined ? COPY.map.routeEnd : formatRouteKm(km)}</p></div>
    </div>
    <div className="tm-preview-actions"><button type="button" onClick={onDetails}>{COPY.map.previewDetails}</button><button type="button" onClick={onClose}>{COPY.map.previewClose}</button></div>
  </section>;
}
