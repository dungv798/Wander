import { fill } from '../../../shared/const/copy.vi.ts';
import type { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';
import { CODE_FILE_NAME } from '../model/identity.const.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';

const REVOKE_URL_DELAY_MS = 4000;
const SECTION_BREAK = '\r\n\r\n';
const LINE_BREAK = '\r\n';

/** Nội dung tệp mã khôi phục tải về/in ra. */
export function codeFileText(code: RecoveryCode, now: Date = new Date()): string {
  return [C.code.fileTitle, code.format(), fill(C.code.fileCreated, { when: now.toLocaleString('vi-VN') }), C.code.fileKeep].join(SECTION_BREAK) + LINE_BREAK;
}

/** Sao chép chữ vào bộ nhớ tạm; trả false khi trình duyệt chặn (người dùng chép tay). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Tải mã về thành tệp .txt; trả false khi không tạo được tệp. */
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

/** Mở hộp thoại in cho mã (qua khung ẩn); trả false khi không in được. */
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
