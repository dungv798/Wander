import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PendingTracker } from './PendingTracker.ts';
import type { Scheduler } from './PendingTracker.ts';

/** A fake timer: `advance(ms)` runs the due timers in time order; no real waiting needed. */
function fakeClock(): { readonly schedule: Scheduler; readonly advance: (ms: number) => void } {
  let now = 0;
  const jobs: { at: number; fn: () => void; live: boolean }[] = [];
  return {
    schedule: (fn, ms) => {
      const job = { at: now + ms, fn, live: true };
      jobs.push(job);
      return () => {
        job.live = false;
      };
    },
    advance: (ms) => {
      now += ms;
      for (const job of jobs) {
        if (job.live && job.at <= now) {
          job.live = false;
          job.fn();
        }
      }
    },
  };
}

test('lời gọi nhanh không bao giờ báo chậm; lời gọi treo quá ngưỡng thì báo, xong thì hết', () => {
  const clock = fakeClock();
  const tracker = new PendingTracker(1000, clock.schedule);
  const fast = tracker.begin();
  clock.advance(999);
  assert.equal(tracker.slow, false);
  fast();
  clock.advance(5000);
  assert.equal(tracker.slow, false);

  const hung = tracker.begin();
  clock.advance(999);
  assert.equal(tracker.slow, false, 'chưa tới ngưỡng');
  clock.advance(1);
  assert.equal(tracker.slow, true, 'đúng ngưỡng thì báo chậm');
  hung();
  assert.equal(tracker.slow, false);
});

test('nhiều lời gọi: còn báo chậm chừng nào còn một lời gọi quá hạn chưa xong', () => {
  const clock = fakeClock();
  const tracker = new PendingTracker(1000, clock.schedule);
  const a = tracker.begin();
  const b = tracker.begin();
  clock.advance(1000);
  assert.equal(tracker.slow, true);
  a();
  assert.equal(tracker.slow, true, 'b vẫn treo');
  b();
  assert.equal(tracker.slow, false);
});

test('kết thúc hai lần không làm đếm âm; người nghe chỉ được báo khi trạng thái đổi', () => {
  const clock = fakeClock();
  const tracker = new PendingTracker(1000, clock.schedule);
  let calls = 0;
  const unsubscribe = tracker.subscribe(() => {
    calls += 1;
  });
  const done = tracker.begin();
  assert.equal(calls, 0, 'bắt đầu chưa đổi gì');
  clock.advance(1000);
  assert.equal(calls, 1);
  done();
  done();
  assert.equal(calls, 2, 'kết thúc lần hai bị bỏ');
  assert.equal(tracker.slow, false);
  unsubscribe();
  tracker.begin();
  clock.advance(1000);
  assert.equal(calls, 2, 'đã hủy đăng ký');
});
