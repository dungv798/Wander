package com.wander.planning.domain;

import java.util.Optional;
import java.util.UUID;

/**
 * Cổng (port) lưu aggregate Trip. Domain định nghĩa, infrastructure (JPA) cài đặt.
 * Chuyến của người khác được trả về như không tồn tại (INV-6): không tiết lộ chuyến có tồn tại.
 */
public interface TripRepository {

    Optional<Trip> findOwned(UUID tripId, UUID ownerId);

    void save(Trip trip);
}
