import { useEffect, useState } from 'react';
import type { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';

/** Whether the tab/window is hidden (the code is blurred so a tab-switch screenshot or a preview image does not reveal the code). */
function useDocumentHidden(): boolean {
  const [hidden, setHidden] = useState(() => document.hidden);
  useEffect(() => {
    /** Updates the flag when the tab is shown/hidden. */
    const onChange = (): void => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return hidden;
}

/** The box that shows the recovery code: 6 groups x 5 symbols (3 groups per row), blurred when the tab is hidden. `label` is the label for screen readers. */
export function CodeBox({ code, label }: { readonly code: RecoveryCode; readonly label: string }) {
  const hidden = useDocumentHidden();
  return (
    <div className={hidden ? 'codebox blur' : 'codebox'} role="group" aria-label={label}>
      {code.groups.map((g, k) => (
        <span key={`${k}-${g}`}>{g}</span>
      ))}
    </div>
  );
}
