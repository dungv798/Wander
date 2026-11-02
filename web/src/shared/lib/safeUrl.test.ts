import test from 'node:test';
import assert from 'node:assert/strict';
import { safeHttpUrl } from './safeUrl.ts';

test('chỉ nhận http và https', () => {
  assert.equal(safeHttpUrl('https://commons.wikimedia.org/wiki/File:A.jpg'), 'https://commons.wikimedia.org/wiki/File:A.jpg');
  assert.equal(safeHttpUrl('http://example.com'), 'http://example.com');
});

test('chặn javascript:, data:, chuỗi hỏng và rỗng', () => {
  assert.equal(safeHttpUrl('javascript:alert(1)'), undefined);
  assert.equal(safeHttpUrl('data:text/html,<script>1</script>'), undefined);
  assert.equal(safeHttpUrl('not a url'), undefined);
  assert.equal(safeHttpUrl(''), undefined);
  assert.equal(safeHttpUrl(undefined), undefined);
});
