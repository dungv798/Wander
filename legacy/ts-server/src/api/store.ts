// Nghiệp vụ chuyến và mục trên SQLite. Mọi hàm nhận `ownerId`: chuyến của người khác trả về "không tìm thấy"
// (không tiết lộ chuyến có tồn tại, cùng tinh thần INV-6).
import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { tx } from './db.ts';
import { badRequest, conflict, notFound } from './errors.ts';
import { buildCostFields, formatVndFromK, totalExtraK, totalsByKey } from '../domain/money.ts';
import { datesOutsideRange, isDateInRange, isValidIsoDate, listDays, validateTripRange } from '../domain/trip.ts';
import {
  ITEM_TYPES,
  ITEM_TYPE_LABELS,
  insertAt,
  isItemType,
  parseDurationMin,
  parseNote,
  parseTimeOfDay,
  parseTitle,
  validateReorder,
} from '../domain/items.ts';
import type { ItemType } from '../domain/items.ts';

export interface TripRow {
  id: string;
  ownerIdentityId: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface ItemRowDb {
  id: string;
  trip_id: string;
  day_date: string;
  position: number;
  type: string;
  title: string;
  time_of_day: string | null;
  duration_min: number | null;
  note: string | null;
  cost_k: number | null;
  included: number;
  reference_k: number | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemView {
  id: string;
  tripId: string;
  day: string;
  position: number;
  type: ItemType;
  typeLabel: string;
  title: string;
  timeOfDay: string | null;
  durationMin: number | null;
  note: string | null;
  costK: number | null;
  costFormatted: string | null;
  included: boolean;
  referenceK: number | null;
  referenceFormatted: string | null;
  /** Chỉ có ý nghĩa với loại "Việc cần làm". */
  done: boolean;
  deletedAt: string | null;
}

const now = () => new Date().toISOString();

function mapTrip(r: Record<string, unknown>): TripRow {
  return {
    id: r['id'] as string,
    ownerIdentityId: r['owner_identity_id'] as string,
    name: r['name'] as string,
    destination: r['destination'] as string,
    startDate: r['start_date'] as string,
    endDate: r['end_date'] as string,
    createdAt: r['created_at'] as string,
    updatedAt: r['updated_at'] as string,
  };
}

function toView(r: ItemRowDb, done: boolean): ItemView {
  return {
    id: r.id,
    tripId: r.trip_id,
    day: r.day_date,
    position: r.position,
    type: r.type as ItemType,
    typeLabel: ITEM_TYPE_LABELS[r.type as ItemType] ?? r.type,
    title: r.title,
    timeOfDay: r.time_of_day,
    durationMin: r.duration_min,
    note: r.note,
    costK: r.cost_k,
    costFormatted: r.cost_k === null ? null : formatVndFromK(r.cost_k),
    included: r.included === 1,
    referenceK: r.reference_k,
    referenceFormatted: r.reference_k === null ? null : formatVndFromK(r.reference_k),
    done,
    deletedAt: r.deleted_at,
  };
}

// ---------- Chuyến ----------

export function requireTrip(db: DatabaseSync, ownerId: string, tripId: string): TripRow {
  const row = db.prepare('SELECT * FROM trips WHERE id = ? AND owner_identity_id = ?').get(tripId, ownerId);
  if (!row) throw notFound();
  return mapTrip(row);
}

export function listTrips(db: DatabaseSync, ownerId: string): TripRow[] {
  return db
    .prepare('SELECT * FROM trips WHERE owner_identity_id = ? ORDER BY start_date DESC, created_at DESC')
    .all(ownerId)
    .map(mapTrip);
}

function parseTripText(v: unknown, field: string, max: number): string {
  if (typeof v !== 'string' || v.trim() === '') throw badRequest('REQUIRED', 'Trường này là bắt buộc.', field);
  const s = v.trim();
  if (s.length > max) throw badRequest('TOO_LONG', 'Nội dung quá dài.', field);
  return s;
}

function assertRange(start: unknown, end: unknown): void {
  const r = validateTripRange(start, end);
  if (!r.ok) {
    const field = r.error === 'START_REQUIRED' ? 'startDate' : 'endDate';
    throw badRequest(r.error, 'Khoảng ngày của chuyến không hợp lệ.', field);
  }
}

export function createTrip(db: DatabaseSync, ownerId: string, input: Record<string, unknown>): TripRow {
  const name = parseTripText(input['name'], 'name', 120);
  const destination = parseTripText(input['destination'], 'destination', 200);
  assertRange(input['startDate'], input['endDate']);
  const id = randomUUID();
  const t = now();
  db.prepare(
    `INSERT INTO trips (id, owner_identity_id, name, destination, start_date, end_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, ownerId, name, destination, input['startDate'] as string, input['endDate'] as string, t, t);
  return requireTrip(db, ownerId, id);
}

export function updateTrip(db: DatabaseSync, ownerId: string, tripId: string, input: Record<string, unknown>): TripRow {
  return tx(db, () => {
    const trip = requireTrip(db, ownerId, tripId);
    const name = 'name' in input ? parseTripText(input['name'], 'name', 120) : trip.name;
    const destination = 'destination' in input ? parseTripText(input['destination'], 'destination', 200) : trip.destination;
    const start = 'startDate' in input ? input['startDate'] : trip.startDate;
    const end = 'endDate' in input ? input['endDate'] : trip.endDate;
    assertRange(start, end);
    if (start !== trip.startDate || end !== trip.endDate) {
      // R12: tính cả mục đã xóa mềm để việc khôi phục không bao giờ tạo ra mục mồ côi.
      const dates = (db.prepare('SELECT DISTINCT day_date FROM items WHERE trip_id = ?').all(tripId) as { day_date: string }[]).map(
        (r) => r.day_date,
      );
      const outside = datesOutsideRange(dates, start as string, end as string);
      if (outside.length > 0) {
        throw conflict(
          'DATES_ORPHAN_ITEMS',
          'Có mục nằm ngoài khoảng ngày mới. Hãy chuyển hoặc xóa vĩnh viễn các mục đó trước.',
          { dates: outside },
        );
      }
    }
    db.prepare('UPDATE trips SET name = ?, destination = ?, start_date = ?, end_date = ?, updated_at = ? WHERE id = ?').run(
      name,
      destination,
      start as string,
      end as string,
      now(),
      tripId,
    );
    return requireTrip(db, ownerId, tripId);
  });
}

// ---------- Mục ----------

function liveIds(db: DatabaseSync, tripId: string, day: string): string[] {
  return (
    db
      .prepare('SELECT id FROM items WHERE trip_id = ? AND day_date = ? AND deleted_at IS NULL ORDER BY position, created_at, id')
      .all(tripId, day) as { id: string }[]
  ).map((r) => r.id);
}

function writeOrder(db: DatabaseSync, ids: readonly string[]): void {
  const stmt = db.prepare('UPDATE items SET position = ? WHERE id = ?');
  ids.forEach((id, i) => stmt.run(i, id));
}

function getItemRow(db: DatabaseSync, tripId: string, itemId: string): ItemRowDb {
  const row = db.prepare('SELECT * FROM items WHERE id = ? AND trip_id = ?').get(itemId, tripId) as ItemRowDb | undefined;
  if (!row) throw notFound();
  return row;
}

function isDone(db: DatabaseSync, itemId: string, personId: string): boolean {
  return db.prepare('SELECT 1 FROM completions WHERE item_id = ? AND person_id = ?').get(itemId, personId) !== undefined;
}

export function getItemView(db: DatabaseSync, ownerId: string, tripId: string, itemId: string): ItemView {
  requireTrip(db, ownerId, tripId);
  return toView(getItemRow(db, tripId, itemId), isDone(db, itemId, ownerId));
}

function parseDay(trip: TripRow, v: unknown): string {
  if (!isValidIsoDate(v)) throw badRequest('INVALID_DATE', 'Ngày không hợp lệ.', 'day');
  if (!isDateInRange(v, trip.startDate, trip.endDate)) {
    throw badRequest('DAY_OUT_OF_RANGE', 'Ngày nằm ngoài khoảng ngày của chuyến.', 'day');
  }
  return v;
}

function must<T>(r: { ok: true; value: T } | { ok: false; error: string }, field: string): T {
  if (!r.ok) throw badRequest(r.error, 'Giá trị không hợp lệ.', field);
  return r.value;
}

function costFromInput(
  input: Record<string, unknown>,
  current: { costK: number | null; included: boolean; referenceK: number | null } | null,
) {
  const cost = 'cost' in input ? input['cost'] : (current?.costK ?? null);
  const referenceCost = 'referenceCost' in input ? input['referenceCost'] : (current?.referenceK ?? null);
  let included = current?.included ?? false;
  if ('included' in input) {
    if (typeof input['included'] !== 'boolean') throw badRequest('MALFORMED', 'Giá trị không hợp lệ.', 'included');
    included = input['included'];
  }
  // Bỏ tick "đã bao gồm" thì giá tham khảo không còn ý nghĩa: xóa nếu người dùng không gửi giá tham khảo mới.
  const ref = !included && !('referenceCost' in input) ? null : referenceCost;
  const r = buildCostFields(cost, included, ref);
  if (!r.ok) throw badRequest(r.error.code, 'Giá trị không hợp lệ.', r.error.field);
  return r.value;
}

export function createItem(db: DatabaseSync, ownerId: string, tripId: string, input: Record<string, unknown>): ItemView {
  return tx(db, () => {
    const trip = requireTrip(db, ownerId, tripId);
    const day = parseDay(trip, input['day']);
    if (!isItemType(input['type'])) throw badRequest('INVALID_TYPE', 'Loại mục không hợp lệ.', 'type');
    const type = input['type'];
    const title = must(parseTitle(input['title']), 'title');
    const timeOfDay = must(parseTimeOfDay(input['timeOfDay']), 'timeOfDay');
    const durationMin = must(parseDurationMin(input['durationMin']), 'durationMin');
    const note = must(parseNote(input['note']), 'note');
    const cost = costFromInput(input, null);

    const id = randomUUID();
    const t = now();
    const ids = liveIds(db, tripId, day);
    const requested = typeof input['position'] === 'number' ? Math.trunc(input['position']) : ids.length;
    db.prepare(
      `INSERT INTO items (id, trip_id, day_date, position, type, title, time_of_day, duration_min, note,
                          cost_k, included, reference_k, deleted_at, created_at, updated_at)
       VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
    ).run(id, tripId, day, type, title, timeOfDay, durationMin, note, cost.costK, cost.included ? 1 : 0, cost.referenceK, t, t);
    writeOrder(db, insertAt(ids, id, requested));
    return toView(getItemRow(db, tripId, id), false);
  });
}

export function updateItem(
  db: DatabaseSync,
  ownerId: string,
  tripId: string,
  itemId: string,
  input: Record<string, unknown>,
): ItemView {
  return tx(db, () => {
    const trip = requireTrip(db, ownerId, tripId);
    const row = getItemRow(db, tripId, itemId);
    if (row.deleted_at !== null) throw conflict('ITEM_DELETED', 'Mục đã bị xóa. Hãy khôi phục trước khi sửa.');

    let type = row.type as ItemType;
    if ('type' in input) {
      if (!isItemType(input['type'])) throw badRequest('INVALID_TYPE', 'Loại mục không hợp lệ.', 'type');
      type = input['type'];
    }
    const title = 'title' in input ? must(parseTitle(input['title']), 'title') : row.title;
    const timeOfDay = 'timeOfDay' in input ? must(parseTimeOfDay(input['timeOfDay']), 'timeOfDay') : row.time_of_day;
    const durationMin = 'durationMin' in input ? must(parseDurationMin(input['durationMin']), 'durationMin') : row.duration_min;
    const note = 'note' in input ? must(parseNote(input['note']), 'note') : row.note;
    const cost = costFromInput(input, { costK: row.cost_k, included: row.included === 1, referenceK: row.reference_k });
    const day = 'day' in input ? parseDay(trip, input['day']) : row.day_date;

    db.prepare(
      `UPDATE items SET type = ?, title = ?, time_of_day = ?, duration_min = ?, note = ?,
                        cost_k = ?, included = ?, reference_k = ?, updated_at = ? WHERE id = ?`,
    ).run(type, title, timeOfDay, durationMin, note, cost.costK, cost.included ? 1 : 0, cost.referenceK, now(), itemId);

    if (day !== row.day_date) {
      // Chuyển sang ngày khác (A-7): bỏ khỏi ngày cũ, thêm vào ngày mới (mặc định cuối ngày hoặc vị trí được gửi).
      const oldIds = liveIds(db, tripId, row.day_date).filter((x) => x !== itemId);
      db.prepare('UPDATE items SET day_date = ? WHERE id = ?').run(day, itemId);
      const newIds = liveIds(db, tripId, day).filter((x) => x !== itemId);
      const requested = typeof input['position'] === 'number' ? Math.trunc(input['position']) : newIds.length;
      writeOrder(db, oldIds);
      writeOrder(db, insertAt(newIds, itemId, requested));
    }
    return toView(getItemRow(db, tripId, itemId), isDone(db, itemId, ownerId));
  });
}

export function reorderDay(db: DatabaseSync, ownerId: string, tripId: string, day: string, ordered: unknown): ItemView[] {
  return tx(db, () => {
    const trip = requireTrip(db, ownerId, tripId);
    parseDay(trip, day);
    if (!Array.isArray(ordered) || !ordered.every((x) => typeof x === 'string')) {
      throw badRequest('MALFORMED', 'Thứ tự không hợp lệ.', 'orderedIds');
    }
    const current = liveIds(db, tripId, day);
    if (!validateReorder(current, ordered as string[])) {
      throw badRequest('INVALID_ORDER', 'Thứ tự phải gồm đúng các mục đang hiện trong ngày.', 'orderedIds');
    }
    writeOrder(db, ordered as string[]);
    return dayItems(db, ownerId, tripId, day);
  });
}

function dayItems(db: DatabaseSync, ownerId: string, tripId: string, day: string): ItemView[] {
  const rows = db
    .prepare('SELECT * FROM items WHERE trip_id = ? AND day_date = ? AND deleted_at IS NULL ORDER BY position, created_at, id')
    .all(tripId, day) as unknown as ItemRowDb[];
  return rows.map((r) => toView(r, isDone(db, r.id, ownerId)));
}

// ---------- Xóa mềm, Hoàn tác, khôi phục, xóa vĩnh viễn (D19, R7, A-8) ----------

export function softDeleteItem(db: DatabaseSync, ownerId: string, tripId: string, itemId: string): ItemView {
  return tx(db, () => {
    requireTrip(db, ownerId, tripId);
    const row = getItemRow(db, tripId, itemId);
    if (row.deleted_at !== null) throw conflict('ALREADY_DELETED', 'Mục đã bị xóa.');
    // Giữ nguyên day_date và position để khôi phục về đúng chỗ cũ.
    db.prepare('UPDATE items SET deleted_at = ?, updated_at = ? WHERE id = ?').run(now(), now(), itemId);
    writeOrder(db, liveIds(db, tripId, row.day_date));
    return toView(getItemRow(db, tripId, itemId), isDone(db, itemId, ownerId));
  });
}

/** Hoàn tác và "khôi phục từ Đã xóa gần đây" là cùng một thao tác. */
export function restoreItem(db: DatabaseSync, ownerId: string, tripId: string, itemId: string): ItemView {
  return tx(db, () => {
    const trip = requireTrip(db, ownerId, tripId);
    const row = getItemRow(db, tripId, itemId);
    if (row.deleted_at === null) throw conflict('NOT_DELETED', 'Mục này chưa bị xóa.');
    if (!isDateInRange(row.day_date, trip.startDate, trip.endDate)) {
      throw conflict('DAY_OUT_OF_RANGE', 'Ngày của mục nằm ngoài khoảng ngày của chuyến.');
    }
    db.prepare('UPDATE items SET deleted_at = NULL, updated_at = ? WHERE id = ?').run(now(), itemId);
    const ids = liveIds(db, tripId, row.day_date).filter((x) => x !== itemId);
    writeOrder(db, insertAt(ids, itemId, row.position));
    return toView(getItemRow(db, tripId, itemId), isDone(db, itemId, ownerId));
  });
}

export function listTrash(db: DatabaseSync, ownerId: string, tripId: string): ItemView[] {
  requireTrip(db, ownerId, tripId);
  const rows = db
    .prepare('SELECT * FROM items WHERE trip_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC, id')
    .all(tripId) as unknown as ItemRowDb[];
  return rows.map((r) => toView(r, isDone(db, r.id, ownerId)));
}

/** Xóa vĩnh viễn chỉ áp dụng cho mục đã nằm trong "Đã xóa gần đây" (mặc định cho Q17c). */
export function permanentlyDeleteItem(db: DatabaseSync, ownerId: string, tripId: string, itemId: string): void {
  tx(db, () => {
    requireTrip(db, ownerId, tripId);
    const row = getItemRow(db, tripId, itemId);
    if (row.deleted_at === null) throw conflict('NOT_IN_TRASH', 'Chỉ xóa vĩnh viễn được mục đã nằm trong "Đã xóa gần đây".');
    db.prepare('DELETE FROM completions WHERE item_id = ?').run(itemId);
    db.prepare('DELETE FROM items WHERE id = ?').run(itemId);
  });
}

// ---------- Việc cần làm (A-10, D10, P5) ----------

export function setTaskDone(db: DatabaseSync, ownerId: string, tripId: string, itemId: string, done: unknown): ItemView {
  return tx(db, () => {
    requireTrip(db, ownerId, tripId);
    const row = getItemRow(db, tripId, itemId);
    if (row.deleted_at !== null) throw conflict('ITEM_DELETED', 'Mục đã bị xóa.');
    if (row.type !== 'task') throw badRequest('NOT_A_TASK', 'Chỉ mục loại "Việc cần làm" mới có ô tích.', 'type');
    if (typeof done !== 'boolean') throw badRequest('MALFORMED', 'Giá trị không hợp lệ.', 'done');
    if (done) {
      db.prepare('INSERT OR REPLACE INTO completions (item_id, person_id, done_at) VALUES (?, ?, ?)').run(itemId, ownerId, now());
    } else {
      db.prepare('DELETE FROM completions WHERE item_id = ? AND person_id = ?').run(itemId, ownerId);
    }
    return toView(row, done);
  });
}

// ---------- Xem lịch (A-11) ----------

export interface TripDetail {
  trip: Omit<TripRow, 'ownerIdentityId'>;
  dayCount: number;
  days: Array<{
    date: string;
    index: number;
    weekday: number;
    weekdayLabel: string;
    items: ItemView[];
  }>;
  totals: {
    extraK: number;
    extraFormatted: string;
    /** A-13: theo từng ngày của chuyến (kể cả ngày 0 ₫). */
    byDay: Array<{ date: string; extraK: number; extraFormatted: string }>;
    /** A-13: theo loại, chỉ các loại đang có mục. */
    byType: Array<{ type: string; typeLabel: string; extraK: number; extraFormatted: string }>;
  };
  /** A-16: việc cần làm chưa xong, theo ngày rồi theo thứ tự trong ngày. */
  pendingTasks: Array<{ id: string; day: string; title: string; timeOfDay: string | null }>;
  trashCount: number;
}

export function getTripDetail(db: DatabaseSync, ownerId: string, tripId: string): TripDetail {
  const trip = requireTrip(db, ownerId, tripId);
  const rows = db
    .prepare('SELECT * FROM items WHERE trip_id = ? ORDER BY day_date, position, created_at, id')
    .all(tripId) as unknown as ItemRowDb[];
  const doneSet = new Set(
    (db.prepare('SELECT c.item_id FROM completions c JOIN items i ON i.id = c.item_id WHERE i.trip_id = ? AND c.person_id = ?').all(
      tripId,
      ownerId,
    ) as { item_id: string }[]).map((r) => r.item_id),
  );
  const liveByDay = new Map<string, ItemView[]>();
  let trashCount = 0;
  for (const r of rows) {
    if (r.deleted_at !== null) {
      trashCount++;
      continue;
    }
    const list = liveByDay.get(r.day_date) ?? [];
    list.push(toView(r, doneSet.has(r.id)));
    liveByDay.set(r.day_date, list);
  }
  const days = listDays(trip.startDate, trip.endDate).map((d) => ({ ...d, items: liveByDay.get(d.date) ?? [] }));
  const countable = rows.map((r) => ({
    type: r.type,
    day: r.day_date,
    costK: r.cost_k,
    included: r.included === 1,
    referenceK: r.reference_k,
    deletedAt: r.deleted_at,
  }));
  const extraK = totalExtraK(countable);
  const perDay = totalsByKey(countable, (i) => i.day);
  const perType = totalsByKey(countable, (i) => i.type);
  const liveTypes = new Set(rows.filter((r) => r.deleted_at === null).map((r) => r.type));
  const pendingTasks = days.flatMap((d) =>
    d.items.filter((i) => i.type === 'task' && !i.done).map((i) => ({ id: i.id, day: d.date, title: i.title, timeOfDay: i.timeOfDay })),
  );
  const { ownerIdentityId: _owner, ...publicTrip } = trip;
  return {
    trip: publicTrip,
    dayCount: days.length,
    days,
    totals: {
      extraK,
      extraFormatted: formatVndFromK(extraK),
      byDay: days.map((d) => ({ date: d.date, extraK: perDay.get(d.date) ?? 0, extraFormatted: formatVndFromK(perDay.get(d.date) ?? 0) })),
      byType: ITEM_TYPES.filter((t) => liveTypes.has(t)).map((t) => ({
        type: t,
        typeLabel: ITEM_TYPE_LABELS[t],
        extraK: perType.get(t) ?? 0,
        extraFormatted: formatVndFromK(perType.get(t) ?? 0),
      })),
    },
    pendingTasks,
    trashCount,
  };
}
