import type { ChecklistItem } from '../../collab/index.ts';

/** Một nhóm hạng mục chuẩn bị; {@code group} rỗng là các hạng mục chưa có nhóm. */
export interface ChecklistGroup {
  readonly group: string;
  readonly items: readonly ChecklistItem[];
}

/**
 * Gom checklist theo nhóm: nhóm theo thứ tự xuất hiện đầu tiên của hạng mục nhỏ vị trí nhất, hạng mục trong nhóm theo vị trí,
 * nhóm rỗng ("Khác") xếp cuối.
 */
export function groupChecklist(items: readonly ChecklistItem[]): ChecklistGroup[] {
  const sorted = [...items].sort((a, b) => a.position - b.position);
  const order: string[] = [];
  const byGroup = new Map<string, ChecklistItem[]>();
  for (const item of sorted) {
    if (!byGroup.has(item.group)) {
      byGroup.set(item.group, []);
      order.push(item.group);
    }
    byGroup.get(item.group)?.push(item);
  }
  const named = order.filter((g) => g !== '');
  const ordered = byGroup.has('') ? [...named, ''] : named;
  return ordered.map((group) => ({ group, items: byGroup.get(group) ?? [] }));
}
