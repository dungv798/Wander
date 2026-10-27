import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { SectionHead } from '../../../shared/ui/SectionHead.tsx';
import { firstPhotoUrl } from '../../discover/index.ts';
import { useTemplates } from '../hooks/useTemplates.ts';
import type { TemplateView } from '../model/template.types.ts';
import { TEMPLATES_COPY as T } from '../model/templates.copy.ts';
import { TemplateSheet } from './TemplateSheet.tsx';

/** Ảnh bìa của lịch mẫu: ảnh nơi đầu tiên của lịch. */
function coverOf(t: TemplateView): string | undefined {
  const first = t.days.flatMap((d) => d.places)[0];
  return first ? firstPhotoUrl(first) : undefined;
}

/** Một thẻ lịch mẫu: ảnh nơi đầu tiên, tên, số ngày/số nơi và nhãn "Bản nháp" khi chưa duyệt. */
function TemplateCard({ template, onOpen }: { readonly template: TemplateView; readonly onOpen: () => void }) {
  const cover = coverOf(template);
  return (
    <button className="tplcard" type="button" onClick={onOpen}>
      <span className="tplimg">{cover ? <img alt="" src={cover} loading="lazy" /> : null}</span>
      <span className="tpltx">
        <b>{template.title}</b>
        <span className="note">{fill(T.card, { days: template.days.length, places: template.placeCount })}</span>
        {template.status === 'draft' ? <span className="chip tint cat-luu">{T.draft}</span> : null}
      </span>
    </button>
  );
}

/** Khối "Lịch mẫu để bắt đầu" ở trang Khám phá: hàng thẻ cuộn ngang; ẩn đi khi chưa có lịch mẫu hoặc đang tải/lỗi (không chặn trang). */
export function TemplatesSection({ destId }: { readonly destId: string }) {
  const { state } = useTemplates(destId);
  const [openId, setOpenId] = useState<string | null>(null);
  if (state.status !== 'ready' || !state.data.length) return null;
  const open = state.data.find((t) => t.id === openId);
  return (
    <section className="stack">
      <SectionHead title={T.section} />
      <p className="note">{T.sectionNote}</p>
      <div className="hscroll tplrow">
        {state.data.map((t) => (
          <TemplateCard key={t.id} template={t} onOpen={() => setOpenId(t.id)} />
        ))}
      </div>
      {open ? <TemplateSheet template={open} destId={destId} onClose={() => setOpenId(null)} /> : null}
    </section>
  );
}
