# DR-033 — Hoàn thiện sau trải nghiệm thật; nguồn dữ liệu OSM; lịch mẫu; tách CSDL e2e (PO, 02–03/11/2026)

- **Trạng thái:** `APPROVED` theo câu trả lời của PO qua `AskUserQuestion` trong phiên 02/11/2026 (hai lượt). Chỉ ghi lại lời PO; việc đã làm và việc chưa làm ở `docs/implementation/checkpoint-polish-2026-11-02.md`.

## Lượt 1 (phạm vi giao diện và thuật toán)
| Mục | PO chọn | Điều kiện PO nêu |
|---|---|---|
| U1 Home + tìm | **U1**: hai phạm vi tìm "Điểm đến" / "Địa điểm tại <thành phố>" | Chưa chọn thành phố thì hướng dẫn chọn, không mặc định Đà Lạt; đổi phạm vi giữ truy vấn hợp lý, hiện rõ đang tìm ở đâu; người đã có chuyến thấy "Tiếp tục chuyến" trước phần khám phá; dùng catalog hiện có, không đổi API/schema |
| S1 xếp lịch | **S1, bỏ ngưỡng cứng "2 nơi/ngày"** | Ưu tiên cụm địa lý và thời lượng có căn cứ; thiếu dữ liệu thì nói rõ giới hạn; không cố chia đủ mọi ngày; preview cho chỉnh, áp dụng, Hoàn tác; không gọi là tối ưu |
| Dữ liệu 12 nơi | Phương án riêng: cả 12 nơi, ưu tiên Tà Xùa, Hội An, Vĩnh Hy, Hà Giang | Không quota; mọi bản ghi có nguồn và trạng thái kiểm chứng; tách biên tập đáng tin khỏi POI tham khảo; báo độ phủ từng nơi |
| X2 | Xuất ảnh hai kiểu bằng canvas hiện có; ăn/nghỉ ở mọi ngày; lịch mẫu 4 nơi | Lịch mẫu KHÔNG bắt buộc 2 ngày, tùy nơi; ghi điểm xuất phát/kết thúc, phương tiện giả định, nhịp; nhãn "Lịch trình tham khảo"; không cần duyệt thêm nếu đạt điều kiện; chưa đủ căn cứ thì giữ nháp |

## Lượt 2 (03/11/2026)
| Mục | PO chọn | Điều kiện PO nêu |
|---|---|---|
| D — nguồn dữ liệu | **D-A: cho phép OpenStreetMap làm nguồn bổ sung** | Tên/tọa độ từ OSM, mô tả ngắn do Wander biên tập, lưu nguồn và ghi công; không bắt buộc có bài Wikipedia hay ảnh; thiếu ảnh thì dùng placeholder theo loại, không dùng ảnh phong cảnh khác; trạng thái kiểm chứng lưu trong dữ liệu, UI dùng nhãn "Thông tin tham khảo" (không phơi mã); kiểm trùng địa điểm/tọa độ/loại/điểm tiếp cận trước khi dùng; phân biệt "chưa xác minh hiện trạng" với "chưa xác minh vị trí" (điểm chưa chắc vị trí không vào lịch mẫu hay tính hành trình); dữ liệu thiếu căn cứ không viết thành lời khuyên khẳng định; không dịch vụ trả phí, không dependency mới |
| L — lịch mẫu | **L-A**: hoàn thiện dữ liệu rồi viết lịch trong cùng phạm vi, không chờ duyệt thêm | "Đủ dữ liệu" theo khả năng dựng hành trình hợp lý, không theo quota; 2–7 điểm vẫn đủ cho lịch ngắn nếu đúng vị trí; không nhồi các cụm Hà Giang vào hai ngày; thiếu căn cứ thì giữ nháp, báo thiếu gì |
| T — dữ liệu e2e | **T-A: tách CSDL e2e** | Database riêng trên PostgreSQL hiện có; có kiểm tra để e2e từ chối chạy khi trỏ nhầm DB dev; seed/reset/cleanup chỉ tác động DB test và chứng minh dữ liệu dev không đổi; dữ liệu thử đã lẫn trong dev chỉ **liệt kê bằng chứng**, không tự xóa/suy đoán; không đổi schema nghiệp vụ |

## Đã làm cho mục T (bằng chứng)
- `tools/dev.ps1`: `Reset-E2eDb` dựng lại CSDL `wander_e2e` (từ chối nếu tên khác); `E2E` đặt `WANDER_DB_URL` trỏ `wander_e2e` và từ chối nếu URL không khớp.
- `web/e2e/backend.ts`: ném lỗi khi thiếu `WANDER_E2E_DB=wander_e2e` (đã chạy thử: từ chối khi thiếu biến).
- Số dòng CSDL dev trước/sau một lần `dev.ps1 e2e`: `.logs/polish/dev-db-counts-before.txt` và `dev-db-counts-after.txt`.
- Danh sách bằng chứng dữ liệu thử đang lẫn trong dev (chỉ đọc): `.logs/polish/dev-db-fixture-evidence.txt`. Ví dụ nhận diện được chắc chắn: lời bình dạng `Quán hơi đông <số ms>` do `rating.e2e.test.ts`; tên chuyến `Hà Giang - mẫu` (1.160 dòng) trùng dữ liệu mẫu `seed.ts`. KHÔNG xóa: dữ liệu thật của PO có thể nằm cùng bảng.

## Lượt 3 (03/11/2026): ảnh thật và địa điểm chưa có ảnh (PO)
- **Trạng thái:** `APPROVED` theo chỉ dẫn của PO (đoạn giao việc về ảnh). Làm song song hai việc; thay ảnh bằng placeholder KHÔNG được coi là hoàn thành yêu cầu dữ liệu.
- **Cho phép `photos` rỗng** + fallback frontend; địa điểm bìa của điểm đến vẫn phải có ảnh (Home dùng làm bìa).
- **Tách dựng địa điểm khỏi tìm ảnh:** địa điểm đủ căn cứ (tọa độ có nguồn) được nhập dù chưa có ảnh; ảnh có pipeline riêng chạy lại được, không ghi đè nội dung biên tập hay ảnh đã tuyển.
- **Pipeline ảnh** (Wikidata P18/P373, danh mục Commons, tìm Commons theo tên, geosearch): geosearch CHỈ tạo danh sách ứng viên, không tự gắn ảnh gần nhất; chấp nhận JPEG/PNG/WebP/TIFF, cạnh ngắn ≥ 700 px và cạnh dài ≥ 1000 px (không kéo giãn); không còn loại ảnh theo một tỷ lệ chung; kiểm giấy phép từng tệp (CC BY, CC BY-SA, CC0, Public domain; loại NC/ND); tuyển bằng contact sheet nhìn tận mắt; chỉ THÊM ảnh đã duyệt.
- **Chưa làm / hạn chế (nói thẳng):** lưu điểm crop và vai trò cover riêng chưa có chỗ trong schema catalog (cover = ảnh đầu, thứ tự gallery = thứ tự mảng); giới hạn gallery của backend đã là 8 ảnh/nơi (`MAX_PHOTOS_PER_PLACE`), bộ dựng cũ tự giữ 3 ảnh.

## Lượt 4 (03/11/2026): hoàn thiện trọn phạm vi trong một phiên (PO: "đừng đợi tôi phải nhắn")
Việc đã làm theo D-A, L-A, T-A và đoạn giao việc về ảnh; chi tiết số liệu ở checkpoint.
- **Nơi OSM nhập tay có kiểm soát** (`tools/catalog/import-osm-places.mjs` + `osm-additions/<dest>.json`): Hà Giang +13, Tà Xùa +1. Tên/tọa độ từ OSM, mô tả chỉ nêu dữ kiện; duration/difficulty = "Chưa rõ" (xếp lịch đếm riêng là thiếu thời lượng); vị trí ghi OSM_UNVERIFIED ở `docs/research/osm-additions/<dest>.json`.
- **Vị trí chưa chắc không vào lịch trình tham khảo:** mọi nơi OSM-only của Hà Giang/Tà Xùa bị loại khỏi lịch; Hội An chỉ dùng các nơi trong phố cổ nằm trong ~1 km quanh mốc Wikipedia đã kiểm (Phố cổ, Chùa Cầu) và trùng tên với ảnh Commons đã duyệt.
- **Lịch trình tham khảo** (trạng thái mới `reference`, nhãn "Lịch trình tham khảo"): Hội An 3, Vĩnh Hy 2, Tà Xùa 2, Hà Giang +1 (4 ngày). Mỗi ngày ghi điểm xuất phát/kết thúc, phương tiện giả định, nhịp; khoảng cách là chim bay (ước tính); không hứa giờ mở cửa/giá/thời gian đường. Không nhồi cụm Hà Giang vào hai ngày; độ dài tùy nơi.
- **Ăn uống/cà phê/nghỉ (POI OSM, chưa xác minh hiện trạng):** `tools/catalog/poi-pipeline.mjs` cho Hội An, Vĩnh Hy, Tà Xùa, Hà Giang (tâm Đồng Văn, bán kính tối đa 15 km của backend nên chỉ phủ quanh Đồng Văn). Backend nới quy tắc: tâm POI trùng MỘT mốc tham chiếu (trước đây chỉ mốc đầu).
- **Ảnh:** tuyển bằng contact sheet nhìn mắt; loại ảnh sai nơi (Nhà cổ Phùng Hưng, Pháo đài Đồn Cao, Chợ Hà Giang, Du Già...), và ảnh nhạy cảm lẫn trong kết quả theo tọa độ (hộ chiếu, thẻ ngân hàng ở Mèo Vạc) bị loại tuyệt đối.
