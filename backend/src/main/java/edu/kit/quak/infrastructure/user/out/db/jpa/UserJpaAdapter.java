package edu.kit.quak.infrastructure.user.out.db.jpa;

import edu.kit.quak.application.user.ports.out.UserRepositoryPort;
import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaUser;
import edu.kit.quak.infrastructure.user.out.db.jpa.mapper.UserJpaMapper;
import edu.kit.quak.infrastructure.user.out.db.jpa.repository.SpringDataUserRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA adapter implementing UserRepositoryPort.
 * This adapter translates domain operations to JPA operations.
 */
@Component
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
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    @Override
    public Optional<UUID> findIdByIssuerAndSub(String issuer, String sub) {
        return repository.findIdByIssuerAndSub(issuer, sub);
    }
}
