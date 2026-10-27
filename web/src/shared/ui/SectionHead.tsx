import type { ReactNode } from 'react';

interface SectionHeadProps {
  readonly title: string;
  /** Nhãn hoặc nút bên phải tiêu đề. */
  readonly right?: ReactNode;
}

/** Tiêu đề một khối trên trang: tên khối + (tùy chọn) nhãn/nút bên phải. */
export function SectionHead({ title, right }: SectionHeadProps) {
  return (
    <div className="sec-head">
      <h2 className="h2">{title}</h2>
      {right}
    </div>
  );
}
