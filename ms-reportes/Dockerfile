FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace
COPY pom.xml ./
COPY mvnw* ./
COPY .mvn .mvn
COPY src src
RUN chmod +x ./mvnw || true
RUN ./mvnw clean package -DskipTests || mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
EXPOSE 8088
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
