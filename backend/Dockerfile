# Ảnh chạy backend (dùng cho docker compose cục bộ và, khi được duyệt, ECS Fargate trên AWS — ADR-006).
# Build jar trước: .\gradlew.bat bootJar  (hoặc tools\dev.ps1 backend-build)
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S wander && adduser -S wander -G wander
WORKDIR /app
COPY build/libs/wander-backend.jar app.jar
USER wander

ENV WANDER_BIND_ADDRESS=0.0.0.0 \
    PORT=8787 \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8787
HEALTHCHECK --interval=15s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1:8787/actuator/health || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
