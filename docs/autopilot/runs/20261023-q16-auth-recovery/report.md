# Báo cáo autopilot — 20261023-q16-auth-recovery
> Mục tiêu: Q16, thiết kế xác thực và khôi phục quyền chủ chuyến (D15) · Kế hoạch: v0.3, sha256 091f166b4873 · Executor: emulated · Trạng thái: complete (phân tích xong; Q16 vẫn OPEN, chờ bạn)

## 1. Công việc đã hoàn thành
| Giai đoạn | Trạng thái | Đầu ra |
|---|---|---|
| preflight | done | kiểm tra hash kế hoạch, registry, cấu hình guard |
| scope | done | `stages/scope.md` |
| route | done | `stages/route.md` (security, architect, skeptic) |
| review-r1 | done (song song, 3 agent) | `agents/*-r1.md` |
| reconcile | done | `stages/reconcile.md` |
| review-r2 | done (có mục tiêu, architect + skeptic) | `agents/*-r2.md` |
| consolidate | done | `stages/consolidate.md` (báo cáo hợp nhất, phương án, đề xuất) |
| apply | skipped | `authorizations.json` rỗng, kế hoạch chỉ đọc: không có thay đổi tài liệu nào được phép |
| report, validate | xem mục 6 | `report.md`, `validation.json` |

## 2. Phát hiện chính
Chi tiết đầy đủ trong `stages/consolidate.md`.
- **Đồng thuận (độc lập):** D15, D8, D19 `APPROVED`; cơ chế Q16/R13 `OPEN`; vế "người không có bằng chứng không giành được quyền" của A-0 là `INFERENCE`; G7 `UNVERIFIED`. Đánh đổi trung tâm: mất quyền vĩnh viễn so với bị chiếm quyền.
- **Đã giải quyết bằng bằng chứng:** nhãn `CONTRADICTION` (§15.1 so với §15.6) bị rút, thành `INFERENCE`; nhãn `APPROVED` cho rủi ro §12 bị bác, thành `PROPOSED`.
- **Hội tụ một phần:** Q16(4), (7), (8) có thể hoãn nếu thiết kế có các ràng buộc C1–C5 (`INFERENCE`). Mệnh đề A-0 chỉ kiểm thử được với kẻ không có bí mật; dưới phương án mã khôi phục nó quy về độ khó đoán và giới hạn tần suất (Q16(5), (6)).
- **Bất đồng giữ nguyên:** Q16(2) có được bỏ trống hoàn toàn không (architect: không, thiết kế phải nêu rõ trạng thái "mất hết"; skeptic vòng 2 không phản biện trực tiếp, `UNVERIFIED`).

## 3. Quyết định chưa giải quyết
| ID | Token | Phương án và đánh đổi | Khóa vào | Đảo ngược | Khuyến nghị (không phải quyết định) |
|---|---|---|---|---|---|
| Q16 | OPEN | A mã khôi phục · B kênh liên hệ đã xác minh · C ghép thiết bị (bổ sung); đánh đổi: mất vĩnh viễn so với bị chiếm quyền | A: Principal/Credential/Phiên · B: dữ liệu cá nhân, gần "tài khoản" (D8) · C: không khóa | A trung bình · B thấp · C cao | DRAFT-1: xem A + C làm ứng viên chính để duyệt; B chỉ là tùy chọn bổ sung |
| DRAFT-2 | PROPOSED | Ràng buộc thiết kế C1–C5 và kiểm thử T1–T4 | đặt biên cho thiết kế, không chọn cơ chế | cao | đưa vào brief thiết kế Q16 khi bạn duyệt |
| Q6, Q7 | OPEN | chưa phân tích ở run này; chỉ ghi điểm nối với Q16 (link mời không được cấp quyền chủ) | — | — | — |

```json autopilot-decisions
[
  {"id": "D8", "status": "APPROVED", "source": "§14.1"},
  {"id": "D15", "status": "APPROVED", "source": "§14.1"},
  {"id": "D19", "status": "APPROVED", "source": "§14.1"},
  {"id": "Q16", "status": "OPEN", "source": "§15.1"},
  {"id": "Q6", "status": "OPEN", "source": "§15.4"},
  {"id": "Q7", "status": "OPEN", "source": "§15.4"},
  {"id": "G7", "status": "UNVERIFIED", "source": "§14.3"},
  {"id": "DRAFT-1", "status": "PROPOSED", "about": "Q16", "source": "stages/consolidate.md"},
  {"id": "DRAFT-2", "status": "PROPOSED", "about": "Q16", "source": "stages/consolidate.md"}
]
```

**Cần bạn phê duyệt:** (a) hướng cho Q16 (DRAFT-1) và câu Q16(2): chấp nhận mất vĩnh viễn hay không; (b) có coi kênh liên hệ tùy chọn là vi phạm D8 không; (c) Q16(1): địa chỉ chuyến có tách khỏi bằng chứng sở hữu không; (d) ràng buộc C1–C5 (DRAFT-2). Sau khi bạn duyệt thiết kế, Q16 mới có thể chuyển trạng thái; run này không làm việc đó.

## 4. Việc bị chặn và blocker chính xác
Không có giai đoạn nào bị chặn về kỹ thuật. Blocker nội dung còn lại cho spec 1a (§15.6): Q16 cần bạn duyệt thiết kế; Q11; bạn xác nhận P13; P2/P5 nên xem lại. Run này không đụng tới Q11, P13, P2, P5.

## 5. File đã thay đổi
<!-- autopilot:files:start -->
Cơ sở so sánh: bảng băm sha256 của toàn bộ file dự án lúc bắt đầu (thư mục này không có Git).

- thêm: `docs/autopilot/runs/20261023-q16-auth-recovery/` (checkpoint, báo cáo, bằng chứng của lần chạy này)

Ngoài `docs/autopilot/`: không có (mã sản phẩm và kế hoạch tổng thể không bị chạm).
<!-- autopilot:files:end -->

## 6. Kết quả kiểm tra
<!-- autopilot:validation:start -->
Tổng: **PASS_WITH_WARNINGS** (lúc 2026-10-23T11:53:30.099Z)

| Kiểm tra | Kết quả | Chi tiết |
|---|---|---|
| plan_unchanged | PASS | plan sha256 equals the run baseline |
| write_scope | PASS | 0 change(s), all inside docs/autopilot/ (plan and product code untouched) |
| limits | PASS | rounds 2/2, dispatches 5/8, resumes 2/5 |
| stages_complete | PASS | all stages done or skipped |
| outputs_integrity | PASS | recorded output hashes match |
| id_references | PASS | 10 markdown file(s): every D/Q/P/R/G/A/B ID and § section exists in the plan |
| path_references | PASS | backticked repo paths exist |
| decisions_block | PASS | 9 entries checked against §14.1/§14.2/§15: no promotion, approved decisions preserved |
| quotes_verbatim | PASS | every quoted evidence string appears verbatim in the plan or a saved report |
| dispatch_evidence | WARN | UNVERIFIED: dispatches are logged as "emulated" (stand-in subagents, NOT the registered wander-* agents) |
| report_sections | PASS | all required sections and markers present |
| guard_config | PASS | plan deny + guard hook configured; guard self-test passes; agents read-only |

| Tiêu chí nghiệm thu | Kết quả |
|---|---|
| AC1 Master plan unchanged (sha256 equals baseline) | PASS |
| AC2 Only files under docs/autopilot/ changed; no product code touched | PASS |
| AC3 Review rounds <= 2, dispatches <= 8, stage attempts within limits | PASS |
| AC4 Every stage is done/skipped, or blocked with a precise blocker | PASS |
| AC5 Every cited ID/section exists in the plan; every quote is verbatim | PASS |
| AC6 No proposal/inference/open item promoted to APPROVED; approved decisions preserved | PASS |
| AC7 Every saved specialist report has a logged dispatch; evidence source is stated | PASS_WITH_WARNINGS |
| AC8 Final report has required sections | PASS |
| AC9 Guard hook and plan deny are configured and the guard self-test passes | PASS |
<!-- autopilot:validation:end -->

## 7. Giới hạn của lần chạy này
- **Executor `emulated`:** môi trường này không có Claude Code CLI và không đăng ký các agent `wander-*`. Cả 5 báo cáo chuyên gia do subagent `general-purpose` đóng vai; danh tính agent `UNVERIFIED`. `validate` báo `dispatch_evidence` là WARN vì không có hook ghi lệnh gọi thật.
- **Lỗi quy trình vòng 2:** prompt của orchestrator trỏ tới đường dẫn file thay vì dán nội dung, nên hai stand-in vòng 2 không đọc được báo cáo vòng 1 và tự ghi `UNVERIFIED`. Vòng 2 đã dùng, không chạy lại. Lần chạy thật nên dán nội dung báo cáo vào brief.
- Các trích dẫn đã qua `cite-check` (ID và §): hai lỗi ký hiệu mục §16 (một ở vòng 1, một ở vòng 2) được sửa có ghi chú, hash được ghi lại trong `checkpoint.json` (amendments). Chưa kiểm tra bằng tay mọi số dòng.
- Guard, hook và validator được kiểm thử bằng 12 bài test và dry-run; chưa chạy trong Claude Code thật.
- Không làm: không chọn cơ chế, không sửa kế hoạch, không đổi trạng thái quyết định, không viết mã sản phẩm.

## 8. Ranh giới
Không có quyết định nào được chuyển thành APPROVED. Kế hoạch tổng thể không bị sửa. Chỉ bạn mới có thể phê duyệt.
