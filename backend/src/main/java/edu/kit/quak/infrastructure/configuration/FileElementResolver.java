package edu.kit.quak.infrastructure.configuration;

import com.fasterxml.jackson.databind.DatabindContext;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.jsontype.impl.TypeIdResolverBase;
import edu.kit.quak.files.model.Directory;
import edu.kit.quak.files.model.File;
import edu.kit.quak.files.model.FileElement;
import edu.kit.quak.files.repository.savers.FileElementSaver;
import edu.kit.quak.files.repository.savers.FileElementSaversRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.IOException;

import static com.fasterxml.jackson.annotation.JsonTypeInfo.Id;

/**
 * Implements an ID-resolver for FileElements.
 * Especially the objects of class {@link Directory} and {@link File} use a {@link FileElement#TYPE_FIELD field}
 * to differentiate the objects in their JSON-representation.<br>
 * This value is used by this resolver to map a given FileElement to its subclass.
 *
 * @author Henrik K
 */
@Component
public class FileElementResolver extends TypeIdResolverBase {

    @Autowired
    private FileElementSaversRepository repository;

    private JavaType superType;

    @Override
    public void init(JavaType bt) {
        superType = bt;
    }

    @Override
    public String idFromValue(Object value) {
        return repository.getSaverForClass(value.getClass())
                         .map(FileElementSaver::getTypeIdentifier)
                         .orElseThrow(
                             () -> new IllegalStateException("Tried to serialize unknown class as FileElement")
                         );
    }

    @Override
    public String idFromValueAndType(Object value, Class<?> suggestedType) {
        return repository.getSaverForClass(suggestedType).orElseThrow().getTypeIdentifier();
    }

    @Override
    public JavaType typeFromId(DatabindContext context, String id) throws IOException {
        return context.constructSpecializedType(superType, repository.getSaverForTypeName(id).orElseThrow().getRelatedClass());
    }

    @Override
    public Id getMechanism() {
        return Id.NAME;
    }
}
