package edu.kit.quak.security.repository;

import edu.kit.quak.core.filesystem.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByIssuerAndSub(String issuer, String sub);
}
