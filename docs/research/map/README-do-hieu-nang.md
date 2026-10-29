# Chạy và đọc phép đo Map Lab

Đứng tại `D:\Wander`. **Lệnh đo trên máy có mạng và GPU thật:**

```powershell
node web/spike/map-lab/run.mjs --measure --headed --dpr2
```

Không sửa `package.json`. Dùng Node hiện có, `playwright-core` từ dependency gốc, `maplibre-gl` từ `web/node_modules` và Chrome đã cài. Không tải browser/ảnh mẫu/dependency từ mạng trong bước chuẩn bị. Mạng khi đo dùng để lấy style/vector/glyph/sprite/DEM công khai đã cấu hình.

Nếu Chrome ở nơi khác, đặt `MAP_LAB_CHROME` trỏ đến executable đã cài trong shell hiện tại; script tự tìm Chrome ở Program Files trên Windows, hoặc `/usr/bin/google-chrome`/`chromium` trên Linux. Không dùng browser cloud. Kết quả nằm trong `web/spike/map-lab/.logs/<UTC>/result.json`, ảnh cùng thư mục. Script in đường dẫn và trả exit khác 0 khi FAIL/INVALID.

## Chạy trước khi benchmark

```powershell
node --test web/spike/map-lab/route.test.mjs
node web/spike/map-lab/run.mjs
npm --prefix web run lint
```

Lệnh thứ hai là **smoke offline**, chặn request ngoài origin của trang map; không phải đo chất lượng tile. Có CSS probe hai giao diện classic/roameo và ba viewport. **Hiện smoke còn FAIL** (xem §Trạng thái thực tế), cần gỡ trước khi lấy kết quả tương tác làm bằng chứng. Không coi exit 0 của unit hoặc lint là smoke đã pass.

Xem trang bằng tay:

```powershell
node web/spike/map-lab/run.mjs --serve
```

Mở `http://127.0.0.1:4317/` khi có mạng, hoặc `http://127.0.0.1:4317/?offline=1&city=da-lat&variant=B`. Có bộ chọn A/B/C và Đà Lạt/Hà Nội/Hội An. Ctrl+C dừng server. Trang chỉ lưu thứ tự trong bộ nhớ, reload phục hồi catalog. Kéo tay nắm/↑↓; bật “Sắp xếp trên bản đồ” để thử kéo ghim tới ghim đích; tọa độ không được đổi. Chạm ghim/đoạn mở preview 80×80 và nút mở chi tiết. Tuyến minh họa chim bay, không phải điều hướng đường thật.

## Ma trận mặc định

| Chiều đo | Giá trị |
|---|---|
| City | Đà Lạt 14 ghim, Hà Nội 13, Hội An 5; tuyến 5 điểm đầu |
| A | Liberty, ảnh symbol 44 CSS px từ WebP 96×96, cluster native; không DEM |
| B | A + đổi màu có chọn lọc theo token Nắng vàng; không DEM |
| C | B + Terrarium/hillshade + terrain 1,15, pitch 35°, bearing −12°, extrusion từ chiều cao có thật |
| Repeat/cache | 3 lần × cold context rồi warm reload = **54 hàng**, mỗi hàng pan/zoom/fly |
| Viewport | 1365×900, mặc định DPR 1; `--dpr2` đặt DPR 2 |
| Mobile layout | `--mobile`: 390×844; vẫn là Chrome desktop, **không thay kiểm tra điện thoại thật** |
| Nhanh | `--quick`: chỉ Đà Lạt, 1 lần/cấu hình, vẫn cold/warm; dùng kiểm wiring, không đủ kết luận |

`--headed` cần thiết cho phép đo đề nghị. Không thêm cờ ép SwiftShader, tắt GPU hoặc né lỗi renderer để tạo kết quả đẹp. Giữ tab ở trước, không thu nhỏ cửa sổ, đóng DevTools khi đo rAF; giữ nguồn điện/refresh rate/thermal ổn định. Ghi tay model GPU, màn hình Hz, loại mạng và throttling nếu có bên cạnh kết quả. Script ghi Chrome, Node, OS/CPU/RAM, config, renderer/vendor và DPR/canvas.

Các context mới không bảo đảm cache đĩa OS/CDN hay shader cache lạnh. “Cold” ở đây nghĩa context/trang mới; “warm” là reload cùng context, không phải nguồn GeoJSON/GPU giữ nguyên trong cùng Map. Tài nguyên cục bộ dùng `Cache-Control:no-cache`; cache tile ngoài do server quyết định. Không so hai máy/lần mạng khác nhau như A/B tuyệt đối. A/B không có hillshade production; muốn chứng minh giảm lag so với app cũ phải đo app trên cùng máy/camera/workload riêng.

## Ý nghĩa trường kết quả

- `status`: PASS chỉ nghĩa runner hoàn tất và các hàng qua kiểm kỹ thuật; **không tự chấm đạt ngân sách, chất lượng hình hay tương tác**. FAIL/INVALID không được đưa vào bảng xếp hạng.
- `results[].valid`: không lỗi map/page/request, không HTTP ≥400, initial idle và idle sau cử chỉ không timeout, có frame mẫu. Lỗi ảnh/tile bị chặn không được coi là nền thành công chỉ vì `idle` đã phát.
- `hardwareGpuCandidate`: false khi thiếu renderer hoặc tên chứa SwiftShader/llvmpipe/software/Basic Render. True chỉ là ứng viên; cần đối chiếu `chrome://gpu` và driver trên máy đo, không phải chứng nhận tăng tốc phần cứng.
- `initial.initMs`: từ khi module app bắt đầu tới khi nguồn/layer/ảnh ghim sẵn sàng và idle; không phải navigation start hay LCP. `initial.initialIdle.ms` chỉ phần chờ idle cuối khởi tạo, không phải tổng thời gian tải.
- `gestures[].p50/p95/p99`: **ms giữa callback rAF**, nearest-rank. Không phải GPU render time. Delta đầu bị bỏ; `frames` giữ mẫu thô, `sampleCount` phải đủ (đề nghị ≥30 mỗi pha), `over50ms` đếm khoảng >50 ms. Không diễn giải p95 từ 5 frame.
- Pan gồm chuột kéo 30 bước trong khoảng 1,4 s; zoom gồm 6 đợt wheel; fly dùng thời lượng 900 ms. Có overhead Playwright/timer. Dừng recorder cuối cửa sổ cử chỉ; inertia/tile đến muộn có thể rơi ngoài cửa sổ. `idleAfterGesture.ms` đo riêng, không trộn frame nghỉ vào phân vị.
- `domNodes`, `mapDomNodes`: tại cuối pha; chỉ đếm DOM, không đo worker heap, texture hay GPU memory. Không dùng DOM ít làm bằng chứng CPU/GPU chắc nhanh.
- `final.graphics/dpr/pixelRatio/canvas`: đối chiếu backing pixels và CSS viewport; terrain/DPR2 có thể tăng tải. `reducedMotion` được ghi; benchmark đặt no-preference, smoke dùng reduce.
- `resources`: Resource Timing theo navigation; `transferSize`, `encodedBodySize` có thể bằng 0 vì cache **hoặc thiếu Timing-Allow-Origin**, không kết luận không tốn băng thông. Byte GPU texture không nằm trong đó. Nếu cần byte mạng chuẩn, ghi DevTools Network/CDP riêng và giữ file đo; chưa có trong runner này.
- `screenshot`: ảnh sau chuỗi cử chỉ. Cần so cùng camera/zoom để đánh giá style; ảnh tự động này chưa thay thế bộ ảnh QA zoom 12/15/17. Offline screenshot không có tile thật.

Với mỗi city/variant/cache/gesture, báo cả 3 p95, median của 3 p95 và lần tệ nhất; không gộp cold/warm hoặc tất cả pha thành một p95. Đề nghị cổng thử **p95 ≤33,3 ms, p99 ≤50 ms** từng pha; warm initial ≤2 s, cold ≤5 s trên mạng ghi rõ. Đây là ngưỡng đề xuất, chưa phải con số đã đạt hay tiêu chuẩn PO phê duyệt. 16,7 ms tương ứng chu kỳ 60 Hz lý tưởng; màn 120 Hz phải diễn giải theo tần số thực tế.

## Kiểm tương tác và ảnh

Đọc kết quả `cssProbe` riêng với `smoke`. Probe dựng DOM tối thiểu và dùng CSS production liên quan, không mount React app. Smoke kiểm cụm mở rộng, click pin/đoạn, pointer reorder danh sách/canvas, ↑, ảnh preview trước/sau zoom, dialog/Esc, mobile layout và recorder. Nếu fail sớm, các kiểm phía sau **chưa chạy**, không tự ghi PASS từ việc thấy hàm test tồn tại.

Trên app thật cần bổ sung E2E: mở PlaceSheet từ pin ở zoom 8/12/17, đo gallery và preview trước/sau zoom, đổi viewport, chuyển ảnh bằng phím/kéo; kiểm Rest/Task, thay ngày, rollback/API 409, quyền sửa, hủy drag và reduce-motion. Không có test backend trong spike.

## Trạng thái thực tế ngày 29/10/2026

| Lệnh/kết quả đã đọc | Log |
|---|---|
| `npm --prefix web run lint`: exit 0 sau globals | `.logs/lint-after.log`; lần cuối xem `.logs/lint-final.log` |
| `node --test web/spike/map-lab/route.test.mjs`: exit 0, **5/5** | `.logs/unit-current.log` |
| `node web/spike/map-lab/run.mjs`: exit 1 vòng 3 | `.logs/smoke-cycle3.log`, `.logs/2026-10-29T07-09-48-106Z/result.json` |
| CSS probe hoàn tất trước smoke: classic 390×292,5 hoặc 560×320; roameo 126×188 ở cả ba viewport | Cùng JSON vòng 3, `cssProbe` |
| 32 thumbnail, nguồn 11.102.724 byte, WebP 110.038 byte tổng | Cùng JSON, `thumbnails`; chi tiết `thumbnails/manifest.json` |
| `--measure --headed --dpr2`: **NOT_RUN**, cần mạng/GPU thật | Không có số đo tile được công bố trong phiên này |

Tất cả đường log tương đối với `web/spike/map-lab/`. Không dùng log từ job trước làm kết quả mới.

**Việc còn lại trước benchmark:** smoke có assertion nhận `quang-truong-lam-vien` thay `ho-xuan-huong`, cần xác định pha chọn ghim hay reorder và overlay/tọa độ hit-test; hiện JSON chưa giữ stack của lần lỗi đó. Runner đã được bổ sung lưu stack cho lần sau, chưa chạy lại. Dừng sửa runtime sau ba vòng theo skill `wander-debug`; không làm yếu assertion để tạo PASS. Claude có thể chạy lại smoke có stack để xử lý đúng điểm hỏng, rồi mới chạy ma trận có mạng. Giá/điều khoản/provider URL trong tài liệu giải pháp cần xác minh trực tuyến trước quyết định Tầng A.
