/** Bộ đếm "chỉ kết quả của lần gọi mới nhất được dùng": mỗi lần gọi lấy một số phiếu, kết quả mang phiếu cũ thì bị bỏ (tránh đua). */
export class LatestOnly {
  private latest = 0;

  /** Bắt đầu một lần gọi mới và trả phiếu của nó; mọi phiếu trước đó hết hiệu lực. */
  begin(): number {
    this.latest += 1;
    return this.latest;
  }

  /** Phiếu này còn là của lần gọi mới nhất không. */
  isCurrent(ticket: number): boolean {
    return ticket === this.latest;
  }
}
