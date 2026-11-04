package edu.kit.quak.infrastructure.user.out.db.jpa.repository;

import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaUser;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/** Spring Data JPA repository for JpaUser entity. */
@Repository
public interface SpringDataUserRepository extends JpaRepository<JpaUser, UUID> {
    Optional<JpaUser> findByIssuerAndSub(String issuer, String sub);

    Optional<JpaUser> findByEmail(String email);

    /**
     * Finds users whose email contains the given search string (case-insensitive).
     * Used for user search/autocomplete in the invitation flow.
     */
    List<JpaUser> findByEmailContainingIgnoreCase(String email);

    @Query("SELECT u FROM JpaUser u WHERE u.guest = true AND COALESCE(u.lastActiveAt, u.createdAt) < :inactiveSince")
    List<JpaUser> findInactiveGuests(@Param("inactiveSince") Instant inactiveSince);

    @Modifying
    @Query("UPDATE JpaUser u SET u.lastActiveAt = :lastActiveAt WHERE u.issuer = :issuer AND u.sub = :sub")
    void updateLastActiveAt(@Param("issuer") String issuer, @Param("sub") String sub, @Param("lastActiveAt") Instant lastActiveAt);
}
