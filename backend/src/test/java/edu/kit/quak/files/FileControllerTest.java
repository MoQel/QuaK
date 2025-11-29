package edu.kit.quak.files;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import edu.kit.quak.QuaKApplicationTests;
import edu.kit.quak.files.model.Directory;
import edu.kit.quak.files.model.File;
import edu.kit.quak.files.model.Project;
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
import org.springframework.test.web.servlet.MvcResult;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Iterator;
import java.util.Random;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import edu.kit.quak.security.model.User;
import edu.kit.quak.security.repository.UserRepository;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;

@SpringBootTest
@AutoConfigureMockMvc
class FileControllerTest extends QuaKApplicationTests {

    public static final String JSON_CONTENT_TYPE = "application/json";

    private final ObjectMapper mapper = new ObjectMapper();

    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private UserRepository users;

    private Project parent;
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setIssuer("test");
        testUser.setSub("test-sub");
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");
        if (users.findByIssuerAndSub("test", "test-sub").isEmpty()) {
             testUser = users.save(testUser);
        } else {
             testUser = users.findByIssuerAndSub("test", "test-sub").get();
        }

        parent = new Project("Main");
        parent.setOwner(testUser);
        parent = projects.save(parent);
    }

    private org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.OidcLoginRequestPostProcessor auth() {
        return oidcLogin().idToken(token -> token.claim("sub", "test-sub"));
    }

    @AfterEach
    void tearDown() {
        savers.delete(parent.getId());
    }

    @Test
    void newFile() throws Exception {
        JsonNode sent = getResource("file.json");

        mockMvc.perform(
                post("/file/")
                        .content(sent.toString())
                        .contentType(JSON_CONTENT_TYPE)
                        .contentType(JSON_CONTENT_TYPE)
                        .header("parent-id", parent.getId())
                        .with(csrf())
                        .with(auth())
                ).andExpectAll(
                        status().isCreated(),
                        content().contentType(JSON_CONTENT_TYPE),
                        jsonPath("$.id", notNullValue()),
                        jsonPath("$.id", not("")),
                        jsonPath("$.name", is(sent.get("name").asText())),
                        jsonPath("$.type", is(sent.get("type").asText())),
                        jsonPath("$.createdOn", equalTo(sent.get("createdOn").asLong()), Long.class),
                        jsonPath("$.contentType", equalTo(MediaType.ALL_VALUE))
               );
    }

    public static JsonNode getResource(String name) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readTree(new ClassPathResource("edu/kit/quak/files/" + name).getContentAsString(StandardCharsets.UTF_8));
    }

    @Test
    void newDirectory() throws Exception {
        JsonNode sent = getResource("directory.json");

        mockMvc.perform(
                post("/file/")
                        .content(sent.toString())
                        .contentType(JSON_CONTENT_TYPE)
                        .contentType(JSON_CONTENT_TYPE)
                        .header("parent-id", parent.getId())
                        .with(csrf())
                        .with(auth())
        ).andExpectAll(
                status().isCreated(),
                content().contentType(JSON_CONTENT_TYPE),
                jsonPath("$.id", notNullValue()),
                jsonPath("$.id", not("")),
                jsonPath("$.name", is(sent.get("name").asText())),
                jsonPath("$.type", is(sent.get("type").asText())),
                jsonPath("$.contents", empty())
        );
    }

    @Test
    void retrieveFile() throws Exception {
        //Creating with parent so it has an owner
        File query = files.save(new File("Neu", parent));
        mockMvc.perform(get("/file/"+query.getId()).with(auth()))
               .andExpectAll(
                       status().isOk(),
                       jsonPath("$.id", is(query.getId())),
                       jsonPath("$.name", is(query.getName())),
                       jsonPath("$.type", is(query.getTypeIdentifier()))
               );
    }

    @Test
    void retrieveDirectory() throws Exception {
        //Creating with parent so it has an owner
        Directory query = directories.save(new Directory("Hi", parent));
        mockMvc.perform(get("/file/"+query.getId()).with(auth()))
               .andExpectAll(
                       status().isOk(),
                       jsonPath("$.id", is(query.getId())),
                       jsonPath("$.name", is(query.getName())),
                       jsonPath("$.contents", empty()),
                       jsonPath("$.type", is(query.getTypeIdentifier()))
               );
    }

    @Test
    void deleteFile() throws Exception {
        File toDelete = files.save(new File("Fi", parent));
        mockMvc.perform(delete("/file/" + toDelete.getId()).with(csrf()).with(auth()))
                .andExpect(status().isOk());
        Assertions.assertTrue(files.findById(toDelete.getId()).isEmpty());
        mockMvc.perform(get("/file/"+toDelete.getId()).with(auth()))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void deleteDirectory() throws Exception {
        Directory toDelete = directories.save(new Directory("toDelete", parent));
        mockMvc.perform(delete("/file/" + toDelete.getId()).with(csrf()).with(auth()))
                .andExpect(status().isOk());
        Assertions.assertTrue(directories.findById(toDelete.getId()).isEmpty());
        mockMvc.perform(get("/file/"+toDelete.getId()).with(auth()))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void patchFile() throws Exception {
        File toPatch = files.save(new File("Hi", parent));
        final String name = UUID.randomUUID().toString();

        ObjectNode patch = mapper.createObjectNode();
        patch.put("name", name);
        patch.put("lastAccess", Instant.now().plus(5, ChronoUnit.HOURS).getEpochSecond());

        mockMvc.perform(
                patch("/file/" + toPatch.getId())
                        .contentType(JSON_CONTENT_TYPE)
                        .contentType(JSON_CONTENT_TYPE)
                        .content(patch.toString())
                        .with(csrf())
                        .with(auth())
               ).andExpect(status().isOk());

        File patched = files.findById(toPatch.getId()).orElseThrow();
        assertEquals(name, patched.getName());
        assertEquals(toPatch.getCreatedOn().getEpochSecond(), patched.getCreatedOn().getEpochSecond());
        assertNotEquals(toPatch.getLastAccess(), patched.getLastAccess());
    }


    @Test
    @Transactional
    void patchDirectory() throws Exception {
        Directory toPatch = directories.save(new Directory("toPatch", parent));
        final String name = UUID.randomUUID().toString();

        ObjectNode patch = mapper.createObjectNode();
        patch.put("name", name);

        mockMvc.perform(
                patch("/file/" + toPatch.getId())
                        .contentType(JSON_CONTENT_TYPE)
                        .contentType(JSON_CONTENT_TYPE)
                        .content(patch.toString())
                        .with(csrf())
                        .with(auth())
        ).andExpect(status().isOk());

        Directory patched = directories.findById(toPatch.getId()).orElseThrow();
        assertEquals(name, patched.getName());
        assertEquals(toPatch.getElements(), patched.getElements());
    }

    @Test
    @Transactional
    void notPatchingDirectoryContent() throws Exception {
        Directory toPatch = directories.save(new Directory("toPatch", parent));
        ObjectNode patch = mapper.createObjectNode();
        ArrayNode contents = mapper.createArrayNode();
        contents.add(getResource("file.json"));
        patch.set("contents", contents);

        mockMvc.perform(
                patch("/file/" + toPatch.getId())
                        .contentType(JSON_CONTENT_TYPE)
                        .contentType(JSON_CONTENT_TYPE)
                        .content(patch.toString())
                        .with(csrf())
                        .with(auth())
        ).andExpect(status().isBadRequest());

        Directory patched = directories.findById(toPatch.getId()).orElseThrow();
        assertTrue(patched.getElements().isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {MediaType.APPLICATION_JSON_VALUE, MediaType.TEXT_HTML_VALUE, MediaType.TEXT_PLAIN_VALUE, MediaType.TEXT_XML_VALUE})
    void postAndGetFileContent(String contentType) throws Exception {
        File file = files.save(new File("Hi", parent));

        byte[] content = new byte[200];
        new Random().nextBytes(content);

        //MockMvc adds a ";charset=UTF-8" to end of Content-Type-header.
        //since this is not directly an error/bug, we store the header
        //for later query.
        String contentHeader = mockMvc.perform(
                put(String.format("/file/%s/content", file.getId()))
                        .content(content)
                        .content(content)
                        .header("Content-Type", contentType)
                        .with(csrf())
                        .with(auth())
        ).andExpect(
                status().isOk()
        ).andReturn().getRequest().getHeader("Content-Type");

        mockMvc.perform(
                get(String.format("/file/%s/content", file.getId())).with(auth())
        ).andExpectAll(
                status().isOk(),
                content().contentType(contentHeader),
                content().bytes(content)
        );

        mockMvc.perform(
                get("/file/"+file.getId()).with(auth())
        ).andExpectAll(
                status().isOk(),
                jsonPath("$.contentType", startsWith(contentType))
        );

        files.deleteById(file.getId());
    }

    @Test
    void fileContentOver1MB() throws Exception {
        byte[] bytes = new byte[1500000];
        new Random().nextBytes(bytes);
        File file = files.save(new File("Hi", parent));
        mockMvc.perform(
                put(String.format("/file/%s/content", file.getId()))
                        .content(bytes)
                        .content(bytes)
                        .contentType("*/*")
                        .with(csrf())
                        .with(auth())
        ).andExpect(
                status().isOk()
        );

        mockMvc.perform(
                get(String.format("/file/%s/content", file.getId())).with(auth())
        ).andExpectAll(
                status().isOk(),
                content().bytes(bytes)
        );
        files.deleteById(file.getId());
    }

    @Test
    void fileContentEmptyAfterCreation() throws Exception {
        File file = files.save(new File("Hi", parent));
        mockMvc.perform(
                get(String.format("/file/%s/content", file.getId())).with(auth())
        ).andExpectAll(
                status().isOk(),
                jsonPath("$").doesNotExist()
        );
        files.deleteById(file.getId());
    }

    @Test
    void failOnDirectoryContentEndpoint() throws Exception {
        Directory dir = directories.save(new Directory("dir", parent));
        mockMvc.perform(
                get(String.format("/file/%s/content", dir.getElements())).with(auth())
        ).andExpect(
                status().is4xxClientError()
        );
    }

    @Test
    void failOnSetDirectoryContent() throws Exception {
        Directory dir = directories.save(new Directory("dir", parent));
        mockMvc.perform(
                put(String.format("/file/%s/content", dir.getElements()))
                        .contentType("text/plain")
                        .contentType("text/plain")
                        .content("Hello World")
                        .with(csrf())
                        .with(auth())
        ).andExpect(
                status().is4xxClientError()
        );
    }

    @Test
    void failOnAddFileToFile() throws Exception {
        File parent = files.save(new File("parent", this.parent));
        mockMvc.perform(
                get("/file/")
                        .header("parent-id", parent.getId())
                        .with(auth())
        ).andExpect(
                status().is4xxClientError()
        );
    }

    @Test
    @Transactional
    //We don't allow the content of a contained directory to be displayed
    void noRecursiveDirectoryContent() throws Exception {
        Directory main = new Directory("main", parent);
        Directory lower = new Directory("lower", main);
        File file = files.save(new File("Hi", lower));
        lower = directories.save(lower);
        main = directories.save(main);

        mockMvc.perform(
            get("/file/" + main.getId()).with(auth())
        ).andExpectAll(
            status().isOk(),
            jsonPath("$.name", is(main.getName())),
            jsonPath("$.contents").isArray(),
            jsonPath("$.contents[0].name", is(lower.getName())),
            jsonPath("$.contents[0].type", is(lower.getTypeIdentifier())),
            jsonPath("$.contents[0].contents").doesNotExist()
        );

        //Make sure `lower` has contents
        mockMvc.perform(
            get("/file/" + lower.getId()).with(auth())
        ).andExpectAll(
            status().isOk(),
            jsonPath("$.contents[0].name", is(file.getName()))
        );
    }

    @Test
    void cantRequestProjectInFileEndpoint() throws Exception {
        Project project = new Project("Test");
        project.setOwner(testUser);
        project = projects.save(project);
        mockMvc.perform(
                get("/file/"+project.getId()).with(auth())
        ).andExpectAll(
                status().isBadRequest()
        );
    }

    @Test
    void failOnCreatedOnMissingInFile() throws Exception {
        JsonNode toSend = withoutField("createdOn", getResource("file.json"));

        mockMvc.perform(
                post("/file/")
                    .header("parent-id", parent.getId())
                    .contentType(JSON_CONTENT_TYPE)
                    .contentType(JSON_CONTENT_TYPE)
                    .content(toSend.toString())
                    .with(csrf())
                    .with(auth())
        ).andExpectAll(
                status().isBadRequest()
        );
    }

    private JsonNode withoutField(String field, JsonNode original) {
        ObjectNode modified = mapper.createObjectNode();
        for (Iterator<String> it = original.fieldNames(); it.hasNext(); ) {
            String name = it.next();
            if (!name.equals(field))
                modified.set(name, original.get(name));
        }
        return modified;
    }

    @Test
    void failNotOnLastAccessMissingInFile() throws Exception {
        JsonNode toSend = withoutField("lastAccess", getResource("file.json"));

        MvcResult result = mockMvc.perform(
                post("/file/")
                        .header("parent-id", parent.getId())
                        .contentType(JSON_CONTENT_TYPE)
                        .contentType(JSON_CONTENT_TYPE)
                        .content(toSend.toString())
                        .with(csrf())
                        .with(auth())
        ).andExpectAll(
                status().isCreated()
        ).andReturn();

        JsonNode response = mapper.readTree(result.getResponse().getContentAsString());

        mockMvc.perform(
                get("/file/"+response.get("id").asText()).with(auth())
        ).andExpectAll(
                status().isOk(),
                jsonPath("$.lastAccess", notNullValue())
        );
    }

    @Test
    @Transactional
    void successfulDeletionOfContentInProject() throws Exception {
        Project project = new Project("New");
        project.setOwner(testUser);
        project = projects.save(project);
        Directory dir = directories.save(new Directory("Hi", project));
        File file = files.save(new File("", dir));
        directories.save(dir);
        projects.save(project);

        mockMvc.perform(delete("/file/" + dir.getId()).with(csrf()).with(auth()))
               .andExpectAll(
                       status().isOk()
               );

        mockMvc.perform(get("/file/" + dir.getId()).with(auth()))
                       .andExpectAll(status().is4xxClientError());

        mockMvc.perform(get("/file/" + file.getId()).with(auth()))
               .andExpectAll(status().is4xxClientError());

        assertFalse(projects.findById(project.getId()).orElseThrow().getElements().contains(dir));

        files.delete(file);
        directories.delete(dir);
        projects.delete(project);
    }

    @Test
    @Transactional
    void deleteFileInProject() throws Exception {
        File file = files.save(new File("", parent));

        mockMvc.perform(delete("/file/" + file.getId()).with(csrf()).with(auth()))
                .andExpectAll(status().isOk());

        assertTrue(files.findById(file.getId()).isEmpty());
        assertTrue(projects.findById(parent.getId())
                           .get()
                           .getElements().stream()
                           .noneMatch(e -> e.getId().equals(file.getId()))
        );
    }

    @Test
    @Transactional
    void deleteDirectoryInProject() throws Exception {
        Directory dir = directories.save(new Directory("", parent));

        mockMvc.perform(delete("/file/" + dir.getId()).with(csrf()).with(auth()))
                .andExpectAll(status().isOk());

        assertTrue(directories.findById(dir.getId()).isEmpty());
        assertTrue(projects.findById(parent.getId())
                           .get()
                           .getElements().stream()
                           .noneMatch(e -> e.getId().equals(dir.getId()))
        );
    }
}