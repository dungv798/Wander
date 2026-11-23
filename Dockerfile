# Build từ root repo; không cần DB hay secret ở thời điểm build.
FROM node:24-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85 AS web-build
WORKDIR /src
COPY web/package.json web/package-lock.json ./web/
RUN npm ci --prefix web --no-audit --no-fund
COPY web/ ./web/
RUN npm --prefix web run build

FROM eclipse-temurin:24-jdk-alpine@sha256:8fdbcb6bc6b846640cea7058e6eeb56c311fae4efaa506a213789134065c6b90 AS backend-build
WORKDIR /src/backend
COPY backend/ ./
RUN sh ./gradlew --no-daemon bootJar --console=plain

FROM eclipse-temurin:24-jre-alpine@sha256:4044b6c87cb088885bcd0220f7dc7a8a4aab76577605fa471945d2e98270741f AS runtime
RUN addgroup -S wander && adduser -S wander -G wander
WORKDIR /app
# Tệp chạy thuộc root, người dùng wander chỉ đọc: nếu có RCE thì không ghi đè được jar hay giao diện.
COPY --from=backend-build /src/backend/build/libs/wander-backend.jar /app/app.jar
COPY --from=web-build /src/web/dist /app/web
USER wander
# TieredStopAtLevel=1 (chỉ trình biên dịch C1) + SerialGC: khi CPU ít (Render Free) khởi động nhanh gần gấp đôi
# (đo 11/11/2026 ở 0,25 CPU: 124 s -> 65 s, DR-037); đổi lại đỉnh hiệu năng thấp hơn, chấp nhận với tải nhỏ.
ENV SPRING_PROFILES_ACTIVE=free \
    WANDER_BIND_ADDRESS=0.0.0.0 \
    WANDER_WEB_DIR=/app/web \
    PORT=8787 \
    JAVA_TOOL_OPTIONS="-Xms64m -Xmx256m -XX:+ExitOnOutOfMemoryError -XX:TieredStopAtLevel=1 -XX:+UseSerialGC"
EXPOSE 8787
# Probe không query DB, tránh đánh thức Neon mỗi vài giây.
HEALTHCHECK --interval=30s --timeout=3s --start-period=120s --retries=3 \
    CMD wget -qO- "http://127.0.0.1:${PORT}/actuator/health/readiness" || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
