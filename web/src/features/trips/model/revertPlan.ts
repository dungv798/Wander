import type { DayAssignment, ItemChange, ScheduleChange, TripPatch } from '../api/TripsGateway.ts';
import type { Trip, TripItem } from './trip.types.ts';

/** Các trường nội dung của mục mà Hoàn tác khôi phục (ngày và thứ tự có lệnh lịch riêng). */
const CONTENT_FIELDS = ['type', 'title', 'timeOfDay', 'durationMin', 'note', 'costK', 'included', 'referenceK', 'booking'] as const;

/** Lệnh sửa nội dung cho các mục chung: mỗi mục có trường nào khác trước/sau thì khôi phục đúng các trường đó. */
function contentEdits(before: Trip, after: Trip): RevertStep[] {
  const afterById = new Map(after.items.map((i) => [i.id, i]));
  const steps: RevertStep[] = [];
  for (const b of before.items) {
    const a = afterById.get(b.id);
    if (!a) continue;
    const change: Record<string, unknown> = {};
    for (const f of CONTENT_FIELDS) if (a[f] !== b[f]) change[f] = b[f];
    if (Object.keys(change).length) steps.push({ kind: 'edit', itemId: b.id, change: change as ItemChange });
  }
  return steps;
}

/** Một lệnh ngược của Hoàn tác, thực hiện tuần tự trên máy chủ. */
export type RevertStep =
  | { readonly kind: 'schedule'; readonly change: ScheduleChange }
  | { readonly kind: 'restore'; readonly itemId: string }
  | { readonly kind: 'trash'; readonly itemId: string }
  | { readonly kind: 'patch'; readonly patch: TripPatch }
  | { readonly kind: 'edit'; readonly itemId: string; readonly change: ItemChange }
  | { readonly kind: 'discard'; readonly itemId: string };

/** Tập mã mục theo ngày (null = "Chưa có ngày"); dùng để biết ngày nào chỉ bị xếp lại thứ tự hay có mục ra/vào. */
function idsByDay(items: readonly TripItem[]): Map<string | null, Set<string>> {
  const map = new Map<string | null, Set<string>>();
  for (const i of items) map.set(i.day, (map.get(i.day) ?? new Set<string>()).add(i.id));
  return map;
}

/** Hai tập có cùng phần tử không. */
function sameSet(a: ReadonlySet<string> | undefined, b: ReadonlySet<string> | undefined): boolean {
  return a !== undefined && b !== undefined && a.size === b.size && [...a].every((x) => b.has(x));
}

/** Lệnh gán lại ngày/vị trí cho các mục chung: đổi ngày thì gán lại; cùng ngày thì chỉ gán lại khi ngày đó thuần xếp lại thứ tự (có mục ra/vào thì thứ hạng đổi chỉ do dồn số, KHÔNG gán đè). */
function assignmentsToRevert(before: Trip, after: Trip): DayAssignment[] {
  const afterById = new Map(after.items.map((i) => [i.id, i]));
  const beforeDays = idsByDay(before.items);
  const afterDays = idsByDay(after.items);
  const out: DayAssignment[] = [];
  for (const b of before.items) {
    const a = afterById.get(b.id);
    if (!a) continue;
    const movedDay = a.day !== b.day;
    const pureReorder = !movedDay && a.position !== b.position && sameSet(beforeDays.get(b.day), afterDays.get(b.day));
    if (!movedDay && !pureReorder) continue;
    out.push(b.day === null ? { itemId: b.id, day: null } : { itemId: b.id, day: b.day, ...(b.position === null ? {} : { position: b.position }) });
  }
  return out;
}

/**
 * Lệnh ngược đưa chuyến `after` (đã đọc lại từ máy chủ) về `before`: khoảng ngày + gán ngày/thứ tự (một lệnh lịch nguyên tử), rồi khôi phục
 * nội dung các mục đã sửa, khôi phục các mục đã bị xóa mềm, xóa mềm lại các mục vừa được khôi phục (mục hoàn toàn mới thì bỏ hẳn), cuối cùng
 * PATCH tên và nhãn "chưa chắc". Trả danh sách rỗng nếu không có gì khác.
 */
export function revertPlan(before: Trip, after: Trip): RevertStep[] {
  const steps: RevertStep[] = [];
  const change: { startDate?: string; endDate?: string; assignments?: DayAssignment[] } = {};
  if (before.startDate !== after.startDate || before.endDate !== after.endDate) {
    change.startDate = before.startDate;
    change.endDate = before.endDate;
  }
  const assignments = assignmentsToRevert(before, after);
  if (assignments.length) change.assignments = assignments;
  if (Object.keys(change).length) steps.push({ kind: 'schedule', change });
  steps.push(...contentEdits(before, after));
  const afterLive = new Set(after.items.map((i) => i.id));
  const beforeLive = new Set(before.items.map((i) => i.id));
  for (const id of beforeLive) if (!afterLive.has(id) && after.trash.some((t) => t.id === id)) steps.push({ kind: 'restore', itemId: id });
  for (const id of afterLive) {
    if (beforeLive.has(id)) continue;
    steps.push({ kind: before.trash.some((t) => t.id === id) ? 'trash' : 'discard', itemId: id });
  }
  const patch: { name?: string; datesTentative?: boolean; cover?: Trip['cover'] } = {};
  if (JSON.stringify(before.cover ?? null) !== JSON.stringify(after.cover ?? null)) patch.cover = before.cover ?? null;
  if (before.name !== after.name) patch.name = before.name;
  if (before.datesTentative !== after.datesTentative) patch.datesTentative = before.datesTentative;
  if (Object.keys(patch).length) steps.push({ kind: 'patch', patch });
  return steps;
}
