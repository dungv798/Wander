# Báo cáo hợp nhất — Q16 (xác thực và khôi phục quyền chủ chuyến, Lát 1a)

## 1. Phạm vi và nguồn
- Mục tiêu: so sánh phương án ở mức khái niệm cho Q16; không chọn cơ chế, không sửa kế hoạch.
- Kế hoạch `docs/wander-master-plan.md` v0.3 (hash khớp registry). Mục đã dùng: §14.1 (D8, D15, D19), §14.3 (G7), §15.1 (Q16), §15.4 (Q6, Q7), §15.6, §7.4 (R13), §9.1 (A-0), §9.2, §12, §16 mục 9 và 10.
- Agent: `wander-security-reviewer`, `wander-software-architect`, `wander-skeptic-qa` (vòng 1, song song); `wander-software-architect`, `wander-skeptic-qa` (vòng 2, có mục tiêu). Không có vòng 3. Cả năm báo cáo là **stand-in** (`source: emulated`), danh tính agent `UNVERIFIED`.
- Lỗi của orchestrator ở vòng 2: prompt chỉ trỏ tới đường dẫn file của run thay vì dán nội dung, nên cả hai stand-in không mở được báo cáo vòng 1. Chúng tự khai điều này (`UNVERIFIED` khi so với F2/F4/invariant 1 gốc). Kết luận vòng 2 vì thế yếu hơn dự kiến; vòng 2 đã dùng hết, không chạy lại.

## 2. Đồng thuận (độc lập; đồng thuận không phải là đúng)
- D15, D8, D19 `APPROVED`. Cơ chế cụ thể (Q16, R13) `OPEN`. Q6, Q7 `OPEN`. G7 `UNVERIFIED`.
- Vế "người không có bằng chứng quyền không giành được quyền chủ chuyến" trong A-0 là `INFERENCE` (diễn giải, chưa được bạn duyệt).
- Đánh đổi trung tâm: mất quyền vĩnh viễn (không có đường khôi phục) so với bị chiếm quyền (đường khôi phục yếu). Kênh liên hệ để khôi phục có thể chạm ranh giới "không tài khoản đầy đủ" của D8, ranh giới này chưa được định nghĩa (`UNVERIFIED`).
- Link/mã mời của 1b không được tự cấp quyền chủ chuyến.

## 3. Bất đồng và cách xử lý
| Mục | Kết quả | Token |
|---|---|---|
| G2 nhãn `CONTRADICTION` giữa §15.1 và §15.6 | **Rút nhãn.** §15.1 là bảng câu hỏi mở; §15.6 là danh sách blocker gồm cả việc xác nhận một đề xuất (P13) và xem lại P2/P5. Hai mục không loại trừ nhau; registry của dự án khớp §15.6. Skeptic tự rút, orchestrator độc lập đồng ý | `INFERENCE` |
| G3 nhãn `APPROVED` cho rủi ro §12 | **Bác.** Bảng §12 không có cột trạng thái, không có ✅; mức rủi ro là `PROPOSED` | `PROPOSED` |
| G1 có phải trả lời Q16(2), (4), (7), (8) trước khi duyệt thiết kế | **Hội tụ một phần.** Architect: (4), (7), (8) hoãn được kèm ràng buộc; (2) không được bỏ trống hoàn toàn (thiết kế phải nêu rõ trạng thái "mất hết" mà không chọn kết cục). Skeptic: (7), (8) hoãn được kèm điều kiện (i), (ii), nhưng nếu (1)/(5) được trả lời bằng bí mật mang quyền thì (7) đã bị trả lời ngầm | `INFERENCE` |
| G1 phần còn lại | **Bất đồng được giữ nguyên:** skeptic vòng 2 không nói về (2) nên chưa có phản biện trực tiếp cho lập trường của architect; nguyên văn F4 của skeptic không có trong tay stand-in vòng 2 | `UNVERIFIED` |
| G4 / F2 (A-0 trống nghĩa nếu "bằng chứng" là mã mang quyền) | **Cả hai thu hẹp.** Dưới phương án mã khôi phục, "ai có mã là chủ"; mệnh đề A-0 chỉ kiểm thử được với kẻ không có bí mật nào và quy về độ khó đoán và giới hạn tần suất (Q16(5), (6)). Cách phát biểu lại kiểm thử được (architect): T1 thao tác chủ bị từ chối khi bằng chứng thiếu, sai, hết hạn, đã thu hồi hoặc thuộc chuyến khác; T2 từ chối không tiết lộ chuyến có tồn tại; T3 mã cũ bị từ chối sau khi đổi mã; T4 người cầm mã hợp lệ có quyền chủ (khẳng định về quyền, không kiểm thử danh tính) | `INFERENCE` |

## 4. Khoảng trống bằng chứng (`UNVERIFIED`)
Mô hình đe dọa và định nghĩa "an toàn"; ranh giới "tài khoản đầy đủ"; "link/mã" của 1a là gì khi link mời thuộc 1b; dữ liệu cá nhân thực tế được thu; sửa đồng thời của cùng một chủ chuyến trên hai thiết bị ở 1a; mức chấp nhận mất vĩnh viễn; vòng đời bản sao lưu.

## 5. Phương án (đều `PROPOSED`, mức khái niệm; không gắn công nghệ)
| Phương án | Khóa vào đâu | Đảo ngược | Điểm yếu chính |
|---|---|---|---|
| **A. Mã khôi phục do chủ giữ** (bí mật dài, hiện một lần; server chỉ giữ dạng kiểm chứng) | Tách Principal / Credential / Phiên; cần xoay và thu hồi mã | Trung bình | Không lưu mã và mất hết thiết bị: mất quyền vĩnh viễn. Lộ mã: bị chiếm chuyến |
| **B. Kênh liên hệ đã xác minh** (tùy chọn) | Dữ liệu cá nhân và hạ tầng gửi tin; gần "tài khoản", cần đối chiếu D8 | Thấp (đã thu dữ liệu cá nhân thì khó rút) | Mất hoặc bị chiếm kênh: bị chiếm chuyến; người bỏ qua bước gắn kênh thì không có đường khôi phục |
| **C. Ghép thiết bị** (thiết bị đã tin duyệt thiết bị mới bằng mã ngắn dùng một lần) | Chỉ bổ sung, không đứng một mình | Cao | Mất hết thiết bị cũ thì cần A hoặc B |
Bộ phương án A–E riêng của `wander-security-reviewer` nằm trong báo cáo vòng 1; hai bộ nhãn độc lập, không gộp.

## 6. Rủi ro chính (theo kịch bản)
1. **Cao:** người cài đặt tự chọn cơ chế khi viết code (§12; §16 mục 10). Chủ chuyến mất điện thoại, mở từ laptop mới, nhưng chưa có đường khôi phục nào được duyệt.
2. **Cao (A):** chủ chuyến không lưu mã, đổi điện thoại, mất toàn bộ lịch trình (mục đã xóa mềm theo D19 cũng mất).
3. **Trung bình–Cao:** dữ liệu lưu phía server cùng mã/link bị lộ (§12 hàng riêng tư); người cầm mã là chủ (T4).
4. **Trung bình (B):** kênh liên hệ bị chiếm thì chuyến bị chiếm; dữ liệu cá nhân phát sinh ngoài tinh thần D8.
5. **Trung bình:** ở 1b, link mời bị nhầm là bằng chứng quyền chủ, hoặc Member có hệ khôi phục riêng song song với chủ.

## 7. Cần bạn phê duyệt
**DRAFT-1 — hướng cho Q16 (khuyến nghị, không phải quyết định):** xem A + C làm ứng viên chính để duyệt thiết kế. Lý do: không thu dữ liệu cá nhân (hợp D8), giữ được "mở trên thiết bị khác" (D15), đảo ngược được ở mức trung bình. Đánh đổi bạn phải chấp nhận: mất mã và mất hết thiết bị thì mất chuyến vĩnh viễn. B chỉ nên là tùy chọn bổ sung nếu bạn xác định thu kênh liên hệ không vi phạm D8. Tình trạng Q16: vẫn `OPEN`.

**DRAFT-2 — ràng buộc thiết kế cần có trong brief Q16, để hoãn (4), (7), (8) không buộc làm lại (`PROPOSED`):**
- C1. Hiệu lực phiên do server kiểm soát và thu hồi được.
- C2. Định danh chuyến tách khỏi bằng chứng sở hữu; quyền chủ là quan hệ có thể gán lại.
- C3. Bằng chứng chủ chuyến tách khỏi quyền xem/sửa.
- C4. Không thứ gì tạo ở 1a (link, mã) tự cấp quyền chủ khi chia sẻ ở 1b.
- C5. Thiết kế nêu rõ trạng thái "mất hết cách khôi phục" mà không chọn kết cục.
- Kiểm thử T1–T4 (mục 3, G4) thay cho phát biểu cũ của invariant 1.

**Câu hỏi đổi hướng quyết định (cho bạn):**
1. Q16(2): khi mất mọi cách khôi phục, bạn chấp nhận chuyến mất vĩnh viễn, hay cần đường khôi phục có người khác xác nhận?
2. D8: thu một kênh liên hệ tùy chọn có vi phạm tinh thần "không tài khoản đầy đủ" không?
3. Q16(1): địa chỉ chuyến có tách khỏi bằng chứng sở hữu không? Nếu không, bạn có chấp nhận (7) chuyển giao bị trả lời ngầm?

## 8. Ranh giới
Không có file ngoài `docs/autopilot/`, không có kế hoạch, không có quyết định nào bị thay đổi. Chỉ bạn mới có thể phê duyệt.
