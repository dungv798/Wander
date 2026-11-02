package com.wander.rating.infrastructure.persistence.entity;

import com.wander.rating.domain.constant.RatingConstants;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Bảng {@code place_ratings} (ánh xạ JPA; mô hình domain ở rating.domain.model.PlaceRating). */
@Entity
@Table(name = "place_ratings")
public class PlaceRatingEntity {

    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "identity_id", nullable = false)
    private UUID identityId;

    @Column(name = "place_ref", nullable = false, length = RatingConstants.PLACE_REF_MAX_LENGTH)
    private String placeRef;

    @Column(name = "stars", nullable = false)
    private int stars;

    @Column(name = "comment", length = RatingConstants.COMMENT_MAX_LENGTH)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getId() { return id; }
    public UUID getIdentityId() { return identityId; }
    public String getPlaceRef() { return placeRef; }
    public int getStars() { return stars; }
    public String getComment() { return comment; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
