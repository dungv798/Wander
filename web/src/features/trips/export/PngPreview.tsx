import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle } from '../../../shared/ui/Controls.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { canShareFiles, pngToFile, shareFile } from './shareImage.ts';
import { EXPORT_COPY as C } from './export.copy.ts';
import type { ExportInput, ExportStyle, PngFile } from './Export.types.ts';
import { renderPng } from './renderPng.ts';
import './export.css';

type RenderState = { readonly status: 'loading' } | { readonly status: 'error' } | { readonly status: 'ready'; readonly files: readonly PngFile[] };

/** Tải đúng blob của ảnh đang hiển thị; URL được giữ đến khi rời hoặc thay dữ liệu màn. */
function download(file: PngFile): void {
  const link = document.createElement('a');
  link.href = file.url; link.download = file.filename;
  document.body.append(link); link.click(); link.remove();
}

/** Hủy kết quả cũ khi đổi chuyến hoặc rời màn; không giữ blob URL sau khi hết dùng. */
function usePng(input: ExportInput, round: number): RenderState {
  const style = input.style ?? 'days';
  const [result, setResult] = useState<{ readonly state: RenderState; readonly input: ExportInput; readonly round: number } | null>(null);
  const { trip, destination } = input;
  useEffect(() => {
    let live = true;
    let files: readonly PngFile[] = [];
    renderPng({ trip, destination, style }).then(result => {
      files = result;
      if (live) setResult({ state: { status: 'ready', files }, input: { trip, destination, style }, round });
      else files.forEach(file => URL.revokeObjectURL(file.url));
    }).catch(() => { if (live) setResult({ state: { status: 'error' }, input: { trip, destination, style }, round }); });
    return () => { live = false; files.forEach(file => URL.revokeObjectURL(file.url)); };
  }, [trip, destination, style, round]);
  return result?.input.trip === trip && result.input.destination === destination && result.input.style === style && result.round === round ? result.state : { status: 'loading' };
}

/** Máy có màn cảm ứng chính (điện thoại, máy tính bảng): chỉ ở đó mới gợi ý "nhấn giữ ảnh để lưu". */
function isTouchDevice(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
}

/** Một ảnh xem trước kèm nút gửi (bảng chia sẻ của hệ thống nếu nhận tệp) và nút tải; ảnh PNG đã tạo sẵn thành `File` để `share` chạy ngay trong cử chỉ bấm. */
function ImageSection({ file, index, total, title }: { readonly file: PngFile; readonly index: number; readonly total: number; readonly title: string }) {
  const toast = useToast();
  const shareable = useMemo(() => pngToFile(file), [file]);
  const canShare = canShareFiles([shareable]);
  const suffix = total > 1 ? ` · ${index + 1}/${total}` : '';
  const onShare = (): void => { void shareFile(shareable, title).then(outcome => { if (outcome === 'failed') toast.show(C.shareFailed); }); };
  return (
    <section className="stack">
      {canShare ? <Button block onClick={onShare}>{`${C.share}${suffix}`}</Button> : null}
      <Button block kind={canShare ? 'ghost' : 'primary'} onClick={() => download(file)}>{total > 1 ? `${C.download}${suffix}` : C.create}</Button>
      {!canShare && isTouchDevice() ? <p className="note">{C.holdHint}</p> : null}
      <img className="png-export-image" src={file.url} width={file.width} height={file.height} alt={`${C.preview} · ${index + 1}/${total}`} />
    </section>
  );
}

/** Xem trước ảnh PNG thật; gửi bằng bảng chia sẻ của điện thoại hoặc tải từng phân đoạn, không phát nhiều download tự động bị trình duyệt chặn. */
export default function PngPreview(input: ExportInput) {
  const [round, setRound] = useState(0);
  const [style, setStyle] = useState<ExportStyle>('summary');
  const state = usePng({ ...input, style }, round);
  return (
    <div className="stack pad-x spaced-lg exp-gap png-export">
      <div className="chips" role="group" aria-label={C.styleLabel}>
        <ChipToggle pressed={style === 'summary'} onClick={() => setStyle('summary')}>{C.styleSummary}</ChipToggle>
        <ChipToggle pressed={style === 'days'} onClick={() => setStyle('days')}>{C.styleDays}</ChipToggle>
      </div>
      <p className="note">{style === 'summary' ? C.styleSummaryNote : C.styleDaysNote}</p>
      <h2 className="h2">{C.preview}</h2><p className="note">{C.exact}</p>
      {state.status === 'loading' ? <p role="status">{C.loading}</p> : null}
      {state.status === 'error' ? <div><p role="alert">{C.error}</p><Button onClick={() => setRound(r => r + 1)}>{C.retry}</Button></div> : null}
      {state.status === 'ready' ? state.files.map((file, index) => (
        <ImageSection key={file.url} file={file} index={index} total={state.files.length} title={input.trip.name} />
      )) : null}
    </div>
  );
}
