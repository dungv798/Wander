package com.wander.shared.web;

import com.wander.shared.kernel.AuthenticatedPrincipal;
import com.wander.shared.kernel.ErrorKind;
import com.wander.shared.kernel.WanderException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.MethodParameter;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Cho phép controller nhận {@link AuthenticatedPrincipal} làm tham số. Bộ lọc xác thực (module identity)
 * đặt principal vào thuộc tính yêu cầu; nếu thiếu thì yêu cầu không có phiên hợp lệ.
 */
public final class CurrentPrincipal implements HandlerMethodArgumentResolver {

    public static final String REQUEST_ATTRIBUTE = AuthenticatedPrincipal.class.getName();

    public static void set(HttpServletRequest request, AuthenticatedPrincipal principal) {
        request.setAttribute(REQUEST_ATTRIBUTE, principal);
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.getParameterType() == AuthenticatedPrincipal.class;
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        HttpServletRequest request = webRequest.getNativeRequest(HttpServletRequest.class);
        Object p = request == null ? null : request.getAttribute(REQUEST_ATTRIBUTE);
        if (p instanceof AuthenticatedPrincipal principal) return principal;
        throw new WanderException(ErrorKind.UNAUTHENTICATED, "UNAUTHENTICATED", "Cần phiên hợp lệ.", null, null);
    }
}
