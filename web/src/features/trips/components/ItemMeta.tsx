import { fill } from '../../../shared/const/copy.vi.ts';
import { FORMAT } from '../../../shared/const/format.const.ts';
import { formatVnd } from '../../../shared/domain/Money.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import type { TripItem } from '../model/trip.types.ts';
import { isPlain } from '../model/tripMath.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

/** Số tiền hiển thị đầy đủ VND từ nghìn đồng. Dùng cho cả TỔNG (có thể vượt trần 1 mục 1.000.000.000), nên không đi qua `Money` vốn chặn trần. */
export function money(k: number): string {
  return formatVnd(k * FORMAT.VND_PER_THOUSAND);
}

/** Các chip thông tin của một mục: giờ · thời lượng, chi phí (đã bao gồm / giá / chưa biết giá), đã đặt chỗ. Nghỉ và Việc cần làm không có giá. */
export function ItemMeta({ item }: { readonly item: TripItem }) {
  const dur = item.durationMin !== null ? fill(T.row.minutes, { n: item.durationMin }) : '';
  const time = [item.timeOfDay ?? '', dur].filter(Boolean).join(' · ');
  const priced = !isPlain(item.type);
  if (!time && !priced) return null;
  return (
    <div className="mrow">
      {time ? (
        <span className="mchip">
          <Icon name="clock" size="s" />
          {time}
        </span>
      ) : null}
      {priced && item.included ? (
        <span className="mchip">
          <Icon name="check" size="s" />
          {item.referenceK !== null ? fill(T.row.includedRef, { money: money(item.referenceK) }) : T.row.included}
        </span>
      ) : null}
      {priced && !item.included && item.costK !== null ? (
        <span className="mchip money">
          <Icon name="coin" size="s" />
          {money(item.costK)}
        </span>
      ) : null}
      {priced && !item.included && item.costK === null ? (
        <span className="mchip unk">
          <Icon name="coin" size="s" />
          {T.row.unknownPrice}
        </span>
      ) : null}
      {priced && item.booking === 'booked' ? (
        <span className="mchip cat-canh tint">
          <Icon name="ticket" size="s" />
          {T.row.booked}
        </span>
      ) : null}
    </div>
  );
}
