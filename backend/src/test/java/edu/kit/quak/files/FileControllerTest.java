package edu.kit.quak.files;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import edu.kit.quak.QuaKApplicationTests;
import edu.kit.quak.files.model.Directory;
import edu.kit.quak.files.model.File;
import edu.kit.quak.files.model.Project;
import edu.kit.quak.files.model.Type;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Random;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class FileControllerTest extends QuaKApplicationTests {

    public static final String JSON_CONTENT_TYPE = "application/json";

    @Autowired
    private MockMvc mockMvc;

    private Project parent;

    @BeforeEach
    void setUp() {
        parent = projects.save(new Project());
    }

    @AfterEach
    void tearDown() {
        projects.deleteById(parent.getId());
    }

    @Test
    void newFile() throws Exception {
        JsonObject sent = getResource("file.json");

        mockMvc.perform(
                post("/file/")
                        .content(sent.toString())
                        .contentType(JSON_CONTENT_TYPE)
                        .header("parent_id", parent.getId())
                ).andExpectAll(
                        status().isCreated(),
                        content().contentType(JSON_CONTENT_TYPE),
                        jsonPath("$.id", notNullValue()),
                        jsonPath("$.id", not("")),
                        jsonPath("$.name", is(sent.getAsJsonPrimitive("name").getAsString())),
                        jsonPath("$.type", is(sent.getAsJsonPrimitive("type").getAsString())),
                        jsonPath("$.createdOn", equalTo(sent.getAsJsonPrimitive("createdOn").getAsLong()), Long.class)
               );
    }

    private JsonObject getResource(String name) throws IOException {
        return JsonParser.parseString(
                new ClassPathResource("edu/kit/quak/files/" + name).getContentAsString(StandardCharsets.UTF_8)
        ).getAsJsonObject();

    }

    @Test
    void newDirectory() throws Exception {
        JsonObject sent = getResource("directory.json");

        mockMvc.perform(
                post("/file/")
                        .content(sent.toString())
                        .contentType(JSON_CONTENT_TYPE)
                        .header("parent_id", parent.getId())
        ).andExpectAll(
                status().isCreated(),
                content().contentType(JSON_CONTENT_TYPE),
                jsonPath("$.id", notNullValue()),
                jsonPath("$.id", not("")),
                jsonPath("$.name", is(sent.getAsJsonPrimitive("name").getAsString())),
                jsonPath("$.type", is(sent.getAsJsonPrimitive("type").getAsString())),
                jsonPath("$.contents", empty())
        );
    }

    @Test
    void retrieveFile() throws Exception {
        //Creating without a parent because the file shouldn't even know its parent
        File query = files.save(new File("Neu"));
        mockMvc.perform(get("/file/"+query.getId()))
               .andExpectAll(
                       status().isOk(),
                       jsonPath("$.id", is(query.getId())),
                       jsonPath("$.name", is(query.getName())),
                       jsonPath("$.type", is(Type.FILE.name))
               );
    }

    @Test
    void retrieveDirectory() throws Exception {
        //Creating without a parent because the directory shouldn't even know its parent
        Directory query = directories.save(new Directory());
        mockMvc.perform(get("/file/"+query.getId()))
               .andExpectAll(
                       status().isOk(),
                       jsonPath("$.id", is(query.getId())),
                       jsonPath("$.name", is(query.getName())),
                       jsonPath("$.contents", empty()),
                       jsonPath("$.type", is(Type.DIRECTORY.name))
               );
    }

    @Test
    void deleteFile() throws Exception {
        File toDelete = files.save(new File("Fi"));
        mockMvc.perform(delete("/file/" + toDelete.getId()))
                .andExpect(status().isOk());
        Assertions.assertTrue(files.findById(toDelete.getId()).isEmpty());
        mockMvc.perform(get("/file/"+toDelete.getId()))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void deleteDirectory() throws Exception {
        Directory toDelete = directories.save(new Directory());
        mockMvc.perform(delete("/file/" + toDelete.getId()))
               .andExpect(status().isOk());
        Assertions.assertTrue(directories.findById(toDelete.getId()).isEmpty());
        mockMvc.perform(get("/file/"+toDelete.getId()))
               .andExpect(status().is4xxClientError());
    }

    @Test
    void patchFile() throws Exception {
        File toPatch = files.save(new File("Hi"));
        final String name = UUID.randomUUID().toString();

        JsonObject patch = new JsonObject();
        patch.addProperty("name", name);
        patch.addProperty("lastAccess", Instant.now().plus(5, ChronoUnit.HOURS).getEpochSecond());

        mockMvc.perform(
                patch("/file/" + toPatch.getId())
                        .contentType(JSON_CONTENT_TYPE)
                        .content(patch.toString())
               ).andExpect(status().isOk());

        File patched = files.findById(toPatch.getId()).orElseThrow();
        assertEquals(name, patched.getName());
        assertEquals(toPatch.getCreatedOn().getEpochSecond(), patched.getCreatedOn().getEpochSecond());
        assertNotEquals(toPatch.getLastAccess(), patched.getLastAccess());
    }


    @Test
    @Transactional
    void patchDirectory() throws Exception {
        Directory toPatch = directories.save(new Directory());
        final String name = UUID.randomUUID().toString();

        JsonObject patch = new JsonObject();
        patch.addProperty("name", name);

        mockMvc.perform(
                patch("/file/" + toPatch.getId())
                        .contentType(JSON_CONTENT_TYPE)
                        .content(patch.toString())
        ).andExpect(status().isOk());

        Directory patched = directories.findById(toPatch.getId()).orElseThrow();
        assertEquals(name, patched.getName());
        assertEquals(toPatch.getContent(), patched.getContent());
    }

    @Test
    @Transactional
    void notPatchingDirectoryContent() throws Exception {
        Directory toPatch = directories.save(new Directory());
        JsonObject patch = new JsonObject();
        patch.add("contents", getResource("file.json"));

        mockMvc.perform(
                patch("/file/" + toPatch.getId())
                        .contentType(JSON_CONTENT_TYPE)
                        .content(patch.toString())
        );

        Directory patched = directories.findById(toPatch.getId()).orElseThrow();
        assertTrue(patched.getContent().isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {MediaType.APPLICATION_JSON_VALUE, MediaType.TEXT_HTML_VALUE, MediaType.TEXT_PLAIN_VALUE, MediaType.TEXT_XML_VALUE})
    void postAndGetFileContent(String contentType) throws Exception {
        File file = files.save(new File("Hi"));

        byte[] content = new byte[200];
        new Random().nextBytes(content);

        //MockMvc adds a ";charset=UTF-8" to end of Content-Type-header.
        //since this is not directly an error/bug, we store the header
        //for later query.
        String contentHeader = mockMvc.perform(
                put(String.format("/file/%s/content", file.getId()))
                        .content(content)
                        .header("Content-Type", contentType)
        ).andExpect(
                status().isOk()
        ).andReturn().getRequest().getHeader("Content-Type");

        mockMvc.perform(
                get(String.format("/file/%s/content", file.getId()))
        ).andExpectAll(
                status().isOk(),
                content().contentType(contentHeader),
                content().bytes(content)
        );
        files.deleteById(file.getId());
    }

    @Test
    void fileContentOver1MB() throws Exception {
        byte[] bytes = new byte[1500000];
        new Random().nextBytes(bytes);
        File file = files.save(new File("Hi"));
        mockMvc.perform(
                put(String.format("/file/%s/content", file.getId()))
                        .content(bytes)
                        .contentType("*/*")
        ).andExpect(
                status().isOk()
        );

        mockMvc.perform(
                get(String.format("/file/%s/content", file.getId()))
        ).andExpectAll(
                status().isOk(),
                content().bytes(bytes)
        );
        files.deleteById(file.getId());
    }

    @Test
    void fileContentEmptyAfterCreation() throws Exception {
        File file = files.save(new File("Hi"));
        mockMvc.perform(
                get(String.format("/file/%s/content", file.getId()))
        ).andExpectAll(
                status().isOk(),
                jsonPath("$").doesNotExist()
        );
        files.deleteById(file.getId());
    }

    @Test
    void failOnDirectoryContentEndpoint() throws Exception {
        Directory dir = directories.save(new Directory());
        mockMvc.perform(
                get(String.format("/file/%s/content", dir.getContent()))
        ).andExpect(
                status().is4xxClientError()
        );
    }

    @Test
    void failOnSetDirectoryContent() throws Exception {
        Directory dir = directories.save(new Directory());
        mockMvc.perform(
                put(String.format("/file/%s/content", dir.getContent()))
                        .contentType("text/plain")
                        .content("Hello World")
        ).andExpect(
                status().is4xxClientError()
        );
    }

    @Test
    void failOnAddFileToFile() throws Exception {
        File parent = files.save(new File("parent"));
        mockMvc.perform(
                get("/file/")
                        .header("parent_id", parent.getId())
        ).andExpect(
                status().is4xxClientError()
        );
    }
}