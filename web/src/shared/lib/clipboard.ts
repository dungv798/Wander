/** Sao chép chữ vào bộ nhớ tạm; trả false khi trình duyệt chặn (người dùng chép tay). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
