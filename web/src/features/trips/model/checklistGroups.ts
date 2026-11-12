import type { ChecklistItem } from '../../collab/index.ts';

/** A group of preparation items; an empty {@code group} means the items that have no group yet. */
export interface ChecklistGroup {
  readonly group: string;
  readonly items: readonly ChecklistItem[];
}

/**
 * Groups the checklist: groups in the order of first appearance of the item with the smallest position, items inside a group by position,
 * the empty group ('Other') last.
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
