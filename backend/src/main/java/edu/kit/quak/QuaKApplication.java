package edu.kit.quak;

import edu.kit.quak.infrastructure.config.DotenvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class QuaKApplication {

    public static void main(String[] args) {
        DotenvLoader.loadEnv();
        SpringApplication.run(QuaKApplication.class, args);
    }
}
