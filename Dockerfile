# ESTÁGIO 1: Build
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app
COPY . .
# Removendo o 'clean' para ser mais direto
RUN ./gradlew build -x test --no-daemon

# ESTÁGIO 2: Execução
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]