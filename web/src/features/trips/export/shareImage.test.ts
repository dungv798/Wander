import test from 'node:test';
import assert from 'node:assert/strict';
import { canShareFiles, shareFile } from './shareImage.ts';

const FILE = new File([new Uint8Array([1, 2, 3])], 'chuyen-di.png', { type: 'image/png' });

test('không chia sẻ được khi thiếu navigator, thiếu share hoặc thiếu canShare', () => {
  assert.equal(canShareFiles([FILE], undefined), false);
  assert.equal(canShareFiles([FILE], {}), false);
  assert.equal(canShareFiles([FILE], { share: async () => undefined }), false);
  assert.equal(canShareFiles([FILE], { canShare: () => true }), false);
});

test('chia sẻ được khi hệ thống nhận tệp; hỏi canShare đúng danh sách tệp', () => {
  let asked: readonly File[] = [];
  const nav = { share: async () => undefined, canShare: (data: ShareData) => { asked = data.files ?? []; return true; } };
  assert.equal(canShareFiles([FILE], nav), true);
  assert.deepEqual(asked, [FILE]);
  assert.equal(canShareFiles([FILE], { share: async () => undefined, canShare: () => false }), false);
});

test('canShare ném lỗi thì coi như không chia sẻ được, không làm vỡ giao diện', () => {
  assert.equal(canShareFiles([FILE], { share: async () => undefined, canShare: () => { throw new Error('x'); } }), false);
});

test('shareFile: thành công, người dùng đóng bảng (AbortError) và lỗi khác được phân biệt', async () => {
  let received: ShareData | null = null;
  const ok = { share: async (data: ShareData) => { received = data; } };
  assert.equal(await shareFile(FILE, 'Đà Lạt', ok), 'shared');
  assert.deepEqual(received, { files: [FILE], title: 'Đà Lạt' });
  const aborted = { share: async () => { throw new DOMException('đóng', 'AbortError'); } };
  assert.equal(await shareFile(FILE, 'Đà Lạt', aborted), 'cancelled');
  const broken = { share: async () => { throw new DOMException('không được', 'NotAllowedError'); } };
  assert.equal(await shareFile(FILE, 'Đà Lạt', broken), 'failed');
  assert.equal(await shareFile(FILE, 'Đà Lạt', {}), 'failed');
});
