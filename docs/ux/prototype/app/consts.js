/* Hằng số giao diện của prototype: chuỗi và con số dùng chung hoặc dùng lại, để app.js không rải "số ma thuật" và chữ cứng.
   Quy ước (khớp .claude/rules/frontend.md): tên IN HOA theo nhóm, đóng băng (Object.freeze), không có logic ở đây.
   Nạp TRƯỚC app.js (index.html). Mã mới của prototype lấy chữ/số từ đây; mã cũ trong app.js chuyển dần khi chạm tới. */
window.WANDER_UI = Object.freeze({
  /* Id địa điểm dùng làm ảnh/minh họa ở các màn mở đầu (id có thật trong kho biên tập). */
  PLACE: Object.freeze({
    COVER: "hoang-su-phi",
    PASS: "deo-ma-pi-leng",
    RIVER: "song-nho-que",
    FLAG: "cot-co-lung-cu",
    OLD_TOWN: "pho-co-dong-van",
    PLATEAU: "cao-nguyen-da",
    HIGHLIGHTS: Object.freeze(["deo-ma-pi-leng", "hoang-su-phi", "cot-co-lung-cu", "cao-nguyen-da", "dinh-vuong"])
  }),

  /* Điểm lấy nét của ảnh bìa trên khung ngắn: cắt bớt trời trống, giữ phần có nội dung. */
  FOCAL: Object.freeze({ "hoang-su-phi": "50% 78%" }),

  /* Onboarding: ba cảnh. Lịch mẫu ở cảnh 3 chỉ ghép các nơi có thật theo cặp gần nhau, không nêu giờ hay giá. */
  ONBOARD: Object.freeze({
    SCENES: Object.freeze(["invite", "swipe", "plan"]),
    SWIPE_DEMO: Object.freeze(["cot-co-lung-cu", "song-nho-que", "pho-co-dong-van"]),
    PLAN_DEMO: Object.freeze([
      Object.freeze({ label: "Ngày 1", places: Object.freeze(["cot-co-lung-cu", "pho-co-dong-van"]) }),
      Object.freeze({ label: "Ngày 2", places: Object.freeze(["deo-ma-pi-leng", "song-nho-que"]) })
    ])
  }),

  /* Trang chủ: ảnh chạy ở thẻ giữa và nhãn "ghim" nổi. */
  HOME: Object.freeze({
    LIVE_CARD: Object.freeze(["deo-ma-pi-leng", "cot-co-lung-cu", "song-nho-que", "pho-co-dong-van"]),
    PINS: Object.freeze([
      Object.freeze({ id: "cot-co-lung-cu", cls: "p1" }),
      Object.freeze({ id: "deo-ma-pi-leng", cls: "p2" })
    ]),
    FAN: Object.freeze(["cao-nguyen-da", "deo-ma-pi-leng", "hoang-su-phi"]),
    WALL: Object.freeze(["deo-ma-pi-leng", "hoang-su-phi", "song-nho-que", "cot-co-lung-cu", "pho-co-dong-van", "cao-nguyen-da"]),
    MONTH_LIMIT: 5
  }),

  /* Lịch mẫu (bản nháp biên tập): ghép từ địa điểm có thật trong kho, theo cặp gần nhau; không nêu giờ hay giá. */
  TEMPLATES: Object.freeze([
    Object.freeze({ id: 'cao-nguyen-da-2n', title: 'Cao nguyên đá trong 2 ngày', note: 'Ngày 1 đi dọc Quản Bạ, Đồng Văn tới cột cờ Lũng Cú; ngày 2 đèo Mã Pì Lèng và sông Nho Quế.', days: Object.freeze([Object.freeze(['cong-troi-quan-ba', 'dinh-vuong', 'pho-co-dong-van', 'cot-co-lung-cu']), Object.freeze(['deo-ma-pi-leng', 'song-nho-que'])]) }),
    Object.freeze({ id: 'mot-ngay-dong-van', title: 'Một ngày ở Đồng Văn', note: 'Cao nguyên đá, phố cổ rồi lên cột cờ Lũng Cú.', days: Object.freeze([Object.freeze(['cao-nguyen-da', 'pho-co-dong-van', 'cot-co-lung-cu'])]) }),
    Object.freeze({ id: 'mien-tay-2n', title: 'Miền Tây Hà Giang', note: 'Tây Côn Lĩnh rồi ruộng bậc thang Hoàng Su Phì.', days: Object.freeze([Object.freeze(['tay-con-linh']), Object.freeze(['hoang-su-phi'])]) })
  ]),

  /* Chữ (tiếng Việt) dùng ở nhiều chỗ hoặc dài. */
  COPY: Object.freeze({
    OB_SWIPE: "Mỗi thẻ là một nơi thật, có ảnh thật. Thích thì quẹt phải, chưa hợp thì quẹt trái.",
    OB_PLAN: "Xếp nơi nào vào ngày nào, Wander gợi ý theo khoảng cách. Bạn chỉnh lại tùy ý.",
    OB_PLAN_DONE: "Lịch sẵn sàng. Bạn chỉnh được mọi lúc.",
    HOME_TAGLINE: "Quẹt nơi mê, đi cho đã.",
    HOME_HOOKS: Object.freeze(["Quẹt nơi mê, đi cho đã.", "{dest} đang gọi tên bạn.", "Chọn nơi mê. Wander gợi ý lịch giúp bạn.", "Quẹt một cái, thêm một chỗ muốn đến."]),
    HOME_TEMPLATES: "Lịch mẫu cho bạn",
    HOME_MOODS: "Bạn đang mê gì?",
    HOME_MONTH: "Nên đi tháng này",
    DEST_PEEK: "Xem trước các nơi",
    SKIP_CODE_NOTE: "Chưa có mã khôi phục thì mất máy là mất chuyến đi và không lấy lại được. Bạn tạo mã lúc nào cũng được ở mục Bảo mật.",
    NO_CODE_BAR: "Chưa có mã khôi phục: mất máy là mất chuyến đi. Tạo mã ở mục Bảo mật.",
    SKIP_CODE_SAVED: "Đã lưu chuyến đi. Bạn chưa có mã khôi phục: tạo mã ở mục Bảo mật."
  })
});
