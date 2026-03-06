package edu.kit.quak.infrastructure.user.out.db.jpa.repository;

import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaUser;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/** Spring Data JPA repository for JpaUser entity. */
@Repository
public interface SpringDataUserRepository extends JpaRepository<JpaUser, UUID> {
    Optional<JpaUser> findByIssuerAndSub(String issuer, String sub);

    Optional<JpaUser> findByEmail(String email);

    /**
     * Efficiently retrieves only the user's UUID without loading the full entity.
     * This is ideal for
     * ownership verification where only the ID is needed.
     */
    @Query("SELECT u.id FROM JpaUser u WHERE u.issuer = :issuer AND u.sub = :sub")
    Optional<UUID> findIdByIssuerAndSub(@Param("issuer") String issuer, @Param("sub") String sub);

    /**
     * Finds users whose email contains the given search string (case-insensitive).
     * Used for user search/autocomplete in the invitation flow.
     */
    List<JpaUser> findByEmailContainingIgnoreCase(String email);
}
