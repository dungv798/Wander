> Nguồn: subagent **stand-in** (general-purpose) thay cho `wander-skeptic-qa`; `source: emulated`, danh tính agent UNVERIFIED. Nội dung dưới đây là báo cáo nguyên văn, **trừ một chỗ ghi nguồn do orchestrator sửa**: "16.10" → "§16 mục 10" (cite-check báo mục 16.10 không tồn tại; ý của agent là mục số 10 trong danh sách của §16).

**Báo cáo wander-skeptic-qa: Q16 (xác thực và khôi phục quyền chủ chuyến, Lát 1a)**

**1. Scope**
Q16 trong plan v0.3, đọc độc lập. Chỉ đọc, không quyết định mục OPEN. Không đọc §10 và §13.

**2. Source evidence**
`docs/wander-master-plan.md`: §14.1 (D8, D14, D15, D19); §14.3 G7; §15.1 (Q16, Q11); §15.6; §7.1 (dòng "Danh tính ẩn danh", dòng 179); §7.4 (R7, R13, R16); §9.1 (A-0, A-8); §9.2; §8.5; §12; §16 mục 10. Hash plan chưa kiểm: `UNVERIFIED`.

**3. Findings (theo mức ảnh hưởng)**
- **F1 `INFERENCE`:** Plan không định nghĩa "an toàn" hay mô hình đe dọa, nên G7 (`UNVERIFIED`) không kiểm chứng được. Vế của A-0/G7 theo từ `APPROVED`: lưu server, mở trên thiết bị khác, không phụ thuộc "tài khoản đầy đủ" (D14, D15, §7.1), và phải có thiết kế khôi phục. Vế dựa vào mục chưa duyệt:
  - Mệnh đề A-0 🔶: "Người không có bằng chứng quyền không giành được quyền chủ chuyến".
  - Ranh giới "tài khoản đầy đủ" (một kênh khôi phục có tính là tài khoản không?) không được định nghĩa: `UNVERIFIED`.
  - Ghi chú D15 "Khớp với D8", trong khi D8 chỉ nói về người đi cùng: `INFERENCE`.
  - Cổng "thiết kế phải được duyệt trước spec" nằm ở §9.2/§15.6, không có dòng D riêng. Dòng Lát 0 (dòng 142) là 🔶.
- **F2 `INFERENCE`:** Nếu "bằng chứng" là một mã mang quyền (Q16(5) nhắc "lộ link hoặc mã truy cập"), mệnh đề A-0 trống nghĩa, vì ai giữ mã đều "có bằng chứng". §15.1 viết "không đề xuất cơ chế" nhưng đã nói bằng ngôn ngữ link/mã.
- **F3 `INFERENCE`:** D15 đưa nhiều thiết bị vào 1a, nhưng R16 "Sửa đồng thời" gán cho 1b. Cùng một chủ chuyến trên hai máy có thể sửa chồng nhau ngay ở 1a. Hoàn tác và xóa mềm (D19) xuyên thiết bị chưa được nói.
- **F4 `CONTRADICTION` (phân loại blocker, không phải nội dung Q16):** §15.1 "Chặn spec Lát 1a" chỉ có Q16, Q11. §15.6 "Blocker còn lại trước khi viết spec Lát 1a" thêm "Cần bạn xác nhận P13".
- **F5 `INFERENCE`:** §12 giảm rủi ro riêng tư bằng "có xóa vĩnh viễn", nhưng A-8 chỉ phủ mục. Xóa chuyến hay danh tính là Q17(b) `OPEN`. D19 (không tự hết hạn) cộng R8 (không lịch sử) nghĩa là kẻ chiếm quyền xóa vĩnh viễn thì không để lại dấu vết.
- Không thấy `CONTRADICTION` trực tiếp giữa D8, D15, D19, A-0, R13, §9.2, §12, §16 về Q16.

Kịch bản (đầu vào → plan nói gì → plan im lặng ở đâu):
- **S1** Mất điện thoại, không có máy khác → §8.5 "mất thiết bị" ❓; Q16(2) → có chấp nhận khóa vĩnh viễn không; dữ liệu mồ côi ở server vẫn "giữ đến khi xóa vĩnh viễn".
- **S2** Mở máy thứ hai lúc máy một còn phiên → D15, A-5 "trên thiết bị khác"; Q16(4) → số phiên đồng thời, xung đột sửa (F3).
- **S3** Khôi phục hai lần → Q16(6) chỉ nhắc giới hạn tần suất → lần hai có vô hiệu lần một và phiên cũ không.
- **S4** Xóa vĩnh viễn rồi khôi phục → A-8, Q17(b)(c) ❓ → khôi phục chuyến/danh tính đã bị xóa.
- **S5** Người lạ có link bị lộ → Q16(5), §12 → ai xem hay sửa được; link mời Q7 thuộc 1b nên "link" của 1a là gì.
- **S6** Chủ chuyến chưa từng thiết lập khôi phục → A-0 "có cách khôi phục" → hoạt động không cần thiết lập trước hay không.

**4. Options**
Không đề xuất cơ chế (Q16, §16 mục 10 cấm). Chỉ nêu trade-off cần user cân: khóa vĩnh viễn khi mất hết bằng chứng (riêng tư cao, mất dữ liệu) so với có kênh khôi phục (an toàn hơn cho người dùng, có thể chạm ranh giới "tài khoản đầy đủ").

**5. Risks**
Cao (§12). S1 và S6 gây mất quyền; S5 và F5 gây bị chiếm quyền và xóa không dấu vết. Xác suất `UNVERIFIED`.

**6. Unknowns**
Định nghĩa "an toàn", mô hình đe dọa, ranh giới "tài khoản đầy đủ", mức chấp nhận mất quyền vĩnh viễn, mức đồng thời của một chủ chuyến.

**7. Khuyến nghị (không phải quyết định)**
Tài liệu thiết kế Q16 nên định nghĩa hai thuật ngữ trên và trả lời S1–S6. Phân tích mức chặn (`INFERENCE`, user quyết):
- Dường như chặn spec: (1), (2), (3), (5), vì chúng quyết tiêu chí A-0 và thực thể danh tính.
- (4) và (6): có thể chốt thông số khi review spec, nhưng phải có chỗ trong thiết kế.
- (7) và (8): có thể đóng muộn nếu thiết kế 1a không loại trừ. (7) dính Q6 "Organizer rời đi" của 1b; (8) thuộc 1b.

**8. Confidence**
Medium. Đã đọc đủ các mục được giao nhưng chưa kiểm hash và chưa đọc §10/§13.

**9. Questions for the user**
1. "An toàn" nghĩa là chống mối đe dọa nào trước: mất thiết bị hay bị chiếm quyền?
2. Có chấp nhận mất quyền vĩnh viễn trong một số trường hợp không?
3. Kênh khôi phục có tính là "tài khoản đầy đủ" không?
4. Xác nhận cổng "duyệt thiết kế trước spec" là yêu cầu chính thức.
5. Hai thiết bị của cùng chủ chuyến sửa đồng thời ở 1a: có thuộc Q16 không?

Cần user duyệt: câu 1–5 và bản thiết kế Q16. Không có gì bị thay đổi.
