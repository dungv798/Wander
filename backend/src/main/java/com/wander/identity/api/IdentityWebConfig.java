package com.wander.identity.api;

import com.wander.identity.application.IdentityService;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import tools.jackson.databind.ObjectMapper;

@Configuration
public class IdentityWebConfig {

    @Bean
    public FilterRegistrationBean<SessionAuthenticationFilter> sessionAuthenticationFilter(IdentityService identities,
                                                                                         ObjectMapper mapper) {
        FilterRegistrationBean<SessionAuthenticationFilter> reg =
                new FilterRegistrationBean<>(new SessionAuthenticationFilter(identities, mapper));
        reg.addUrlPatterns("/api/*");
        reg.setOrder(Ordered.HIGHEST_PRECEDENCE + 10);
        return reg;
    }
}
