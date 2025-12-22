package edu.kit.quak.infrastructure.user.out.db.jpa.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for User persistence.
 */
@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "issuer", "sub" })
})
@Getter
@Setter
@NoArgsConstructor
public class JpaUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String issuer;

    @Column(nullable = false)
    private String sub;

    private String email;

    @Column(name = "email_verified")
    private Boolean emailVerified;

    private String name;

    @Column(name = "given_name")
    private String givenName;

    @Column(name = "family_name")
    private String familyName;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, columnDefinition = "TIMESTAMP(6)")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", columnDefinition = "TIMESTAMP(6)")
    private Instant updatedAt;

    @Column(name = "last_login_at", columnDefinition = "TIMESTAMP(6)")
    private Instant lastLoginAt;
}
