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
 * Maps JPA entities <-> Identity domain records (ADR-008). {@code unmappedTargetPolicy = ERROR}: adding a column/field and
 * forgetting to map it turns the build red. States are stored in lowercase in the database (pending, committed...).
 * <p>
 * The domain -> entity direction updates an existing entity (found by id) or a new one; the adapter decides whether to load or create.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface IdentityMapper {

    // ---- entity → domain ----

    /** The domain session from an entity. */
    Session toDomain(SessionEntity entity);

    /** The domain recovery code from an entity. */
    RecoveryCode toDomain(RecoveryCodeEntity entity);

    // The state-transition methods of the domain records (withState, approve) take one parameter and return the same type, so
    // MapStruct mistakes them for 'fluent setters'; they are not fields to map.

    /** The domain recovery attempt from an entity. */
    @Mapping(target = "withState", ignore = true)
    RecoveryAttempt toDomain(RecoveryAttemptEntity entity);

    /** The domain replacement code from an entity. */
    @Mapping(target = "withState", ignore = true)
    CodeReplacement toDomain(CodeReplacementEntity entity);

    /** The domain device pairing request from an entity. */
    @Mapping(target = "approve", ignore = true)
    DeviceLink toDomain(DeviceLinkEntity entity);

    /** The domain re-authentication request from an entity. */
    @Mapping(target = "approve", ignore = true)
    StepUpRequest toDomain(StepUpRequestEntity entity);

    // ---- domain -> entity (update in place) ----

    /** Writes the values of the domain identity into the entity. */
    void update(Identity identity, @MappingTarget IdentityEntity entity);

    /** Writes the values of the domain session into the entity. */
    void update(Session session, @MappingTarget SessionEntity entity);

    /** Writes the values of the domain recovery code into the entity. */
    void update(RecoveryCode code, @MappingTarget RecoveryCodeEntity entity);

    /** Writes the values of the domain recovery attempt into the entity. */
    void update(RecoveryAttempt attempt, @MappingTarget RecoveryAttemptEntity entity);

    /** Writes the values of the domain replacement code into the entity. */
    void update(CodeReplacement replacement, @MappingTarget CodeReplacementEntity entity);

    /** Writes the values of the domain device pairing request into the entity. */
    void update(DeviceLink link, @MappingTarget DeviceLinkEntity entity);

    /** Writes the values of the domain re-authentication request into the entity. */
    void update(StepUpRequest request, @MappingTarget StepUpRequestEntity entity);

    // ---- states: enum <-> lowercase ----

    /** The attempt state as lowercase for storing. */
    default String text(AttemptState state) {
        return lower(state);
    }

    /** The replacement code state as lowercase for storing. */
    default String text(ReplacementState state) {
        return lower(state);
    }

    /** The pairing request state as lowercase for storing. */
    default String text(LinkState state) {
        return lower(state);
    }

    /** The re-authentication request state as lowercase for storing. */
    default String text(StepUpState state) {
        return lower(state);
    }

    /** The attempt state from the stored lowercase. */
    default AttemptState attemptState(String text) {
        return AttemptState.valueOf(upper(text));
    }

    /** The replacement code state from the stored lowercase. */
    default ReplacementState replacementState(String text) {
        return ReplacementState.valueOf(upper(text));
    }

    /** The pairing request state from the stored lowercase. */
    default LinkState linkState(String text) {
        return LinkState.valueOf(upper(text));
    }

    /** The re-authentication request state from the stored lowercase. */
    default StepUpState stepUpState(String text) {
        return StepUpState.valueOf(upper(text));
    }

    /** The enum constant name in lowercase; null stays null. */
    private static String lower(Enum<?> state) {
        return state == null ? null : state.name().toLowerCase(Locale.ROOT);
    }

    /** A string in uppercase for looking up an enum constant; null stays null. */
    private static String upper(String text) {
        return text == null ? null : text.toUpperCase(Locale.ROOT);
    }
}
