// Chọn iPhone ảo cho workflow ios-safari-sim: đọc `xcrun simctl list devices available -j` từ stdin, in UDID ra stdout.
// Ưu tiên đúng tên trong biến DEVICE (bản iOS mới nhất), rồi iPhone "Pro" mới nhất, rồi bất kỳ máy iOS nào có sẵn.
import fs from 'node:fs';
import path from 'node:path';

/** Số phiên bản từ khóa runtime, ví dụ "…SimRuntime.iOS-18-2" → [18, 2]; dùng để so "mới hơn". */
export function runtimeVersion(runtime) {
  return (runtime.split('iOS-')[1] ?? '').split('-').map(Number).filter(Number.isFinite);
}

/** So hai phiên bản dạng mảng số, mới hơn đứng trước. */
function newestFirst(a, b) {
  for (let i = 0; i < Math.max(a.version.length, b.version.length); i++) {
    const diff = (b.version[i] ?? 0) - (a.version[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Trả UDID của máy được chọn từ danh sách `devices` của simctl; ném lỗi nếu không có máy iOS nào. */
export function pickDevice(devicesByRuntime, wantedName) {
  const pool = Object.entries(devicesByRuntime)
    .filter(([runtime]) => runtime.includes('iOS-'))
    .flatMap(([runtime, list]) => list.filter((d) => d.isAvailable !== false).map((d) => ({ name: d.name, udid: d.udid, version: runtimeVersion(runtime) })))
    .sort(newestFirst);
  const pick = pool.find((d) => d.name === wantedName) ?? pool.find((d) => d.name.includes('iPhone') && d.name.includes('Pro')) ?? pool[0];
  if (!pick) throw new Error('Không có máy ảo iOS nào sẵn sàng');
  return pick.udid;
}

// Chạy như lệnh (không chạy khi test import): argv[1] là chính tệp này.
if (path.basename(process.argv[1] ?? '') === 'pick-device.mjs') {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  process.stdout.write(pickDevice(input.devices, process.env.DEVICE ?? '') + '\n');
}
