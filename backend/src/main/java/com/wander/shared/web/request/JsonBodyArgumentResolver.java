package com.wander.shared.web.request;

import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.constant.ErrorMessages;
import com.wander.shared.kernel.constant.SystemConstants;
import com.wander.shared.kernel.error.ErrorKind;
import com.wander.shared.kernel.error.WanderException;
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

    private final ObjectMapper mapper;

    /** Tạo bộ đọc với công cụ phân tích JSON dùng chung. */
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
        return new JsonBody(parseJsonObject(bytes));
    }

    /** Phân tích byte thành đối tượng JSON; không phải JSON hoặc không phải đối tượng thì báo lỗi INVALID_JSON. */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJsonObject(byte[] bytes) {
        Object parsed;
        try {
            parsed = mapper.readValue(bytes, Object.class);
        } catch (JacksonException e) {
            throw WanderException.invalid(ErrorCodes.INVALID_JSON, ErrorMessages.JSON_SYNTAX_INVALID, null);
        }
        if (!(parsed instanceof Map<?, ?> map)) {
            throw WanderException.invalid(ErrorCodes.INVALID_JSON, ErrorMessages.JSON_OBJECT_REQUIRED, null);
        }
        return (Map<String, Object>) map;
    }

    /** Đọc toàn bộ luồng nhưng dừng với lỗi 413 ngay khi vượt giới hạn kích thước thân yêu cầu. */
    private static byte[] readLimited(InputStream in) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buffer = new byte[JsonBodyConstants.READ_BUFFER_BYTES];
        int total = 0;
        int read;
        while ((read = in.read(buffer)) != -1) {
            total += read;
            if (total > SystemConstants.MAX_REQUEST_BODY_BYTES) {
                throw new WanderException(ErrorKind.PAYLOAD_TOO_LARGE, ErrorCodes.BODY_TOO_LARGE, ErrorMessages.BODY_TOO_LARGE, null, null);
            }
            out.write(buffer, 0, read);
        }
        return out.toByteArray();
    }
}
