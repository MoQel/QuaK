package edu.kit.quak.infrastructure.user.out.db.jpa.repository;

import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for JpaUser entity.
 */
@Repository
public interface SpringDataUserRepository extends JpaRepository<JpaUser, UUID> {
    Optional<JpaUser> findByIssuerAndSub(String issuer, String sub);
}
