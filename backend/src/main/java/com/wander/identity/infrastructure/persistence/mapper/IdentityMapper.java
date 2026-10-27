package com.wander.identity.infrastructure.persistence.mapper;

import com.wander.identity.domain.model.IdentityModel.AttemptState;
import com.wander.identity.domain.model.IdentityModel.CodeReplacement;
import com.wander.identity.domain.model.IdentityModel.DeviceLink;
import com.wander.identity.domain.model.IdentityModel.Identity;
import com.wander.identity.domain.model.IdentityModel.LinkState;
import com.wander.identity.domain.model.IdentityModel.RecoveryAttempt;
import com.wander.identity.domain.model.IdentityModel.RecoveryCode;
import com.wander.identity.domain.model.IdentityModel.ReplacementState;
import com.wander.identity.domain.model.IdentityModel.Session;
import com.wander.identity.domain.model.IdentityModel.StepUpRequest;
import com.wander.identity.domain.model.IdentityModel.StepUpState;
import com.wander.identity.infrastructure.persistence.entity.CodeReplacementEntity;
import com.wander.identity.infrastructure.persistence.entity.DeviceLinkEntity;
import com.wander.identity.infrastructure.persistence.entity.IdentityEntity;
import com.wander.identity.infrastructure.persistence.entity.RecoveryAttemptEntity;
import com.wander.identity.infrastructure.persistence.entity.RecoveryCodeEntity;
import com.wander.identity.infrastructure.persistence.entity.SessionEntity;
import com.wander.identity.infrastructure.persistence.entity.StepUpRequestEntity;
import java.util.Locale;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

/**
 * Ánh xạ entity JPA ↔ record domain của Identity (ADR-008). {@code unmappedTargetPolicy = ERROR}: thêm cột/trường mà
 * quên ánh xạ thì biên dịch đỏ. Trạng thái lưu dạng chữ thường trong cơ sở dữ liệu (pending, committed…).
 * <p>
 * Chiều domain → entity cập nhật entity có sẵn (tìm theo id) hoặc entity mới; adapter quyết định nạp hay tạo.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface IdentityMapper {

    // ---- entity → domain ----

    /** Phiên domain từ entity. */
    Session toDomain(SessionEntity entity);

    /** Mã khôi phục domain từ entity. */
    RecoveryCode toDomain(RecoveryCodeEntity entity);

    // Các hàm chuyển trạng thái của record domain (withState, approve) có một tham số và trả về chính kiểu đó nên
    // MapStruct nhầm là "fluent setter"; chúng không phải trường để ánh xạ.

    /** Lần thử khôi phục domain từ entity. */
    @Mapping(target = "withState", ignore = true)
    RecoveryAttempt toDomain(RecoveryAttemptEntity entity);

    /** Mã thay thế domain từ entity. */
    @Mapping(target = "withState", ignore = true)
    CodeReplacement toDomain(CodeReplacementEntity entity);

    /** Yêu cầu ghép thiết bị domain từ entity. */
    @Mapping(target = "approve", ignore = true)
    DeviceLink toDomain(DeviceLinkEntity entity);

    /** Yêu cầu xác thực lại domain từ entity. */
    @Mapping(target = "approve", ignore = true)
    StepUpRequest toDomain(StepUpRequestEntity entity);

    // ---- domain → entity (cập nhật tại chỗ) ----

    /** Ghi giá trị của danh tính domain vào entity. */
    void update(Identity identity, @MappingTarget IdentityEntity entity);

    /** Ghi giá trị của phiên domain vào entity. */
    void update(Session session, @MappingTarget SessionEntity entity);

    /** Ghi giá trị của mã khôi phục domain vào entity. */
    void update(RecoveryCode code, @MappingTarget RecoveryCodeEntity entity);

    /** Ghi giá trị của lần thử khôi phục domain vào entity. */
    void update(RecoveryAttempt attempt, @MappingTarget RecoveryAttemptEntity entity);

    /** Ghi giá trị của mã thay thế domain vào entity. */
    void update(CodeReplacement replacement, @MappingTarget CodeReplacementEntity entity);

    /** Ghi giá trị của yêu cầu ghép thiết bị domain vào entity. */
    void update(DeviceLink link, @MappingTarget DeviceLinkEntity entity);

    /** Ghi giá trị của yêu cầu xác thực lại domain vào entity. */
    void update(StepUpRequest request, @MappingTarget StepUpRequestEntity entity);

    // ---- trạng thái: enum ↔ chữ thường ----

    /** Trạng thái lần thử dưới dạng chữ thường để lưu. */
    default String text(AttemptState state) {
        return lower(state);
    }

    /** Trạng thái mã thay thế dưới dạng chữ thường để lưu. */
    default String text(ReplacementState state) {
        return lower(state);
    }

    /** Trạng thái yêu cầu ghép dưới dạng chữ thường để lưu. */
    default String text(LinkState state) {
        return lower(state);
    }

    /** Trạng thái yêu cầu xác thực lại dưới dạng chữ thường để lưu. */
    default String text(StepUpState state) {
        return lower(state);
    }

    /** Trạng thái lần thử từ chữ thường đã lưu. */
    default AttemptState attemptState(String text) {
        return AttemptState.valueOf(upper(text));
    }

    /** Trạng thái mã thay thế từ chữ thường đã lưu. */
    default ReplacementState replacementState(String text) {
        return ReplacementState.valueOf(upper(text));
    }

    /** Trạng thái yêu cầu ghép từ chữ thường đã lưu. */
    default LinkState linkState(String text) {
        return LinkState.valueOf(upper(text));
    }

    /** Trạng thái yêu cầu xác thực lại từ chữ thường đã lưu. */
    default StepUpState stepUpState(String text) {
        return StepUpState.valueOf(upper(text));
    }

    /** Tên giá trị liệt kê viết thường; null giữ nguyên null. */
    private static String lower(Enum<?> state) {
        return state == null ? null : state.name().toLowerCase(Locale.ROOT);
    }

    /** Chuỗi viết hoa để tra giá trị liệt kê; null giữ nguyên null. */
    private static String upper(String text) {
        return text == null ? null : text.toUpperCase(Locale.ROOT);
    }
}
