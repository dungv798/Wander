import fs from 'node:fs';

// Giữ nguyên công cụ look; chỉ chuyển nhật ký vào đường dẫn worker được sở hữu.
const writeFileSync = fs.writeFileSync;
fs.writeFileSync = function (file, ...args) {
  return writeFileSync(file === '.logs/ux-buttons/initial-js.json' ? '.logs/ux-video/v2/initial-js.json' : file, ...args);
};
