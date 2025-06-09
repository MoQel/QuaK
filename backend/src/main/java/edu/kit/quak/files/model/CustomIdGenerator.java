package edu.kit.quak.files.model;

import org.hibernate.HibernateException;
import org.hibernate.MappingException;
import org.hibernate.annotations.IdGeneratorType;
import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.enhanced.SequenceStyleGenerator;
import org.hibernate.service.ServiceRegistry;
import org.hibernate.type.Type;
import org.hibernate.type.descriptor.java.spi.JavaTypeBasicAdaptor;
import org.hibernate.type.descriptor.jdbc.NumericJdbcType;
import org.hibernate.type.internal.NamedBasicTypeImpl;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.Properties;

public class CustomIdGenerator extends SequenceStyleGenerator {
    @Override
    public Object generate(SharedSessionContractImplementor session, Object object) throws HibernateException {
        Object id = super.generate(session, object);
        if (object instanceof FileElement<?> element) {
            id = element.getType().toId(id);
        }
        return id;
    }

    @Override
    public void configure(Type type, Properties parameters, ServiceRegistry serviceRegistry) throws MappingException {
        parameters.put( "increment_size", 1);
        Type idType = new NamedBasicTypeImpl<>( new JavaTypeBasicAdaptor<>( Integer.class ), NumericJdbcType.INSTANCE, "int" );
        super.configure( idType, parameters, serviceRegistry );
    }

    @IdGeneratorType(CustomIdGenerator.class)
    @Retention(RetentionPolicy.RUNTIME)
    @Target({ElementType.FIELD, ElementType.METHOD})
    public @interface FileElementId {
    }
}
