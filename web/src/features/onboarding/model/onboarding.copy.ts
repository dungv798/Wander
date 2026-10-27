/** Chữ của phần giới thiệu lần đầu (S14). Nội dung là BẢN NHÁP có nhãn; không số liệu, đánh giá hay giá tiền. */
export const ONBOARD_COPY = {
  steps: [
    { title: 'Có một nơi đang đợi bạn', text: '', cta: 'Tiếp', eyebrow: '' },
    { title: 'Quẹt phải là mê, quẹt trái là thôi', text: 'Mỗi thẻ là một nơi thật, có ảnh thật. Thích thì quẹt phải, chưa hợp thì quẹt trái.', cta: 'Tiếp', eyebrow: 'Bước 2 · Chọn nơi mê' },
    { title: 'Rồi lịch tự thành hình', text: 'Xếp nơi nào vào ngày nào, Wander gợi ý theo khoảng cách. Bạn chỉnh lại tùy ý.', cta: 'Bắt đầu khám phá', eyebrow: 'Bước 3 · Xếp lịch' },
  ],
  back: 'Quay lại',
  skip: 'Bỏ qua',
  progress: 'Bước {n} trên {total}',
  draft: 'Bản nháp nội dung',
  creditCover: 'Ảnh: {artist}',
  creditLicense: ' · {license}',
  creditOthers: 'Ảnh từ Wikimedia Commons; tác giả và giấy phép từng ảnh nằm ở nút ⓘ của mỗi địa điểm.',
  factBest: 'Đẹp nhất {months}',
  factCount: '{n} nơi đang chờ bạn quẹt',
  selected: 'Đã chọn',
  day: 'Ngày {n}',
  planDone: 'Lịch sẵn sàng. Bạn chỉnh được mọi lúc.',
  mapLabel: 'Bản đồ minh họa tuyến ngày 1',
} as const;
