// T2: thư viện thành phần đạt kiểm truy cập tự động. Phạm vi KIỂM ĐƯỢC và KHÔNG kiểm được ghi ở design-system.md §9.
// Kiểm: vùng chạm ≥ 44, khoảng cách giữa vùng chạm nhỏ ≥ 8, tên truy cập có thật (aria-labelledby/describedby trỏ tới phần tử có chữ),
// chữ ≥ 12 px, không cuộn ngang, ảnh tải được, font thật nạp được, hover/focus nhìn thấy, giảm chuyển động, phím mũi tên của tab, giao diện tối.
export default {
  id: 'T2',
  title: 'thư viện thành phần: chạm, tên, chữ, hover/focus, giảm chuyển động, tối',
  size: 390,
  async run({ page, url, assert, newPage }) {
    await page.goto(url + '/components.html');
    await page.locator('.gal').waitFor();
    await page.waitForFunction(() => document.querySelectorAll('i[data-i]').length === 0);
    await page.evaluate(() => document.fonts.ready);

    const report = await page.evaluate(() => {
      const small = [], unnamed = [], badRef = [], tiny = [], tight = [];
      const targets = [...document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=tab], [role=switch]')].filter((el) => {
        const r = el.getBoundingClientRect();
        // mẫu .is-pressed bị thu 98% theo thiết kế (trạng thái tức thời), không đo kích thước nó
        return r.width > 0 && r.height > 0 && !el.matches('.is-pressed');
      });
      const boxOf = (el) => (el.matches('input[type=checkbox]') ? el.closest('.check-row') : el).getBoundingClientRect();
      const nameOf = (el) => {
        const aria = (el.getAttribute('aria-label') || '').trim();
        if (aria) return aria;
        const by = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean).map((i) => (document.getElementById(i)?.textContent ?? '').trim()).join(' ').trim();
        if (by) return by;
        const own = (el.textContent || '').trim();
        if (own) return own;
        return el.labels && el.labels.length ? 'label' : '';
      };
      const cls = (el) => (el.className && typeof el.className === 'string' ? el.className : el.tagName);
      for (const el of targets) {
        const r = boxOf(el);
        if (r.height < 43.5 || r.width < 43.5) small.push(cls(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
        for (const a of ['aria-labelledby', 'aria-describedby']) {
          for (const id of (el.getAttribute(a) || '').split(/\s+/).filter(Boolean)) {
            const t = document.getElementById(id);
            if (!t || !t.textContent.trim()) badRef.push(a + '->#' + id);
          }
        }
        if (!nameOf(el)) unnamed.push(cls(el));
      }
      for (let i = 0; i < targets.length; i++) {
        for (let j = i + 1; j < targets.length; j++) {
          const a = boxOf(targets[i]);
          const b = boxOf(targets[j]);
          if (a.width < 48 || a.height < 48 || b.width < 48 || b.height < 48) {
            const gx = Math.max(b.left - a.right, a.left - b.right);
            const gy = Math.max(b.top - a.bottom, a.top - b.bottom);
            const near = (gx < 0 && gy >= 0 && gy < 8) || (gy < 0 && gx >= 0 && gx < 8);
            // ngoại lệ có chủ ý: phân đoạn (.segmented) là MỘT điều khiển ghép, các nút nằm liền nhau trong cùng khung
            const sameSegmented = targets[i].closest('.segmented') && targets[i].closest('.segmented') === targets[j].closest('.segmented');
            if (near && !sameSegmented && !targets[i].contains(targets[j]) && !targets[j].contains(targets[i])) tight.push(cls(targets[i]) + ' | ' + cls(targets[j]) + ' (' + Math.round(Math.min(Math.abs(gx), Math.abs(gy))) + 'px)');
          }
        }
      }
      for (const el of document.body.querySelectorAll('*')) {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || el.closest('code')) continue;
        const px = parseFloat(getComputedStyle(el).fontSize);
        if (px < 11.99) tiny.push(el.tagName + '.' + cls(el) + ' ' + px + 'px');
      }
      return {
        small, unnamed, badRef, tiny, tight: [...new Set(tight)],
        overflow: document.documentElement.scrollWidth > window.innerWidth,
        badImg: [...document.images].filter((i) => !(i.complete && i.naturalWidth > 0)).length,
        fonts: document.fonts.check('16px "Be Vietnam Pro"') && document.fonts.check('700 22px "Baloo 2"'),
      };
    });
    assert.deepEqual(report.small, [], 'vùng chạm dưới 44 px: ' + report.small.join(', '));
    assert.deepEqual(report.unnamed, [], 'điều khiển không có tên truy cập: ' + report.unnamed.join(', '));
    assert.deepEqual(report.badRef, [], 'aria-labelledby/describedby trỏ tới phần tử không có hoặc rỗng: ' + report.badRef.join(', '));
    assert.deepEqual(report.tiny, [], 'chữ nhỏ hơn 12 px: ' + report.tiny.join(', '));
    assert.deepEqual(report.tight, [], 'hai vùng chạm cách nhau dưới 8 px: ' + report.tight.join(', '));
    assert.equal(report.overflow, false, 'không cuộn ngang ở 390 px');
    assert.equal(report.badImg, 0, 'mọi ảnh phải tải được');
    assert.equal(report.fonts, true, 'font Be Vietnam Pro và Baloo 2 phải nạp được (không dùng font dự phòng)');

    // Tab ngày: phím mũi tên đổi tab được chọn và chuyển focus
    await page.locator('#tab-2').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tab-3').getAttribute('aria-selected'), 'true', 'ArrowRight chọn tab kế');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-3', 'focus chuyển theo tab');

    // Focus bằng bàn phím nhìn thấy được
    await page.locator('#nut .btn.primary').first().focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement);
      return { w: parseFloat(s.outlineWidth), style: s.outlineStyle, shadow: s.boxShadow };
    });
    assert.ok((focus.style !== 'none' && focus.w >= 2) || focus.shadow !== 'none', 'focus bằng bàn phím phải nhìn thấy: ' + JSON.stringify(focus));

    // Giảm chuyển động: thời lượng chuyển ≈ 0
    const rm = await newPage({ reducedMotion: true });
    await rm.goto(url + '/components.html');
    const dur = await rm.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.btn.primary')).transitionDuration) * 1000);
    assert.ok(dur < 5, 'giảm chuyển động: transition phải ≈ 0 ms, đo được ' + dur + ' ms');

    // Máy tính + giao diện tối: hover đổi nền nút chính, nền tối đúng token
    const desk = await newPage({ size: 1280, scheme: 'dark' });
    await desk.goto(url + '/components.html');
    await desk.locator('.gal').waitFor();
    const btn = desk.locator('#nut .btn.primary').first();
    const before = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
    await btn.hover();
    await desk.waitForTimeout(300);
    const after = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.notEqual(before, after, 'hover phải đổi nền nút chính');
    const bg = await desk.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.equal(bg, 'rgb(21, 34, 61)', 'giao diện tối phải dùng nền tối (--bg), nhận được ' + bg);
  },
};
