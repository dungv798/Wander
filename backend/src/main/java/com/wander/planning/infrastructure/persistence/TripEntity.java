package com.wander.planning.infrastructure.persistence;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Bảng {@code trips}. Lớp JPA tách khỏi domain {@code Trip}: domain không mang annotation của framework. */
@Entity
@Table(name = "trips")
public class TripEntity {

    @Id
    private UUID id;

    @Column(name = "owner_identity_id", nullable = false)
    private UUID ownerIdentityId;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 200)
    private String destination;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Khóa lạc quan: hai lệnh đồng thời trên cùng chuyến ⇒ lệnh sau nhận 409 thay vì ghi đè âm thầm. */
    @Version
    private long version;

    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ItemEntity> items = new ArrayList<>();

    protected TripEntity() {
    }

    public TripEntity(UUID id) {
        this.id = id;
    }

    public UUID getId() { return id; }
    public UUID getOwnerIdentityId() { return ownerIdentityId; }
    public void setOwnerIdentityId(UUID v) { this.ownerIdentityId = v; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public String getDestination() { return destination; }
    public void setDestination(String v) { this.destination = v; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate v) { this.startDate = v; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate v) { this.endDate = v; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant v) { this.createdAt = v; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant v) { this.updatedAt = v; }
    public long getVersion() { return version; }
    public List<ItemEntity> getItems() { return items; }
}
