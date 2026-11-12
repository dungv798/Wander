package com.wander.rating.infrastructure.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/** Table {@code place_rating_reports}: each person reports a comment at most once (read through JPA only, written with plain SQL). */
@Entity
@Table(name = "place_rating_reports")
public class RatingReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "rating_id", nullable = false)
    private UUID ratingId;

    @Column(name = "reporter_id", nullable = false)
    private UUID reporterId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public UUID getRatingId() { return ratingId; }
    public UUID getReporterId() { return reporterId; }
    public Instant getCreatedAt() { return createdAt; }
}
