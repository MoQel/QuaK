package edu.kit.quak.infrastructure.config;

import java.io.File;
import java.io.FileNotFoundException;
import java.util.Scanner;

/** Utility class to load environment variables from a .env file. */
public class DotenvLoader {

    /**
     * Loads environment variables from a .env file if it exists. This allows IDE debugging to work
     * without manual environment configuration. It sets variables as system properties if they are
     * not already set.
     */
    public static void loadEnv() {
        File envFile = new File(".env");
        if (!envFile.exists()) {
            // Try one directory up (common when running from IDE inside backend folder)
            envFile = new File("../.env");
        }

        if (envFile.exists()) {
            try (Scanner scanner = new Scanner(envFile)) {
                while (scanner.hasNextLine()) {
                    String line = scanner.nextLine().trim();
                    if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                        continue;
                    }
                    String[] parts = line.split("=", 2);
                    String key = parts[0].trim();
                    String value = parts[1].trim();

                    // Only set if not already defined in System Properties or Environment Variables
                    if (System.getProperty(key) == null && System.getenv(key) == null) {
                        System.setProperty(key, value);
                    }
                }
            } catch (FileNotFoundException e) {
                // Ignore as it's a best-effort load for local development
            }
        }
    }
}
