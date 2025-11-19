package edu.kit.quak.infrastructure.configuration;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.PropertyWriter;
import com.fasterxml.jackson.databind.ser.impl.SimpleBeanPropertyFilter;

import java.util.HashSet;
import java.util.List;

public class DepthFilter extends SimpleBeanPropertyFilter {

    public static final String FILTER_NAME = "depth_filter_ignore";

    private static final HashSet<String> IGNORE = new HashSet<>(List.of("contents"));

    @Override
    public void serializeAsField(Object pojo, JsonGenerator jgen, SerializerProvider provider, PropertyWriter writer) throws Exception {
        if (!IGNORE.contains(writer.getName())) {
            writer.serializeAsField(pojo, jgen, provider);
        }
    }
}
