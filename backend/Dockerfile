FROM amazoncorretto:21-alpine3.21
COPY build/libs/QuaK-0.0.1-SNAPSHOT.jar quak.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "quak.jar"]