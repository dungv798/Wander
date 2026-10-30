/** Đo nền pixel dưới các nét chữ đã ẩn, gồm nút kính và CTA trên hero video. */
export async function measureHeroContrast(page) {
  const boxes = await page.evaluate(() => {
    const selectors = ['.home-hero h1', '.home-hero-tagline', '.home-hero .search span', '.home-hero .btn', '.home-destination-switch', '.home-video-toggle'];
    return selectors.flatMap(selector => [...document.querySelectorAll(selector)].flatMap(el => {
      const text = [...el.childNodes].find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
      const range = document.createRange();
      if (text) range.selectNodeContents(text);
      const rect = text ? range.getBoundingClientRect() : el.getBoundingClientRect();
      return [{ selector, x: rect.x, y: rect.y, width: rect.width, height: rect.height, color: getComputedStyle(el).color }];
    }));
  });
  const hidden = await page.addStyleTag({ content: '.home-hero h1, .home-hero-tagline, .home-hero .search, .home-hero .btn, .home-destination-switch, .home-video-toggle { color:transparent !important; text-shadow:none !important } .home-hero svg, .home-destination-switch span { visibility:hidden !important }' });
  const screenshot = await page.screenshot();
  await hidden.evaluate(el => el.remove());
  return page.evaluate(async ({ data, boxes }) => {
    const image = new Image(); image.src = data; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    const luma = rgb => rgb.reduce((sum, c, i) => {
      const v = c / 255;
      return sum + (v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i];
    }, 0);
    return boxes.map(box => {
      const fg = luma(box.color.match(/[\d.]+/g).slice(0, 3).map(Number));
      let minimum = Infinity;
      const pixels = ctx.getImageData(Math.ceil(box.x + 4), Math.ceil(box.y + 4), Math.max(1, Math.floor(box.width - 8)), Math.max(1, Math.floor(box.height - 8))).data;
      for (let i = 0; i < pixels.length; i += 4) {
        const bg = luma([...pixels.slice(i, i + 3)]);
        minimum = Math.min(minimum, (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05));
      }
      return { selector: box.selector, minimum };
    });
  }, { data: `data:image/png;base64,${screenshot.toString('base64')}`, boxes });
}
