import type { ReactNode } from 'react';

interface SectionHeadProps {
  readonly title: string;
  /** A label or a button to the right of the title. */
  readonly right?: ReactNode;
}

/** The title of a block on a page: the block name + (optional) a label/button on the right. */
export function SectionHead({ title, right }: SectionHeadProps) {
  return (
    <div className="sec-head">
      <h2 className="h2">{title}</h2>
      {right}
    </div>
  );
}
