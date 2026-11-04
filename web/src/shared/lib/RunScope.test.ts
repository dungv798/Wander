import test from 'node:test';
import assert from 'node:assert/strict';
import { RunCancelled, RunScope, smoothstep } from './RunScope.ts';

test('smoothstep: kẹp 0..1 và đúng ở giữa', () => {
  assert.equal(smoothstep(-1), 0);
  assert.equal(smoothstep(2), 1);
  assert.equal(smoothstep(0.5), 0.5);
});

test('wait: hết hạn thì tiếp tục khi lượt còn hiệu lực', async () => {
  const scope = new RunScope();
  const run = scope.begin();
  await run.wait(5);
  assert.equal(run.alive(), true);
});

test('mở lượt mới hủy việc đang chờ của lượt cũ (không để callback cũ chạy tiếp)', async () => {
  const scope = new RunScope();
  const old = scope.begin();
  let reachedAfterWait = false;
  const pending = old.wait(50).then(() => {
    reachedAfterWait = true;
  });
  scope.begin();
  await assert.rejects(pending, RunCancelled);
  assert.equal(reachedAfterWait, false);
  assert.equal(old.alive(), false);
});

test('cancel: việc chờ đang treo bị từ chối ngay, không đợi hết timer', async () => {
  const scope = new RunScope();
  const run = scope.begin();
  const started = Date.now();
  const waiting = run.wait(10_000);
  scope.cancel();
  await assert.rejects(waiting, RunCancelled);
  assert.ok(Date.now() - started < 1000);
});

test('start nuốt RunCancelled nhưng ném lại lỗi thật', async () => {
  const scope = new RunScope();
  const cancelled = scope.start(async (run) => {
    await run.wait(50);
  });
  scope.cancel();
  await cancelled;
  await assert.rejects(
    scope.start(async () => {
      throw new Error('hỏng thật');
    }),
    /hỏng thật/,
  );
});

test('until: chờ lời hứa ngoài rồi từ chối nếu lượt đã bị thay', async () => {
  const scope = new RunScope();
  const run = scope.begin();
  let release: () => void = () => undefined;
  const outside = new Promise<void>((resolve) => {
    release = resolve;
  });
  const waiting = run.until(outside);
  scope.begin();
  release();
  await assert.rejects(waiting, RunCancelled);
});
