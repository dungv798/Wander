import { COPY } from '../../../../shared/const/copy.vi.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';

interface SearchBoxProps {
  readonly value: string;
  readonly onChange: (q: string) => void;
  readonly className?: string;
}

/** Ô tìm điểm đến (có nhãn cho trình đọc màn hình; lọc theo từng ký tự, không cần nút gửi). */
export function SearchBox({ value, onChange, className }: SearchBoxProps) {
  return (
    <label className={['search', className].filter(Boolean).join(' ')}>
      <Icon name="compass" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={COPY.home.searchPlaceholder}
        autoComplete="off"
        aria-label={COPY.home.searchLabel}
      />
    </label>
  );
}
