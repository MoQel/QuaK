package edu.kit.quak.infrastructure.filesystem.out.db.jpa;

import java.nio.ByteBuffer;
import java.util.UUID;

/** Utility class for JPA specific operations. */
public final class JpaUtils {

    private JpaUtils() {
        // Private constructor to prevent instantiation
    }

    /**
     * Converts the raw database value to UUID. Different databases may return different types for
     * UUIDs when using native queries: - H2 returns byte[] - MariaDB may return UUID or String
     *
     * @param value the raw value from the database
     * @return the converted UUID or null if the value is null
     * @throws IllegalArgumentException if the value cannot be converted
     */
    public static UUID convertToUuid(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof UUID uuid) {
            return uuid;
        } else if (value instanceof byte[] bytes) {
            // H2 returns UUID as byte array
            if (bytes.length != 16) {
                throw new IllegalArgumentException("Byte array for UUID must be 16 bytes long");
            }
            ByteBuffer bb = ByteBuffer.wrap(bytes);
            return new UUID(bb.getLong(), bb.getLong());
        } else if (value instanceof String str) {
            return UUID.fromString(str);
        }
        throw new IllegalArgumentException("Cannot convert value to UUID: " + value.getClass());
    }
}
