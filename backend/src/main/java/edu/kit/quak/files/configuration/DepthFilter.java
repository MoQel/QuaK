package edu.kit.quak.files.configuration;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonStreamContext;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.PropertyWriter;
import com.fasterxml.jackson.databind.ser.impl.SimpleBeanPropertyFilter;

import java.util.HashSet;
import java.util.List;

public class DepthFilter extends SimpleBeanPropertyFilter {

    public static final String FILTER_NAME = "depth_filter_ignore";

    private static final HashSet<String> IGNORE = new HashSet<>(List.of("contents"));

    private final static int MAX_DEPTH = 3;

    @Override
    public void serializeAsField(Object pojo, JsonGenerator jgen, SerializerProvider provider, PropertyWriter writer) throws Exception {
        JsonStreamContext context = jgen.getOutputContext();
        int depth = context.getNestingDepth();
        if (depth <= MAX_DEPTH && !isInnerContentField(depth, writer.getName()))
            writer.serializeAsField(pojo, jgen, provider);
    }

    //This code is taken in part from here: https://stackoverflow.com/a/51279460
    private int calcDepth(JsonGenerator jgen) {
        JsonStreamContext sc = jgen.getOutputContext();
        int depth = -1;
        while (sc != null) {
            sc = sc.getParent();
            depth++;
        }
        return depth;
    }

    private boolean isInnerContentField(int depth, String name) {
        return depth >= MAX_DEPTH - 1 && IGNORE.contains(name);
    }

    private String visualizePath(JsonGenerator j) {
        String out = "";
        JsonStreamContext sc = j.getOutputContext();
        while (sc != null) {
            out = (sc.getCurrentName() == null ? sc.toString() : sc.getCurrentName()) + "." + out;
            sc = sc.getParent();
        }
        return out;
    }
}
