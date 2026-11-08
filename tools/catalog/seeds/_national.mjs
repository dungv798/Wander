import { place } from './_lib.mjs';

/** Khung dữ liệu cho đợt mở rộng: chỉ khai báo mùa khi có nguồn; thời lượng là dự trù biên tập để xếp lịch. */
export function destination({ id, name, region, tagline, lat, lon, coverPlaceId, places, best = [], radiusKm = 100 }) {
  return { id, name, region, tagline, coverPlaceId, radiusKm,
    references: [{ id: `trung-tam-${id}`, name: `Mốc tham chiếu ${name}`, lat, lon, approximate: true }],
    season: { summary: 'Chọn thời điểm theo hoạt động, dự báo thời tiết và tình trạng mở cửa hoặc tuyến đi.', best, rainy: [], notes: ['Các tháng chưa được đánh dấu không có nghĩa là không thể đi.', 'Kiểm tra dự báo và xác nhận dịch vụ hoặc tuyến trước khi chốt chuyến.'] },
    packing: { summary: 'Chuẩn bị theo địa hình và hoạt động đã chọn.', items: ['Nước uống và vật dụng cá nhân', 'Giày phù hợp địa hình', 'Áo khoác hoặc áo mưa nhẹ', 'Sạc dự phòng'] },
    places,
  };
}

/** Địa điểm có nguồn địa lý qua pipeline; không tự tạo giá, giờ, đánh giá hoặc giấy phép. */
export function point(id, wiki, cat, area, hook, duration, extra = {}) {
  return place(id, wiki, cat, area, hook, 'worth', 'Gợi ý để khám phá theo sở thích và thời gian của bạn.', [], duration, { highlights: [], tips: ['Thời lượng là gợi ý xếp lịch; xác nhận tình trạng hoạt động và thông tin địa phương trước khi đi.'], ...extra });
}
