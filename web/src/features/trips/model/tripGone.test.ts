import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { isTripGone } from './tripGone.ts';

test('404 NOT_FOUND khi đọc lại chuyến nghĩa là mình không còn trong chuyến (bị gỡ hoặc chuyến đã xóa)', () => {
  assert.equal(isTripGone(new ApiError('NOT_FOUND', 404)), true);
});

test('lỗi mạng, 401, 500 hay lỗi lạ KHÔNG bị coi là mất chuyến (không được đá người dùng ra khỏi chuyến vì rớt mạng)', () => {
  assert.equal(isTripGone(new ApiError('NETWORK')), false);
  assert.equal(isTripGone(new ApiError('UNAUTHENTICATED', 401)), false);
  assert.equal(isTripGone(new ApiError('INTERNAL', 500)), false);
  assert.equal(isTripGone(new Error('x')), false);
  assert.equal(isTripGone(null), false);
});
