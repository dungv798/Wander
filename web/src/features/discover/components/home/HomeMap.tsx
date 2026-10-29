import { useEffect, useState } from 'react';
import { COPY } from '../../../../shared/const/copy.vi.ts';
import { useReveal } from '../../../../shared/hooks/useReveal.ts';
import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { HOME } from '../../model/home.const.ts';
import { DestMapSection } from '../map/DestMapSection.tsx';

/** Chỉ khởi tạo bản đồ khi nửa thẻ lộ trên thanh tab; giữ chỗ để dữ liệu đến muộn không kích hoạt sớm. */
export function HomeMap({ dest }: { readonly dest: DestinationDetail }) {
  // HomeScreen không có observer reveal; quét cục bộ cả khi nhánh lazy vừa xuất hiện.
  const ref = useReveal<HTMLDivElement>();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= HOME.MAP_VISIBLE_RATIO)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: HOME.MAP_VISIBLE_RATIO, rootMargin: HOME.MAP_ROOT_MARGIN });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return <div ref={ref} className="home-map">
    {visible ? <DestMapSection dest={dest} title={COPY.home.mapTitle} /> : <h2 className="h2">{COPY.home.mapTitle}</h2>}
  </div>;
}
