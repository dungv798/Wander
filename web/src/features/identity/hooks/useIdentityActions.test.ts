import test from 'node:test';
import assert from 'node:assert/strict';
import type { IdentityGateway } from '../api/IdentityGateway.ts';
import { IDENTITY } from '../model/identity.const.ts';
import { createIdentityActions } from './useIdentityActions.ts';
import type { IdentityActionDeps } from './useIdentityActions.ts';

/** Builds the actions on a gateway whose calls succeed and counts how many times the snapshot is reloaded. */
function build(): { actions: ReturnType<typeof createIdentityActions>; reloads: () => number } {
  let reloads = 0;
  const gateway = { revoke: async () => undefined, confirmReplacement: async () => undefined } as unknown as IdentityGateway;
  const deps = {
    gateway,
    sessionKv: { update: () => undefined },
    locksKv: { update: () => undefined },
    deviceName: () => 'Test',
    refresh: async () => { reloads += 1; },
  } as unknown as IdentityActionDeps;
  return { actions: createIdentityActions(deps), reloads: () => reloads };
}

test('thu hồi thiết bị: tải lại ngay, rồi tải lại thêm đúng các nhịp để bắt sự kiện bảo mật ghi trễ', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { actions, reloads } = build();
  await actions.revoke('device-1');
  assert.equal(reloads(), 1);
  let elapsed = 0;
  let expected = 1;
  for (const ms of IDENTITY.EVENT_SETTLE_MS) {
    t.mock.timers.tick(ms - elapsed);
    elapsed = ms;
    expected += 1;
    assert.equal(reloads(), expected);
  }
  t.mock.timers.tick(60_000);
  assert.equal(reloads(), 1 + IDENTITY.EVENT_SETTLE_MS.length);
});

test('xác nhận mã khôi phục mới cũng tải lại thêm vì có sự kiện bảo mật', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { actions, reloads } = build();
  await actions.confirmReplacement('pending-1', 'CODE');
  t.mock.timers.tick(10_000);
  assert.equal(reloads(), 1 + IDENTITY.EVENT_SETTLE_MS.length);
});
