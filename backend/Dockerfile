# Ảnh chạy backend (dùng cho docker compose cục bộ và, khi được duyệt, ECS Fargate trên AWS — ADR-006).
# Build jar trước: .\gradlew.bat bootJar  (hoặc tools\dev.ps1 backend-build)
# KHÔNG dùng cho Render/Neon: bản demo miễn phí build từ Dockerfile Ở GỐC REPO (heap cố định -Xmx256m, profile free, có giao diện web).
# Tệp này chỉ cho compose cục bộ và AWS; MaxRAMPercentage=75 phụ thuộc giới hạn RAM của task (rà kiến trúc 08/11/2026).
FROM eclipse-temurin:25-jre-alpine

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
