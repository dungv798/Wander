package com.wander.shared.web;

import com.wander.shared.kernel.ErrorKind;
import com.wander.shared.kernel.WanderException;
import jakarta.servlet.http.HttpServletRequest;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

/** Đọc thân yêu cầu thành {@link JsonBody}: giới hạn 64 KB, rỗng = {}, phải là đối tượng JSON. */
public class JsonBodyArgumentResolver implements HandlerMethodArgumentResolver {

    public static final int MAX_BODY_BYTES = 64 * 1024;

    private final ObjectMapper mapper;

    public JsonBodyArgumentResolver(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.getParameterType() == JsonBody.class;
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) throws IOException {
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        if (request == null) return JsonBody.empty();
        byte[] bytes = readLimited(request.getInputStream());
        if (bytes.length == 0) return JsonBody.empty();
        Object parsed;
        try {
            parsed = mapper.readValue(bytes, Object.class);
        } catch (JacksonException e) {
            throw WanderException.invalid("INVALID_JSON", "Nội dung không phải JSON hợp lệ.", null);
        }
        if (!(parsed instanceof Map<?, ?> map)) {
            throw WanderException.invalid("INVALID_JSON", "Nội dung phải là một đối tượng JSON.", null);
        }
        @SuppressWarnings("unchecked")
        Map<String, Object> values = (Map<String, Object>) map;
        return new JsonBody(values);
    }

    private static byte[] readLimited(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int total = 0;
        int n;
        while ((n = in.read(buf)) != -1) {
            total += n;
            if (total > MAX_BODY_BYTES) {
                throw new WanderException(ErrorKind.PAYLOAD_TOO_LARGE, "BODY_TOO_LARGE", "Nội dung gửi lên quá lớn.", null, null);
            }
            out.write(buf, 0, n);
        }
        return out.toByteArray();
    }
}
