/** Chỉ đợi ảnh thật sự nhìn thấy trong lớp đang mở, kể cả cắt bởi panel/rail; không đợi ảnh lazy ở ngoài khung. */
export function visibleReviewImagesReady() {
  const dialogs = [...document.querySelectorAll('[role="dialog"]')];
  const scope = dialogs.at(-1) ?? document;
  return [...scope.querySelectorAll('img')].filter(image => {
    // Nội dung details đang đóng có thể còn rect trong layout nhưng browser cố ý chưa tải ảnh lazy đó.
    if (image.checkVisibility && !image.checkVisibility()) return false;
    const box = image.getBoundingClientRect();
    let left = Math.max(0, box.left), right = Math.min(innerWidth, box.right);
    let top = Math.max(0, box.top), bottom = Math.min(innerHeight, box.bottom);
    if (getComputedStyle(image).visibility === 'hidden') return false;
    for (let parent = image.parentElement; parent && right > left && bottom > top; parent = parent.parentElement) {
      const style = getComputedStyle(parent), clip = parent.getBoundingClientRect();
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) { left = Math.max(left, clip.left); right = Math.min(right, clip.right); }
      if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) { top = Math.max(top, clip.top); bottom = Math.min(bottom, clip.bottom); }
    }
    return right > left && bottom > top;
  }).every(image => image.complete && image.naturalWidth > 0);
}
