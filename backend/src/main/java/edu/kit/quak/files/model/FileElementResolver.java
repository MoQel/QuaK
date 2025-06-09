package edu.kit.quak.files.model;

import com.fasterxml.jackson.databind.DatabindContext;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.jsontype.impl.TypeIdResolverBase;

import java.io.IOException;

import static com.fasterxml.jackson.annotation.JsonTypeInfo.Id;

public class FileElementResolver extends TypeIdResolverBase {
    private JavaType superType;

    @Override
    public void init(JavaType bt) {
        superType = bt;
    }

    @Override
    public String idFromValue(Object value) {
        return idFromValueAndType(value, value.getClass());
    }

    @Override
    public String idFromValueAndType(Object value, Class<?> suggestedType) {
        return Type.getByRelatedClass(suggestedType).orElseThrow().name;
    }

    @Override
    public JavaType typeFromId(DatabindContext context, String id) throws IOException {
        return context.constructSpecializedType(superType, Type.getTypeByName(id).orElseThrow().getRelatedClass());
    }

    @Override
    public Id getMechanism() {
        return Id.NAME;
    }
}
