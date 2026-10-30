import fs from 'node:fs';

/** Thu frame từ Chrome của app thật rồi mã hóa VP8 trong canvas trình duyệt; không tải binary. */
export async function startCapture(browser, page) {
  const encoder = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await encoder.setContent('<canvas width="390" height="844"></canvas>');
  await encoder.evaluate(() => {
    const canvas = document.querySelector('canvas');
    window.videoChunks = [];
    window.recorder = new MediaRecorder(canvas.captureStream(25), { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 1100000 });
    window.recorder.ondataavailable = event => { if (event.data.size) window.videoChunks.push(event.data); };
    window.recorder.start();
  });
  await page.bringToFront();
  const cdp = await page.context().newCDPSession(page);
  let tail = Promise.resolve();
  let frames = 0;
  cdp.on('Page.screencastFrame', frame => {
    tail = tail.then(async () => {
      await encoder.evaluate(async data => {
        const image = new Image(); image.src = `data:image/jpeg;base64,${data}`; await image.decode();
        document.querySelector('canvas').getContext('2d').drawImage(image, 0, 0, 390, 844);
      }, frame.data);
      frames++;
      await cdp.send('Page.screencastFrameAck', { sessionId: frame.sessionId });
    });
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 390, maxHeight: 844, everyNthFrame: 1 });
  return async file => {
    await cdp.send('Page.stopScreencast'); await tail;
    const data = await encoder.evaluate(async () => {
      await new Promise(resolve => { window.recorder.onstop = resolve; window.recorder.stop(); });
      const blob = new Blob(window.videoChunks, { type: 'video/webm' });
      return await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.readAsDataURL(blob); });
    });
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    await encoder.close();
    return { frames, bytes: fs.statSync(file).size, encoder: 'Chrome CDP screencast → MediaRecorder VP8' };
  };
}
