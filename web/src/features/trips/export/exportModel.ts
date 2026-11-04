import { formatVnd } from '../../../shared/domain/Money.ts';
import { FORMAT } from '../../../shared/const/format.const.ts';
import { dayLabel } from '../../../shared/lib/dates.ts';
import { costCell } from '../model/exportPreview.ts';
import { dayItems, summarizeCosts, tripDays } from '../model/tripMath.ts';
import type { Trip, TripItem } from '../model/trip.types.ts';
import { catalogOf, itemName } from '../model/tripView.ts';
import { EXPORT_COPY as C } from './export.copy.ts';
import { PNG } from './export.const.ts';
import type { ExportInput, TextBlock } from './Export.types.ts';

/** Tiền D17/D18: null không thành 0, đã bao gồm không hiện giá tham khảo như tiền cần trả. */
export function costLabel(item: TripItem): string {
  const cost = costCell(item);
  if (cost.kind === 'known') return formatVnd(cost.k * FORMAT.VND_PER_THOUSAND);
  return cost.kind === 'included' ? C.included : cost.kind === 'unknown' ? C.unknown : '';
}

/** Giờ tùy chọn hiển thị HH:mm kể cả khi API có phần giây. */
export function timeLabel(time: string | null): string {
  return time ? time.split(':').slice(0, PNG.timeParts).join(':') : C.noTime;
}

/** Tên tải xuống an toàn cho Windows, không ký tự điều khiển, tên thiết bị hay dấu chấm cuối. */
export function pngFilename(name: string, index: number, count: number): string {
  const clean = Array.from(name.normalize('NFC').replace(/[<>:"/\\|?*\p{Cc}]/gu, '-').trim().replace(/[. ]+$/u, '')).slice(0, PNG.maxFileName).join('');
  return `${C.fallbackName}-${clean || C.brand}${count > 1 ? `-${index + 1}` : ''}${PNG.extension}`;
}

/** Khoảng ngày không bịa ngày thật cho chuyến dự kiến hoặc dữ liệu thiếu ngày. */
export function dateLabel(trip: Trip): string {
  if (trip.datesTentative) return C.tentative;
  return trip.startDate && trip.endDate ? `${dayLabel(trip.startDate)} – ${dayLabel(trip.endDate)}` : C.noDates;
}

/** Dòng phụ của một mục: chỉ giờ và giá ĐÃ CÓ; mục chưa có gì thì không in dòng phụ (không lặp "Chưa đặt giờ · Chưa biết giá"). */
export function itemDetail(item: TripItem): string {
  const cost = costCell(item);
  const priced = cost.kind === 'known' || cost.kind === 'included' ? costLabel(item) : '';
  return [item.timeOfDay ? timeLabel(item.timeOfDay) : '', priced].filter(Boolean).join(' · ');
}

/** Các mục theo thứ tự thủ công, mỗi mục có số, tên và (nếu có) giờ/giá đã biết. */
function itemBlocks(items: readonly TripItem[], input: ExportInput, section: string): TextBlock[] {
  const catalog = catalogOf(input.destination);
  return items.flatMap((item, i) => {
    const detail = itemDetail(item);
    return [
      { text: `${i + 1}. ${itemName(item, catalog)}`, role: 'body' as const, maxLines: PNG.maxNameLines, keepNext: Boolean(detail), section },
      ...(detail ? [{ text: detail, role: 'small' as const, section }] : []),
    ];
  });
}

/** Kiểu tóm tắt: mỗi ngày một đoạn "A → B → C", không lặp thông tin phụ của từng mục. */
function summaryBlocks(items: readonly TripItem[], input: ExportInput, section: string): TextBlock[] {
  const catalog = catalogOf(input.destination);
  return [{ text: items.map((i) => itemName(i, catalog)).join(' → '), role: 'body', section }];
}

/** Khối tổng chi phí đi liền nhau để không tách khỏi nhau khi chia ảnh. */
function totalBlocks(trip: Trip, exported: readonly TripItem[]): TextBlock[] {
  const sum = summarizeCosts({ ...trip, items: exported });
  const notes: TextBlock[] = [];
  if (sum.unknownCount) notes.push({ text: `${sum.unknownCount} ${C.unknownNote}`, role: 'small' });
  if (sum.includedCount) notes.push({ text: C.includedNote, role: 'small' });
  const lead: TextBlock = { text: sum.knownCount ? `${C.total}: ${formatVnd(sum.totalK * FORMAT.VND_PER_THOUSAND)}` : C.noKnown, role: 'body', keepNext: notes.length > 0 };
  return [lead, ...notes.map((n, i) => ({ ...n, keepNext: i < notes.length - 1 }))];
}

/** Dựng nội dung thuần cho các ngày của chuyến (kể cả ngày trống); mục chưa có ngày không xuất, tổng chỉ tính mục xuất ra. */
export function exportBlocks(input: ExportInput): TextBlock[] {
  const { trip } = input;
  const style = input.style ?? 'days';
  const blocks: TextBlock[] = [
    { text: trip.name, role: 'title', maxLines: PNG.maxNameLines },
    { text: `${input.destination.name} · ${dateLabel(trip)}`, role: 'small' },
  ];
  const days = trip.startDate && trip.endDate ? tripDays(trip) : [];
  for (const [index, day] of days.entries()) {
    const section = `${C.day} ${index + 1}${trip.datesTentative ? '' : ` · ${dayLabel(day)}`}`;
    blocks.push({ text: section, role: 'heading', keepNext: true });
    const items = dayItems(trip, day);
    if (!items.length) blocks.push({ text: C.emptyDay, role: 'small' as const });
    else blocks.push(...(style === 'summary' ? summaryBlocks(items, input, section) : itemBlocks(items, input, section)));
  }
  const exported = trip.items.filter(i => i.day && days.includes(i.day));
  const unassigned = trip.items.length - exported.length; // mục chưa có ngày không thuộc lịch: không xuất, chỉ ghi chú (đúng lời hứa của màn xem trước)
  if (!exported.length) blocks.push({ text: C.empty, role: 'body' });
  if (unassigned) blocks.push({ text: `${unassigned} ${C.undatedNote}`, role: 'small' });
  blocks.push(...totalBlocks(trip, exported));
  return blocks;
}
