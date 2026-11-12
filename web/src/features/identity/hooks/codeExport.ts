import { fill } from '../../../shared/const/copy.vi.ts';
import type { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';
import { CODE_FILE_NAME } from '../model/identity.const.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';

const REVOKE_URL_DELAY_MS = 4000;
const SECTION_BREAK = '\r\n\r\n';
const LINE_BREAK = '\r\n';

/** The content of the recovery-code file to download/print. */
export function codeFileText(code: RecoveryCode, now: Date = new Date()): string {
  return [C.code.fileTitle, code.format(), fill(C.code.fileCreated, { when: now.toLocaleString('vi-VN') }), C.code.fileKeep].join(SECTION_BREAK) + LINE_BREAK;
}

/** Downloads the code as a .txt file; returns false when the file cannot be created. */
export function downloadCode(code: RecoveryCode): boolean {
  try {
    const url = URL.createObjectURL(new Blob([codeFileText(code)], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = CODE_FILE_NAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_URL_DELAY_MS);
    return true;
  } catch {
    return false;
  }
}

/** Opens the print dialog for the code (through a hidden frame); returns false when it cannot be printed. */
export function printCode(code: RecoveryCode): boolean {
  try {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;';
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    if (!doc) return false;
    doc.title = C.code.printHeading;
    const h = doc.createElement('h1');
    h.textContent = C.code.printHeading;
    const p = doc.createElement('p');
    p.textContent = code.format();
    p.style.cssText = 'font:700 28px ui-monospace,Consolas,monospace;letter-spacing:.05em';
    const note = doc.createElement('p');
    note.textContent = C.code.fileKeep;
    doc.body.append(h, p, note);
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), REVOKE_URL_DELAY_MS);
    return true;
  } catch {
    return false;
  }
}
