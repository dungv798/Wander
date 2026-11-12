import test from 'node:test';
import assert from 'node:assert/strict';
import { safeHttpUrl, safeLinkUrl } from './safeUrl.ts';

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

test('safeLinkUrl: nhận http(s) và đường dẫn cùng nguồn bắt đầu bằng một dấu /, chặn //host, /+dấu gạch ngược+host, javascript: và data:', () => {
  assert.equal(safeLinkUrl('https://example.com/a'), 'https://example.com/a');
  assert.equal(safeLinkUrl('/catalog/photos/a.jpg'), '/catalog/photos/a.jpg');
  for (const bad of ['//evil.example/x', '/' + String.fromCharCode(92) + 'evil.example', 'javascript:alert(1)', 'data:text/html,1', 'catalog/a.jpg', '', undefined, null]) {
    assert.equal(safeLinkUrl(bad), undefined, String(bad));
  }
});
