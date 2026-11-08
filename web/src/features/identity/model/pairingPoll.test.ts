import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { IDENTITY } from './identity.const.ts';
import { PAIRING_POLL as P } from './pairingPoll.const.ts';
import { isRetryablePairingError, nextPairingDelay, startPairingPoll } from './pairingPoll.ts';
import type { PairingStatus } from './identity.types.ts';

test('chỉ mạng và HTTP 429 được tự thử im lặng; lỗi khác vẫn cần thông báo', () => {
  for (const error of [new ApiError('NETWORK'), new ApiError('RATE_LIMITED', 429), new ApiError('INTERNAL', 429)]) {
    assert.equal(isRetryablePairingError(error), true);
  }
  for (const error of [new ApiError('INVALID_ATTEMPT', 400), new ApiError('INTERNAL', 500), new Error('NETWORK'), null]) {
    assert.equal(isRetryablePairingError(error), false);
  }
});

test('mọi lần lỗi đều lùi nhịp gấp đôi và dừng ở trần', () => {
  let delay: number = IDENTITY.POLL_MS;
  assert.equal(nextPairingDelay(delay), 2000);
  for (let i = 0; i < 100; i++) delay = nextPairingDelay(delay);
  assert.equal(delay, P.MAX_DELAY_MS);
});

/** Đợi chuỗi await/catch/finally của một lượt mà không dùng giờ thật. */
async function settle(): Promise<void> { for (let i = 0; i < 12; i++) await Promise.resolve(); }

/** Tài liệu giả phát visibilitychange để kiểm vòng đời mà không cần DOM/React. */
class Visibility extends EventTarget {
  hidden = false;
  setHidden(value: boolean): void { this.hidden = value; this.dispatchEvent(new Event(P.VISIBILITY_EVENT)); }
}

/** Thu các tác động quan sát được của poll, tránh gọi mạng hay ghi bí mật phiên. */
function fixture(readStatus: (signal: AbortSignal) => Promise<PairingStatus> = async () => 'pending') {
  const visibility = new Visibility();
  const outcomes: string[] = [];
  const errors: unknown[] = [];
  let approvals = 0;
  let failures = 0;
  const options = {
    expiresAt: 20_000,
    readStatus,
    approved: async () => { approvals++; },
    finish: (outcome: 'denied' | 'expired') => { outcomes.push(outcome); },
    report: (error: unknown) => { errors.push(error); },
    joinFailed: () => { failures++; },
  };
  return { visibility, options, outcomes, errors, approvals: () => approvals, failures: () => failures };
}

test('yêu cầu chậm không gọi chồng; ẩn dừng hỏi, hiện tiếp tục, gỡ hủy HTTP và bỏ kết quả trễ', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  let calls = 0;
  let resolve!: (status: PairingStatus) => void;
  let signal!: AbortSignal;
  const f = fixture(s => { calls++; signal = s; return new Promise(r => { resolve = r; }); });
  const stop = startPairingPoll(f.options, f.visibility);
  t.mock.timers.tick(1000);
  t.mock.timers.tick(5000);
  f.visibility.setHidden(true);
  f.visibility.setHidden(false);
  assert.equal(calls, 1);
  resolve('pending'); await settle();
  f.visibility.setHidden(true);
  t.mock.timers.tick(5000);
  assert.equal(calls, 1);
  f.visibility.setHidden(false);
  t.mock.timers.tick(0);
  assert.equal(calls, 2);
  stop();
  assert.equal(signal.aborted, true);
  resolve('approved'); await settle();
  assert.equal(f.approvals(), 0);
  assert.deepEqual(f.errors, []);
});

test('lỗi mạng lùi nhịp, hiện lại vẫn giữ backoff; thành công khôi phục nhịp một giây', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  let calls = 0;
  const f = fixture(async () => { if (++calls === 1) throw new ApiError('NETWORK'); return 'pending'; });
  const stop = startPairingPoll(f.options, f.visibility);
  t.mock.timers.tick(1000); await settle();
  f.visibility.setHidden(true); f.visibility.setHidden(false);
  t.mock.timers.tick(1999); await settle();
  assert.equal(calls, 1);
  t.mock.timers.tick(1); await settle();
  assert.equal(calls, 2);
  t.mock.timers.tick(1000); await settle();
  assert.equal(calls, 3);
  assert.deepEqual(f.errors, []);
  stop();
});

test('lỗi khác lùi nhịp và chỉ báo một lần cho chuỗi cùng mã; gỡ màn ngừng hỏi', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  const error = new ApiError('INTERNAL', 500);
  let calls = 0;
  const f = fixture(async () => { calls++; throw new ApiError(error.code, error.status); });
  const stop = startPairingPoll(f.options, f.visibility);
  t.mock.timers.tick(1000); await settle();
  assert.deepEqual(f.errors, [error]);
  t.mock.timers.tick(1000); await settle();
  assert.equal(calls, 1);
  t.mock.timers.tick(1000); await settle();
  assert.equal(calls, 2);
  assert.deepEqual(f.errors, [error]);
  t.mock.timers.tick(4000); await settle();
  assert.equal(calls, 3);
  assert.deepEqual(f.errors, [error]);
  stop();
  t.mock.timers.tick(10000); await settle();
  assert.equal(calls, 3);
});

for (const error of [new ApiError('NETWORK'), new ApiError('RATE_LIMITED', 429), new ApiError('INTERNAL', 500), new ApiError('UNAUTHENTICATED', 401), new ApiError('NOT_FOUND', 404), new Error('unknown')]) {
  test(`lỗi ${error.message} lùi nhịp tới trần, kể cả khi không thuộc loại tự thử im lặng`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
    const times: number[] = [];
    const f = fixture(async () => { times.push(Date.now()); throw error; });
    f.options.expiresAt = 1_200_000;
    const stop = startPairingPoll(f.options, f.visibility);
    t.mock.timers.tick(1000); await settle();
    for (const wait of [2000, 4000, 8000, 16000, 30000, 30000]) {
      const calls = times.length;
      t.mock.timers.tick(wait - 1); await settle();
      assert.equal(times.length, calls);
      t.mock.timers.tick(1); await settle();
      assert.equal(times.length, calls + 1);
    }
    assert.deepEqual(times, [1000, 3000, 7000, 15000, 31000, 61000, 91000]);
    assert.equal(f.errors.length, isRetryablePairingError(error) ? 0 : 1);
    stop();
  });
}

test('đổi mã báo lại; poll thành công reset cả nhịp và bộ nhớ mã lỗi', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  const internal = new ApiError('INTERNAL', 500);
  const unauthenticated = new ApiError('UNAUTHENTICATED', 401);
  const sequence = [internal, internal, unauthenticated, internal, null, internal];
  let calls = 0;
  const f = fixture(async () => {
    const error = sequence[calls++];
    if (error) throw error;
    return 'pending';
  });
  f.options.expiresAt = 60_000;
  const stop = startPairingPoll(f.options, f.visibility);
  for (const wait of [1000, 2000, 4000, 8000, 16000]) {
    t.mock.timers.tick(wait); await settle();
  }
  assert.equal(calls, 5);
  assert.deepEqual(f.errors, [internal, unauthenticated, internal]);
  t.mock.timers.tick(999); await settle();
  assert.equal(calls, 5);
  t.mock.timers.tick(1); await settle();
  assert.equal(calls, 6);
  assert.deepEqual(f.errors, [internal, unauthenticated, internal, internal]);
  t.mock.timers.tick(1999); await settle();
  assert.equal(calls, 6);
  t.mock.timers.tick(1); await settle();
  assert.equal(calls, 7);
  stop();
});

for (const status of ['approved', 'denied', 'expired'] as const) {
  test(`trạng thái cuối ${status} dừng hỏi và chỉ xử lý một lần`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
    let calls = 0;
    const f = fixture(async () => { calls++; return status; });
    const stop = startPairingPoll(f.options, f.visibility);
    t.mock.timers.tick(1000); await settle();
    f.visibility.setHidden(true); f.visibility.setHidden(false);
    t.mock.timers.tick(30000); await settle();
    assert.equal(calls, 1);
    assert.equal(f.approvals(), status === 'approved' ? 1 : 0);
    assert.deepEqual(f.outcomes, status === 'approved' ? [] : [status]);
    stop();
  });
}

test('hết hạn trong lúc ẩn: hiện lại báo hết hạn, không hỏi máy chủ', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  let calls = 0;
  const f = fixture(async () => { calls++; return 'pending'; });
  f.visibility.hidden = true;
  const stop = startPairingPoll(f.options, f.visibility);
  t.mock.timers.tick(20001);
  f.visibility.setHidden(false);
  t.mock.timers.tick(0); await settle();
  assert.equal(calls, 0);
  assert.deepEqual(f.outcomes, ['expired']);
  stop();
});

test('nhận phiên thất bại báo lỗi và mở đường xin mã mới, không nhận lại tự động', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  const f = fixture(async () => 'approved');
  const error = new Error('join failed');
  f.options.approved = async () => { throw error; };
  const stop = startPairingPoll(f.options, f.visibility);
  t.mock.timers.tick(1000); await settle();
  assert.deepEqual(f.errors, [error]);
  assert.equal(f.failures(), 1);
  t.mock.timers.tick(10000); await settle();
  assert.equal(f.failures(), 1);
  stop();
});

test('HTTP treo vẫn hết hạn đúng lúc và bị hủy; kết quả approved trễ không nhận phiên', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  let signal!: AbortSignal;
  let resolve!: (status: PairingStatus) => void;
  const f = fixture(s => { signal = s; return new Promise(r => { resolve = r; }); });
  const stop = startPairingPoll(f.options, f.visibility);
  t.mock.timers.tick(1000);
  t.mock.timers.tick(19001);
  assert.equal(signal.aborted, true);
  assert.deepEqual(f.outcomes, ['expired']);
  resolve('approved'); await settle();
  assert.equal(f.approvals(), 0);
  assert.deepEqual(f.errors, []);
  stop();
});

test('dựng/gỡ/dựng như StrictMode bỏ kết quả và lỗi của vòng cũ', async t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 });
  let reject!: (error: unknown) => void;
  const old = fixture(() => new Promise((_resolve, fail) => { reject = fail; }));
  const stopOld = startPairingPoll(old.options, old.visibility);
  t.mock.timers.tick(1000);
  stopOld();
  const current = fixture(async () => 'approved');
  const stop = startPairingPoll(current.options, current.visibility);
  reject(new DOMException('cancelled', 'AbortError')); await settle();
  t.mock.timers.tick(1000); await settle();
  assert.deepEqual(old.errors, []);
  assert.equal(old.approvals(), 0);
  assert.equal(current.approvals(), 1);
  stop();
});
