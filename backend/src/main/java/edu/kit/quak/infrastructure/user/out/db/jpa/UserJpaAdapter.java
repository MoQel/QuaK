package edu.kit.quak.infrastructure.user.out.db.jpa;

import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaUser;
import edu.kit.quak.infrastructure.user.out.db.jpa.mapper.UserJpaMapper;
import edu.kit.quak.infrastructure.user.out.db.jpa.repository.SpringDataUserRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * JPA adapter implementing UserRepositoryPort. This adapter translates domain
 * operations to JPA
 * operations.
 */
@Repository
public class UserJpaAdapter implements UserRepositoryPort {

    private final SpringDataUserRepository repository;
    private final UserJpaMapper mapper;

    public UserJpaAdapter(SpringDataUserRepository repository, UserJpaMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public User save(User user) {
        JpaUser jpaUser = mapper.toJpa(user);
        JpaUser saved = repository.save(jpaUser);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<User> findByIssuerAndSub(String issuer, String sub) {
        return repository.findByIssuerAndSub(issuer, sub).map(mapper::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return repository.findByEmail(email).map(mapper::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    @Override
    public Optional<UUID> findIdByIssuerAndSub(String issuer, String sub) {
        return repository.findIdByIssuerAndSub(issuer, sub);
    }

    @Override
    public List<User> searchByEmail(String email) {
        return repository.findByEmailContainingIgnoreCase(email).stream().map(mapper::toDomain).toList();
    }
}
