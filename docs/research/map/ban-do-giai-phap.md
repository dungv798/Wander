# Giải pháp bản đồ Wander

Ngày khảo sát mã: **29/10/2026**. Phạm vi: nghiên cứu + tiếp tục spike, **không sửa `web/src`**, không đổi quyết định hay thêm dependency. Đây là khuyến nghị, chưa phải quyết định PO.

## 1. Kết luận để ra quyết định

Ưu tiên **B: nền Liberty đổi paint theo token Wander + ghim/cluster native**, sau khi kiểm chứng tương tác và đo trên GPU thật. A là mốc đối chứng đơn giản; C là tùy chọn địa hình sau cùng, không bật mặc định chỉ để bản đồ “hiện đại”. Giữ thư viện MapLibre và nguồn nền đã duyệt trong ADR-015, ưu tiên chức năng có sẵn của chúng thay vì tự viết bộ chiếu, cluster hay renderer mới.

**Chưa chứng minh cấu hình nào mượt/đẹp nhất.** Không có tile thật trong phiên này. Spike có kiểm tra tương tác còn đỏ; không được đưa thẳng vào sản phẩm. Các mục §7–8 là lộ trình và cổng nghiệm thu, không phải tuyên bố đã đạt.

Phân biệt ba lớp: **dữ liệu** quyết định đường/phố/chiều cao có tồn tại; **style** quyết định màu/nhãn; **renderer và overlay** quyết định cách vẽ/tương tác. Đổi nhà cung cấp style không tự chữa lỗi gallery hoặc CPU chạy lại ghim HTML.

## 2. Bằng chứng và giới hạn

| Mã | Bằng chứng đọc/chạy trong phiên này | Ý nghĩa |
|---|---|---|
| E1 | `web/src/shared/map/{GeoMap.ts,MapLayers.ts,TerrainMapView.tsx,map.const.ts,map.css,mapStyle.ts}`; các hàm ghi dưới đây | Cấu trúc hiện hành, sự kiện, kích thước và nguồn DEM |
| E2 | `web/src/shared/map/{geoRouteLayer.ts,geoRoute.ts,map.types.ts}`; `features/trips/components/{TripMap.tsx,ItemRow.tsx}`; `hooks/tripsActions.ts::moveItem` | Tuyến GL, cung minh họa, cổng tương tác và cách lưu thứ tự |
| E3 | `features/discover/components/{PlaceSheet.tsx,place/PlaceGallery.tsx,place/PlaceBody.tsx}`, `hooks/useGallery.ts`, `model/{mapMarkers.ts,destinationQueries.ts}`, `shared/ui/Sheet.tsx` | Ảnh chi tiết tách khỏi cây camera; thumbnail đang dùng cùng URL ảnh đầu |
| E4 | `styles/{base.css,adaptive.css,appearance.css,tokens.css}`, `app/styles.css`; CSS probe trong `.logs/2026-10-29T07-09-48-106Z/result.json` dưới spike | Đo gallery của cả classic và giao diện mới, không phải E2E React |
| E5 | `web/node_modules/maplibre-gl/dist/maplibre-gl.d.ts`; `web/package.json`; ADR-015 | API native/phiên bản đang cài; ADR là bằng chứng quyết định và số đo lịch sử, không phải phép đo mới |
| E6 | `web/spike/map-lab/.logs/{lint-after.log,unit-current.log,smoke-cycle3.log}` cùng JSON ở E4; `thumbnails/manifest.json` | Lint xanh lần đầu, unit 5/5, smoke FAIL; 32 thumbnail từ catalog thật |

Mọi URL ở §4–5 là **địa chỉ chính thức cần Claude xác minh**, lập danh mục ngày 29/10/2026; **chưa truy cập mạng/không có ngày đọc trực tuyến**. Giá, quota, endpoint, giấy phép hiện hành và chất lượng tile Việt Nam đều `UNVERIFIED`. Không dùng địa chỉ trong bảng như bằng chứng đã đọc trang.

## 3. Chẩn đoán từng triệu chứng

### 3.1. Lag và animation

`GeoMap.createMap` gọi `layers.place` trên **mọi `move`**. `MapLayers.place` chiếu và ghi `transform` cho mọi marker, kể cả marker bị ẩn trong cluster, rồi cụm, nhãn ghim và nhãn đoạn. Nhãn đoạn còn `querySelector` theo từng đoạn. `moveend` gọi `layout`, tính cụm và dựng lại nhãn. Đây là công việc JS/DOM bổ sung ngoài render GL (E1).

Không nên gọi mọi `move` là “layout thrash”: đường đi này chủ yếu ghi `transform`. Điểm gây forced layout thấy rõ hơn ở `placePinLabels`: append từng nhãn rồi đọc `offsetWidth/offsetHeight` trong cùng vòng. Khi camera dừng, chu kỳ ghi–đọc có thể ép tính layout. Chưa có trace CPU nên mức đóng góp vào lag thực tế là **giả thuyết có căn cứ, chưa định lượng**.

`MapLayers.pinBody` nhận `m.thumb`; `mapMarkers` và `TripMap` đưa `firstPhotoUrl`, hàm này trả ảnh đầu nguyên URL. Không có bước resize trong chuỗi FE đã đọc. Manifest đo nguồn cục bộ: **11.102.724 byte ảnh đầu → 110.038 byte cho 32 WebP 96×96**. Đây là tổng bộ ảnh nguồn, không phải số byte mà mọi phiên người dùng chắc chắn tải. Ảnh CSS thu nhỏ không làm giảm dữ liệu tải hay kích thước giải mã.

**Hướng sửa:** GeoJSON source + cluster tích hợp + symbol ảnh qua `addImage`; giữ DOM cho thẻ và danh sách truy cập bằng bàn phím. `setData` khi dữ liệu/thứ tự đổi, không khi camera di chuyển. Không chuyển toàn bộ UI vào canvas: nút/list/chi tiết vẫn cần tên truy cập, focus và Esc.

### 3.2. “Giấy cũ”, “144p”

- **Đã xác nhận:** nền là style Liberty lấy qua URL, không phải một ảnh raster nền phóng to; nguồn DEM là `raster-dem`, `encoding: terrarium`, ô 256, `maxzoom:12`. `GeoMap` nhìn từ trên xuống, tắt xoay; màu style gốc gần như giữ nguyên. Nhãn HTML chỉ 12,5 px, nhãn đoạn 11,5 px (E1).
- **Đã xác nhận:** hillshade hiện tại **đã là layer native MapLibre trên raster-dem**, không phải overlay ảnh bóng núi tự dựng. Terrain thay đổi hình học mặt đất; hillshade chỉ tô sáng/tối. Không gọi chuyển sang native hillshade là một cải tiến chưa có.
- **Chưa xác nhận:** DPR bị sai, canvas bị CSS stretch, tile nền thiếu chi tiết ở Việt Nam, font/glyph tải lỗi hoặc quá nhiều lớp khiến ảnh trông mờ. Cần đối chiếu `devicePixelRatio`, `getPixelRatio()`, canvas backing size và CSS size ở cùng camera; xem Network và ảnh chụp zoom 12/15/17.
- DEM z12 được dùng ở camera z17 không sinh thêm độ cao chi tiết; cảm giác địa hình mềm có thể hợp lý, nhưng không giải thích toàn bộ nhãn/đường mờ. Không đổi `tileSize` từ 256 sang 512 nếu nguồn thực sự vẫn trả ô 256. Vector không có “độ phân giải 144p” như video, song vẫn có giới hạn dữ liệu/glyph và chất lượng hiển thị.

`GeoMap.createMap` không override `pixelRatio`, `maxTileCacheSize` hay `fadeDuration`. API cục bộ có các tùy chọn đó (E5). **Không mặc định ép DPR=1 để che lag**, không phóng DPR vô hạn để chữa mờ. DPR cao tăng số pixel gần theo bình phương, cache lớn tăng bộ nhớ; fade thấp có thể bớt chuyển tiếp nhưng làm nhãn bật đột ngột. Chỉ thử từng biến trên cùng thiết bị sau khi có mốc A/B/C; spike hiện giữ mặc định các tùy chọn này.

### 3.3. Ảnh chi tiết “phóng theo bản đồ”

Không tìm thấy phép nhân zoom vào ảnh trong mã đã đọc. `.tm-pin-body img` dùng 100% của thân ghim 44×44; `.is-sel` scale thân 1,2 lần, **không phụ thuộc zoom**. Không có selector tổng quát `.tm-pin img` tràn sang gallery. `Sheet` dùng `createPortal(..., document.body)`; gallery không là con của phần tử camera. `PlaceBody` dựng thông tin, không scale ảnh. `useGallery` điều khiển cuộn và bước ảnh, không đọc map zoom (E1/E3).

**Nguyên nhân có bằng chứng cho ảnh chi tiết lớn ở classic:** `.gallery img` trong `base.css` có `flex:0 0 100%`, `width:100%`, `aspect-ratio:4/3`, `max-height:320px`, `object-fit:cover`; panel desktop có thể rộng 560 px. CSS probe đo **390×292,5** ở viewport 390 và **560×320** ở 800/1365. Đây là thiết kế ảnh theo panel, không phải rò transform camera.

**Trạng thái mã hiện tại:** các chỉnh sửa sẵn có của chủ khác trong `appearance.css` và `tokens.css` đã đặt ảnh giao diện mới **126×188**, `object-fit:contain`. Probe cùng phiên xác nhận kích thước này ở cả ba viewport. Không nhận công sửa này; không ghi đè. Probe chỉ cô lập DOM/CSS liên quan, chưa tái hiện cả app, drawer, thao tác zoom hay build mà PO từng xem. **Quan hệ “zoom làm phóng ảnh chi tiết” vẫn UNVERIFIED**; cần E2E app thật trước khi đóng lỗi.

Diff đề nghị sau khi được giao sửa sản phẩm: giữ portal của `Sheet`; thẻ chọn ảnh **80×80 CSS px** bên ngoài canvas; gallery dùng token kích thước riêng, thêm `width/height` hoặc khung dự trữ và kích thước intrinsic phù hợp; `useGallery.step` đo bước thật như mã hiện tại. Không thêm rule toàn cục `img { width:... }`, không gắn style thẻ vào `.tm-pin`.

### 3.4. Tuyến không tương tác

`geoRouteLayer.addRouteLayers` tạo halo + line GL; `setRouteLines` gán **`properties:{}`** cho từng feature. `GeoMap` không đăng ký hit-test/callback đoạn; `TerrainMapView` và `MapRoute` cũng chưa có `onSegment`/metadata. `geoRoute.arcBetween` dựng cung cong giữa tọa độ, không bám mạng đường. Nhãn km là HTML `pointer-events:none`. Vì vậy tuyến thiếu cả dữ liệu lẫn cổng tương tác, không phải do dùng SVG (E2).

Ghim **đã có click**: `syncMarkers` nối `onPin`; `TripMap` truyền `openItem`. Không kết luận tất cả ghim đều không bấm được từ lời mô tả triệu chứng. Cần tái hiện ghim cụ thể/overlay đang che. `ItemRow` có ↑/↓, `moveItem` gọi `gateway.reorderDay`; không có thư viện kéo-thả trong `web/package.json`. Kéo trực tiếp chưa có trong đường mã đã đọc.

## 4. So sánh nền và phong cách

Tác động GPU/băng thông dưới đây là suy luận kiến trúc từ loại dữ liệu, chưa có phép đo tile thật. Hạng ưu tiên phục vụ bước tiếp theo, không phải benchmark thắng/thua.

| Phương án | Cảm giác và nhãn Việt Nam | Hiệu năng/độ khó | Giấy phép, key, quota, rủi ro và nguồn cần đọc |
|---|---|---|---|
| **1. B – Liberty theo token Wander** | Nền ấm nhẹ, nước xanh dịu, chữ mực, ghim ảnh và tuyến cam nổi; giữ casing đường và filter. Ưu tiên `name:vi → name:latin → name`; trường có thật trong tile hay không chưa biết | Khó thấp; dùng cùng vector, thay paint không tự giảm số layer/tile. Ít chi phí hình học hơn terrain | Trong hướng MapLibre/OpenFreeMap của ADR-015; không thêm nhà cung cấp. Vẫn giữ attribution OSM/OpenFreeMap/OpenMapTiles. Kiểm giấy phép style khi phân phối bản sửa: [OpenFreeMap](https://openfreemap.org/), [styles](https://github.com/hyperknot/openfreemap/tree/main/styles) |
| **2. A – Liberty nguyên phong cách** | Mốc đối chứng đọc đường rõ, nhưng vẫn có cảm giác atlas. Đổi overlay có thể làm hiện đại hơn mà chưa đổi nền | Khó thấp; A không DEM trong spike, giúp tách chi phí địa hình | ADR-015 ghi công cộng không key, không SLA; điều khoản hiện tại chưa xác minh. [Quick start](https://openfreemap.org/quick_start/) |
| OpenFreeMap Bright | Ứng viên nền nhiều thông tin/đường; cần chụp đúng ba điểm đến để so độ rối và dấu Việt | Thấp nếu endpoint tương thích; cùng nguồn không bảo đảm cùng chi phí: số symbol/layer khác nhau | Tên/endpoint/giấy phép hiện hành `UNVERIFIED`; không suy ra `/styles/bright` chắc hoạt động từ tên. Dùng danh sách chính thức ở link trên |
| OpenFreeMap Positron | Ứng viên nền trung tính để ảnh/tuyến nổi; cần thử độ tương phản với Nắng vàng | Thấp; chưa đo số layer, mức zoom, glyph | Như Bright; xác minh attribution/style license riêng, không chỉ giấy phép renderer |
| OpenFreeMap Fiord và style khác | Ứng viên khảo sát theo yêu cầu brief; **chưa xác nhận được có trong public catalog**; chưa nhận xét đẹp/xấu như đã nhìn thấy | Chưa đánh giá; chỉ thử khi xác nhận có endpoint chính thức | Cùng nguồn OpenFreeMap; không tự sáng tác URL hay thêm cấu hình hỏng vào prototype |
| **3. C – B + terrain/hillshade + nhà 3D** | Pitch 35°, bearing −12°, địa hình phóng nhẹ 1,15. Chỉ tạo nhà khi có `render_height`, thiếu thì 0; giữ nhãn/ghim hướng viewport | Khó vừa; DEM thêm request, texture và lưới; pitch thấy thêm vùng bản đồ; extrusion tăng hình học/overdraw. Có thể không đáng chi phí trên điện thoại | Dùng nguồn AWS Terrarium đã duyệt; cập nhật giấy phép tập dữ liệu/attribution trước phát hành. [AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/), [MapLibre terrain](https://maplibre.org/maplibre-gl-js/docs/examples/3d-terrain/) |
| Protomaps + PMTiles tự host | Kiểm soát style và bản dữ liệu Việt Nam; dữ liệu thiếu tên Việt/đường không được PMTiles tự bổ sung | Khó cao; archive + HTTP Range/CDN/cache/CORS, version và cập nhật dữ liệu; ít file vận hành nhưng vẫn tải tile theo vùng. Không hứa rẻ hơn khi chưa đo egress | **Tầng A:** hosting, chi phí và adapter/dependency mới. Mã, style, font và dữ liệu có license riêng; không đồng nhất PMTiles với giấy phép OSM. [Protomaps docs](https://docs.protomaps.com/), [PMTiles](https://docs.protomaps.com/pmtiles/) |
| MapTiler Cloud | Ứng viên style hoàn chỉnh; thử chữ Việt, địa hình, ảnh vệ tinh nếu PO thực sự muốn; chưa nhìn bản thực tế | Tích hợp vừa; vector/raster/DEM là các ngân sách khác nhau | **Tầng A:** key/allowed origins, quota theo sản phẩm, điều kiện gói miễn phí và cá nhân/thương mại, attribution, overage. Không ghi quota/giá chưa đọc. [Giá](https://www.maptiler.com/cloud/pricing/), [điều khoản](https://www.maptiler.com/terms/) |
| Stadia Maps | Ứng viên style có sẵn; không bảo đảm nhãn Việt hay phủ Việt Nam tốt hơn chỉ từ thương hiệu | Vừa; so cùng loại vector, không so raster 256 với vector rồi quy mọi khác biệt cho renderer | **Tầng A:** kiểm auth theo domain/key, quyền dùng gói cá nhân, hạn mức, attribution/font. [Giá](https://stadiamaps.com/pricing/), [docs](https://docs.stadiamaps.com/), [điều khoản](https://stadiamaps.com/terms-of-service/) |
| VersaTiles | Ứng viên hệ sinh thái tile/style mở hoặc tự host; phải thử đúng schema | Vừa–cao; tự host tăng vận hành, nguồn/schema không tương thích cần đổi style | **Tầng A** nếu đổi dịch vụ/host. Phân biệt license mã với dữ liệu, font, public hosting và chính sách truy cập; “mở” không có nghĩa miễn phí/SLA vô hạn. [Trang chính thức](https://versatiles.org/), [mã nguồn](https://github.com/versatiles-org) |

**Cách kiểm chất lượng Việt Nam:** cùng camera ở hồ Xuân Hương/đường Đà Lạt, hồ Hoàn Kiếm/phố nhỏ Hà Nội, Chùa Cầu/phố cổ Hội An; zoom 12/15/17; DPR 1/2; kiểm tên đường, dấu Việt, cầu, ngõ, water/park, building height. Ghi feature `name:*` thực tế và ảnh chụp. Không dùng tên ghim catalog để kết luận basemap có `name:vi`. Nếu đổi schema, adapter phải cập nhật `source-layer`, trường tên và chiều cao. Kiểm tên Việt trên cả fallback rỗng và thiếu glyph.

## 5. Tương tác tuyến và phương án routing

**Pattern đề nghị:** một state thứ tự ID cho cả map và danh sách. Mỗi đoạn có ID hai đầu mút, `from/to/day`, loại khoảng cách, km/phút, trạng thái tải và provenance. Vẽ line, halo và **hit line rộng 28 px**, ưu tiên pin/cluster trước đoạn, query feature bằng API native. Thẻ có ảnh 80×80, tên, giờ hoặc “chưa đặt”, đoạn tới và nút mở chi tiết. Tăng vùng hit có thể chồng tuyến; ưu tiên đoạn đang chọn/ngày đang xem, không mở hai thẻ cùng click.

Spike triển khai các phần trên, mũi tên `symbol-placement:line` và danh sách ↑/↓ theo pattern sẵn có. Kéo tay nắm danh sách và chế độ kéo ghim tới ghim khác chỉ đổi ID, **không đổi tọa độ**. Có `pointercancel`/mất capture để trả lại điều khiển camera. Phần kéo trên canvas còn `UNVERIFIED` do smoke chưa đạt. Giữ danh sách ↑/↓ làm đường truy cập bằng bàn phím; native canvas pin không thay thế danh sách có tên và focus.

Tích hợp sản phẩm cần dùng quyền/hàng đợi hiện có quanh `tripsActions` và `reorderDay`, không gọi HTTP từ canvas. Một thao tác thả gửi trọn thứ tự; khi lỗi khôi phục snapshot, khi 409 tải lại. Không tự động tối ưu thứ tự thay ý người dùng. Nếu thêm API cấp FE `reorderItems(ids)`, giữ backend contract hiện hành; đọc lại kiểm tra quyền trước khi sửa.

| Routing | Đề nghị sử dụng | Điều khoản/rate limit/tự host phải xác minh |
|---|---|---|
| Chim bay + hệ số | Dự phòng và spike: km haversine; phút = km ×1,5 /25 km/h ×60. Gắn rõ **ước tính minh họa**, không phải ETA/đường thật; không giải quyết một chiều/phà/đường cấm | Không dịch vụ mới. Giữ thuật toán minh họa tách khỏi routing adapter |
| OSRM | Ứng viên self-host cho tuyến đường bộ khi cần kiểm soát; phải kiểm profile xe máy, không gán mặc định profile ô tô cho xe máy | [OSRM](https://project-osrm.org/), [API](https://project-osrm.org/docs/v5.24.0/api/). License phần mềm thường được mô tả BSD-2-Clause nhưng **chưa xác minh bản dùng**. Demo public không phải SLA hay quyền truy cập vô hạn; quota/điều khoản demo cần đọc riêng. RAM/build graph/update OSM là chi phí |
| Valhalla | Ứng viên khi cần nhiều costing/profile và vận hành riêng | [Docs](https://valhalla.github.io/valhalla/), [repo/license](https://github.com/valhalla/valhalla). MIT thường được nhắc cho mã, cần kiểm bản cụ thể; public demo và quota độc lập; cần build tile graph, CPU/RAM và cập nhật |
| OpenRouteService | Ứng viên hosted để giảm vận hành; kiểm profile, số waypoint, chiều dài, giới hạn ngày/phút, retry và key | [Restrictions](https://openrouteservice.org/restrictions/), [plans](https://openrouteservice.org/plans/), [self-host](https://github.com/GIScience/openrouteservice). Điều khoản SaaS khác license mã tự host; chưa chốt con số quota hay quyền cá nhân/thương mại |
| GraphHopper | Ứng viên hosted hoặc engine tự host, cần so khả năng profile và giấy phép tính năng | [API](https://www.graphhopper.com/directions-api/), [giá](https://www.graphhopper.com/pricing/), [engine/license](https://github.com/graphhopper/graphhopper). Apache-2.0 thường áp cho core, không suy ra SaaS/tính năng đều miễn phí; kiểm credit/request, QPS, waypoint, lưu cache và thương mại |

Mọi dịch vụ routing/host mới là **Tầng A**; chưa gọi bất kỳ API nào. Khi được duyệt: debounce/cancel yêu cầu cũ, version theo thứ tự ID, chỉ áp kết quả đúng version, cache theo profile+tọa độ+version dữ liệu nếu điều khoản cho phép. Khi lỗi vẫn hiện tuyến ước tính với nhãn rõ, không tái sử dụng ETA cũ.

**Chuyển động và ngày:** trước tiên dùng mũi tên tĩnh để thấy hướng; animate camera/nhấn đoạn khi chọn, tôn trọng reduced-motion. Tránh vòng rAF chạy dash toàn thời gian. Khi có nhiều ngày, map line-color theo `day` xoay token cam/trời/mực, thêm số/chữ để không phụ thuộc màu. Spike hiện chỉ **Ngày 1**, chưa có kiểm thử đổi ngày hoặc dash animation.

## 6. Spike và khung đo đã bàn giao

- Giữ lại trang và module từ job trước. A: Liberty, native photo symbol/cluster; B: A đổi màu Wander; C: B + DEM/terrain/building. A/B không hillshade nên không phải mốc production hiện tại. Offline có nền trống ghi cảnh báo, không giả ảnh tile.
- Dữ liệu trực tiếp catalog backend: **14 Đà Lạt, 13 Hà Nội, 5 Hội An**; tuyến lấy 5 điểm đầu mỗi nơi. 32 thumbnail WebP 96×96 có manifest nguồn, tác giả, license, hash ảnh gốc và byte; hiển thị pin 44 px. Ghi công trên UI; không phát sinh ảnh bằng AI.
- `run.mjs` dùng `playwright-core` đã có ở package gốc, Chrome đã cài; không cài dependency/browser. Server loopback phục vụ whitelist, không mở cả repo. CSS probe chỉ đọc các stylesheet cần thiết.
- Đo rAF p50/p95/p99 theo từng pha pan/zoom/fly, mảng frame thô, DOM node, initial idle và idle sau thao tác, DPR/canvas, renderer, Resource Timing, HTTP/request/page/map errors, screenshot từng cấu hình; context cold và reload warm, 3 lần/city/config. Xem [README đo](README-do-hieu-nang.md).
- Sửa 119 lỗi `no-undef` bằng khai báo globals tại đúng module, không tắt rule/toàn bộ lint. Sửa sprite cụm để đăng ký trước toàn bộ số đếm hữu hạn; `waitForIdle` đợi repaint thật. Framework ghi HTTP ≥400 và lỗi request, không cho nền trắng vì lỗi tải thành PASS. `hardwareGpuCandidate` chỉ là bộ lọc ban đầu, không bảo đảm driver/GPU thật đạt yêu cầu.

**Trạng thái kiểm tra thực tế:** unit 5/5; lint toàn web xanh sau sửa globals (chạy lại cuối ở `lint-final.log`). CSS probe xác nhận số ở §3.3. Smoke offline **FAIL sau 3 vòng**, assertion nhận `quang-truong-lam-vien` thay vì `ho-xuan-huong`; log hiện chưa có stack/pha nên chưa kết luận nằm ở chọn ghim hay một trong các bước reorder. Đã bổ sung ghi stack cho lần chạy sau, **chưa chạy lại smoke**. Không tuyên bố click/drag/zoom-invariant đã pass cả ba thành phố. Theo skill `wander-debug`, dừng vòng sửa runtime tại giới hạn ba vòng; việc gỡ lỗi smoke là bước tiếp theo rõ ràng. Benchmark tile/GPU **NOT_RUN**.

## 7. Lộ trình và diff sản phẩm đề nghị

Tất cả diff dưới đây **chưa áp vào `web/src`**. “Sửa ngay” nghĩa không cần đổi dịch vụ/dependency; không đồng nghĩa đã được giao sửa trong lượt này.

| Thứ tự | Diff mục tiêu sau khi được giao | Cổng nghiệm thu đề xuất, chưa phải số đo |
|---|---|---|
| 0 – hoàn thiện spike | `browser-checks.mjs::smoke`: cô lập assertion theo pha, tái hiện pin/reorder đúng tọa độ và lớp overlay. Chỉ sau khi smoke xanh mới coi prototype đủ làm đối chứng | PASS đủ 3 city, click pin/cụm/đoạn, reorder list/canvas, ↑/↓, Esc, mobile, kích thước ảnh trước/sau zoom; không lỗi map/page |
| 1 – ảnh và đọc bản đồ | `destinationQueries.ts::firstPhotoUrl`/adapter ảnh: thêm URL thumbnail riêng, không thay URL chi tiết toàn cục; `MapLayers.pinBody`: kích thước/decoding tường minh. Giữ `appearance.css`/`useGallery.step` đã sửa sẵn; `PlaceGallery`: khung dự trữ và ảnh phù hợp. Không đổi schema backend nếu chưa có quyết định | Thumbnail **96×96, ≤15 KB/ảnh** cho bộ hiện tại; pin 44 px (trạng thái chọn được quy định riêng), preview 80×80 sai số ≤1 px khi zoom 8→17; gallery mới 126×188 không đổi theo zoom; ảnh lỗi vẫn có placeholder/ghi công |
| 2 – renderer native | `MapLayers`: thay đường chạy per-move bằng GeoJSON source, photo sprite/cluster và symbol label; `GeoMap.createMap/applyMarkers/layout`: chuyển adapter, bỏ riêng listeners/DOM obsolete sau khi đối chiếu test. Giữ vòng đời/destroy/insets của `TerrainMapView` | DOM map không tăng theo số ghim; không tạo `.tm-pin` HTML cho mỗi feature; với cùng máy, cold/warm: **p95 ≤33,3 ms, p99 ≤50 ms** cho từng pan/zoom/fly, ≥3 lần; ghi thêm median p95 và lần tệ nhất. So production cùng máy, không dùng số ADR cũ làm baseline |
| 3 – tương tác tuyến | `geoRouteLayer.setRouteLines`: feature có ID/metadata, hit line và arrows; `GeoMap`: chọn feature/callback; `map.types.ts`/`TerrainMapView`: thêm callback đoạn optional; `TripMap`: thẻ preview cố định; `ItemRow`/`tripsActions`: dùng chung thứ tự và quyền/hàng đợi | Một click chỉ chọn một đối tượng; line hit ≥28 px, nút ≥44 px; reorder không đổi tọa độ, Rest/Task không mất, rollback lỗi/409, không nối tắt qua điểm bị thiếu. Không giả khoảng cách đường thật |
| 4 – style B | `mapStyle.ts`: restyle theo loại/source-layer, giữ casing/filter/zoom; chỉ đổi biểu thức tên thực sự phù hợp, tránh thay toàn bộ format chứa “name”; `map.const.ts`: tham số có tên, màu từ token | Ảnh chụp cùng camera 3 thành phố, tên Việt có dấu và fallback đọc được; không 404 glyph/sprite, không che tuyến; PO chấp nhận hình thức; thời gian initial idle báo cold/warm riêng |
| 5 – C sau số đo | `mapStyle.ts`: terrain/extrusion tùy chọn, nguồn hiện có, disable ở thiết bị chậm/reduced motion theo thiết kế; không dựng chiều cao giả | Chỉ bật nếu vẫn đạt ngân sách trên thiết bị thật; ghi request/byte/renderer, kiểm ghim không chìm/nhãn không bị nhà che; giữ lựa chọn phẳng |

Mục tiêu idle đề nghị: warm ≤2 s, cold ≤5 s ở mạng thử đã ghi rõ; nếu không đạt thì báo số thật và phân tích waterfall trước khi đổi ngưỡng. Ngân sách này chỉ là tiêu chí khảo sát. Bộ 5–14 ghim/city quá nhỏ để suy ra khả năng chịu 1.000 ghim; nếu cần tải lớn phải bổ sung workload được ghi rõ, không nhân bản giả rồi gọi là dữ liệu thật.

## 8. Các quyết định Tầng A cần PO duyệt

1. **Routing:** giữ tuyến ước tính / dùng SaaS / tự host engine. Khuyến nghị trước mắt giữ nhãn ước tính, ổn định tương tác; sau đó thử một dịch vụ trên bộ tuyến Việt Nam, xác minh profile xe máy/điều khoản/quota/chi phí trước khi chọn. Học được cách tách port/adapter và lifecycle request, tương tự tích hợp dịch vụ ngoài.
2. **Tile và hạ tầng:** giữ OpenFreeMap đã duyệt / nhà cung cấp khác / PMTiles tự host. Khuyến nghị giữ nguồn hiện tại trong vòng đo đầu; chỉ đổi khi bằng chứng thiếu dữ liệu/độ ổn định hoặc nhu cầu style vượt khả năng chỉnh paint. PMTiles/AWS có chi phí egress/cache/update và thay đổi vận hành, chưa triển khai.
3. **Dependency mới:** hiện không cần; dùng native MapLibre và pattern ↑/↓. Nếu kéo-thả production cần thư viện, trình PO với nhu cầu touch/a11y, license, kích thước bundle và so với phương án hiện có trước khi thêm. Chưa cài gì.

Không hỏi lại chuyện đã được ADR-015 duyệt. Các hướng mới trên chỉ được ghi để Claude trình PO; không sửa ADR/master plan hay tự nâng thành APPROVED.

## 9. Công cụ đã dùng

Skill `tools/codex-skills/wander-debug/SKILL.md`; PowerShell, đọc mã có giới hạn, Node test, ESLint + Stylelint thật, Playwright-core + Chrome cục bộ cho CSS/smoke. Không có code-review-graph tool khả dụng trong phiên, nên đối chiếu trực tiếp đúng tệp được giao. Không duyệt web, không cài dependency, không commit/push/deploy.
