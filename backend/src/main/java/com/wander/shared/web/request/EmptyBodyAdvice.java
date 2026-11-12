package com.wander.shared.web.request;

import java.lang.reflect.Type;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdviceAdapter;
import tools.jackson.databind.ObjectMapper;

/**
 * An empty request body is read as an empty JSON object, so endpoints whose fields are all optional (for example "begin a new
 * recovery code") accept a request with no body at all, exactly as the hand-written body reader did before.
 */
@ControllerAdvice
public class EmptyBodyAdvice extends RequestBodyAdviceAdapter {

    private final ObjectMapper mapper;

    /** Takes the shared JSON mapper used to build the empty request object. */
    public EmptyBodyAdvice(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    /** Applies to every {@code @RequestBody} parameter. */
    @Override
    public boolean supports(MethodParameter parameter, Type targetType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    /** Builds the target type from {@code {}}: every field absent. */
    @Override
    public Object handleEmptyBody(Object body, HttpInputMessage inputMessage, MethodParameter parameter, Type targetType,
                                  Class<? extends HttpMessageConverter<?>> converterType) {
        return mapper.readValue(RequestConstants.EMPTY_OBJECT, mapper.constructType(targetType));
    }
}
