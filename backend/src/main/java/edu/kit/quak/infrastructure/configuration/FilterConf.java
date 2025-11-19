package edu.kit.quak.infrastructure.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ser.impl.SimpleFilterProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;

@Configuration
public class FilterConf extends MappingJackson2HttpMessageConverter {
    public FilterConf(ObjectMapper objectMapper) {
        super(objectMapper);
        objectMapper.setFilterProvider(new SimpleFilterProvider().addFilter(DepthFilter.FILTER_NAME, new DepthFilter()));
    }
}
