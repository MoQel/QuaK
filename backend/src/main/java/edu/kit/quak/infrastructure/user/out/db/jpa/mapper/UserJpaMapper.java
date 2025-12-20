package edu.kit.quak.infrastructure.user.out.db.jpa.mapper;

import edu.kit.quak.core.user.model.User;
import edu.kit.quak.infrastructure.user.out.db.jpa.entity.JpaUser;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting between User domain model and JpaUser entity.
 */
@Component
public class UserJpaMapper {

    public User toDomain(JpaUser jpaUser) {
        if (jpaUser == null) return null;
        
        User user = new User();
        user.setId(jpaUser.getId());
        user.setIssuer(jpaUser.getIssuer());
        user.setSub(jpaUser.getSub());
        user.setEmail(jpaUser.getEmail());
        user.setEmailVerified(jpaUser.getEmailVerified());
        user.setName(jpaUser.getName());
        user.setGivenName(jpaUser.getGivenName());
        user.setFamilyName(jpaUser.getFamilyName());
        user.setAvatarUrl(jpaUser.getAvatarUrl());
        user.setCreatedAt(jpaUser.getCreatedAt());
        user.setUpdatedAt(jpaUser.getUpdatedAt());
        user.setLastLoginAt(jpaUser.getLastLoginAt());
        return user;
    }

    public JpaUser toJpa(User user) {
        if (user == null) return null;
        
        JpaUser jpaUser = new JpaUser();
        jpaUser.setId(user.getId());
        jpaUser.setIssuer(user.getIssuer());
        jpaUser.setSub(user.getSub());
        jpaUser.setEmail(user.getEmail());
        jpaUser.setEmailVerified(user.getEmailVerified());
        jpaUser.setName(user.getName());
        jpaUser.setGivenName(user.getGivenName());
        jpaUser.setFamilyName(user.getFamilyName());
        jpaUser.setAvatarUrl(user.getAvatarUrl());
        jpaUser.setCreatedAt(user.getCreatedAt());
        jpaUser.setUpdatedAt(user.getUpdatedAt());
        jpaUser.setLastLoginAt(user.getLastLoginAt());
        return jpaUser;
    }
}
