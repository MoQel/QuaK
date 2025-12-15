package edu.kit.quak.infrastructure.filesystem.out.db.jpa.mapper;

import java.lang.reflect.Field;

public class TestUtil {

    public static void setField(Object target, String fieldName, Object value) throws Exception {
        Class<?> clazz = target.getClass();

        // move up the inheritance hierarchy
        while (clazz != null) {
            try {
                Field f = clazz.getDeclaredField(fieldName);
                f.setAccessible(true);
                f.set(target, value);
                return; // Success
            } catch (NoSuchFieldException e) {
                // Not in this class, try the parent class
                clazz = clazz.getSuperclass();
            }
        }
        // When we arrived here, the field did not exist in the entire hierarchy.
        throw new NoSuchFieldException("Field '" + fieldName + "' not found in hierarchy of " + target.getClass());
    }
}
