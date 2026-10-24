import { useState } from 'react';
import type { ReactNode } from 'react';

export function ErrorText({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p className="error" role="alert">
      {text}
    </p>
  );
}

export function CodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="codebox">
      <code data-testid="code" aria-label="Mã">
        {code}
      </code>
      <button
        type="button"
        className="secondary"
        onClick={() => {
          void navigator.clipboard?.writeText(code).then(() => setCopied(true));
        }}
      >
        {copied ? 'Đã chép' : 'Chép mã'}
      </button>
    </div>
  );
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="card">
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}

export function formatDateVi(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function shortDateVi(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}
