/** Đang chạy ở chế độ phát triển (vite dev). Các nút "BẢN THỬ" thay cho thiết bị khác chỉ hiện khi true; bản dựng thật không có. */
export const IS_DEV: boolean = Boolean(import.meta.env?.DEV);
