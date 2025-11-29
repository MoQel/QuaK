package edu.kit.quak.files;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import edu.kit.quak.QuaKApplicationTests;
import edu.kit.quak.files.model.Directory;
import edu.kit.quak.files.model.File;
import edu.kit.quak.files.model.Project;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultMatcher;

import java.util.UUID;
import java.util.function.Function;

import static edu.kit.quak.files.FileControllerTest.JSON_CONTENT_TYPE;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import edu.kit.quak.security.model.User;
import edu.kit.quak.security.repository.UserRepository;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oidcLogin;

@SpringBootTest
@AutoConfigureMockMvc
class ProjectControllerTest extends QuaKApplicationTests {

    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private UserRepository users;

    private final ObjectMapper mapper = new ObjectMapper();
    
    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setIssuer("test");
        testUser.setSub("test-sub");
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");
        // Ensure unique user for each test run if DB is not reset
        if (users.findByIssuerAndSub("test", "test-sub").isEmpty()) {
             testUser = users.save(testUser);
        } else {
             testUser = users.findByIssuerAndSub("test", "test-sub").get();
        }

        for (Project project : projects.findAll()) {
            savers.delete(project.getId());
        }
    }

    private org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.OidcLoginRequestPostProcessor auth() {
        return oidcLogin().idToken(token -> token.claim("sub", "test-sub"));
    }

    @Test
    void createAndGetProject() throws Exception {
        final String name = UUID.randomUUID().toString();
        ObjectNode project = mapper.createObjectNode();
        project.put("name", name);

        MvcResult result = mockMvc.perform(
                post("/api/project")
                        .contentType(JSON_CONTENT_TYPE)
                        .contentType(JSON_CONTENT_TYPE)
                        .content(project.toString())
                        .with(csrf())
                        .with(auth())
        ).andExpectAll(
                status().isCreated(),
                content().contentType(JSON_CONTENT_TYPE),
                jsonPath("$.id").exists(),
                jsonPath("$.name", is(name)),
                jsonPath("$.contents", empty())
        ).andReturn();

        String id = mapper.readTree(result.getResponse().getContentAsString())
                              .get("id").asText();
        Function<String, ResultMatcher[]> matchers = (path) -> new ResultMatcher[]{
            status().isOk(),
            content().contentType(JSON_CONTENT_TYPE),
            jsonPath(path+".id", is(id)),
            jsonPath(path+".name", is(name)),
            jsonPath(path+".contents", empty())
        };

        mockMvc.perform(
                get("/api/project")
                .with(auth())
        ).andExpectAll(matchers.apply("$[0]"));
        mockMvc.perform(
                get("/api/project/" + id)
                .with(auth())
        ).andExpectAll(matchers.apply("$"));
    }

    @Test
    @Transactional
    void patchProject() throws Exception {
        Project toPatch = new Project("ToPatch");
        toPatch.setOwner(testUser);
        toPatch = projects.save(toPatch);

        final String name = UUID.randomUUID().toString();
        ObjectNode patch = mapper.createObjectNode();
        patch.put("name", name);

        mockMvc.perform(
                patch("/api/project/"+toPatch.getId())
                        .contentType(JSON_CONTENT_TYPE)
                        .contentType(JSON_CONTENT_TYPE)
                        .content(patch.toString())
                        .with(csrf())
                        .with(auth())
        ).andExpectAll(
                status().isOk()
        );

        Project patched = projects.findById(toPatch.getId()).orElseThrow();
        assertEquals(name, patched.getName());
    }

    @Test
    void failPatchWithContent() throws Exception {
        Project toPatch = new Project("toPatch");
        toPatch.setOwner(testUser);
        toPatch = projects.save(toPatch);

        ObjectNode patch = mapper.createObjectNode();
        ArrayNode contents = mapper.createArrayNode();
        contents.add(FileControllerTest.getResource("file.json"));
        patch.set("contents", contents);

        mockMvc.perform(
                patch("/api/project/"+toPatch.getId())
                        .contentType(JSON_CONTENT_TYPE)
                        .contentType(JSON_CONTENT_TYPE)
                        .content(patch.toString())
                        .with(csrf())
                        .with(auth())
        ).andExpectAll(
                status().isBadRequest()
        );
    }

    @Test
    void deleteProject() throws Exception {
        Project toDelete = new Project("toDelete");
        toDelete.setOwner(testUser);
        toDelete = projects.save(toDelete);
        mockMvc.perform(
                delete("/api/project/" + toDelete.getId()).with(csrf()).with(auth())
        ).andExpect(status().isOk());
        assertTrue(projects.findById(toDelete.getId()).isEmpty());
    }

    @Test
    @Transactional
    void deleteProjectContent() throws Exception {
        Project toDelete = new Project("toDelete");
        toDelete.setOwner(testUser);
        toDelete = projects.save(toDelete);
        File inner = files.save(new File("Hello", toDelete));
        projects.save(toDelete);

        mockMvc.perform(
                delete("/api/project/" + toDelete.getId()).with(csrf()).with(auth())
        ).andExpect(status().isOk());
        assertEmpty(files.findById(inner.getId()));
        assertEmpty(projects.findById(toDelete.getId()));
    }

    @Test
    @Transactional
    //We don't allow the content of a contained directory to be displayed
    void noRecursiveDirectoryContent() throws Exception {
        Project main = new Project("main");
        main.setOwner(testUser);
        Directory lower = new Directory("lower", main);
        File file = files.save(new File("Hi", lower));
        lower = directories.save(lower);
        main = projects.save(main);

        mockMvc.perform(
                get("/api/project/" + main.getId())
                .with(auth())
        ).andExpectAll(
                status().isOk(),
                jsonPath("$.name", is(main.getName())),
                jsonPath("$.contents").isArray(),
                jsonPath("$.contents[0].name", is(lower.getName())),
                jsonPath("$.contents[0].type", is(lower.getTypeIdentifier())),
                jsonPath("$.contents[0].contents").doesNotExist()
        );
    }

    @Test
    @Transactional
    void projectOverviewContainsOnlyFirstLevelOfProjectContent() throws Exception {
        Project main = new Project("main");
        main.setOwner(testUser);
        Directory lower = new Directory("lower", main);
        File inner = files.save(new File("inner", lower));
        lower = directories.save(lower);
        main = projects.save(main);

        mockMvc.perform(
                get("/api/project/")
                .with(auth())
        ).andExpectAll(
                status().isOk(),
                jsonPath("$[0].id", is(main.getId())),
                jsonPath("$[0].name", is(main.getName())),
                jsonPath("$[0].contents").isArray(),
                jsonPath("$[0].contents[0].name", is(lower.getName())),
                jsonPath("$[0].contents[0].contents").doesNotExist()
        );

        //Ensure that the normal view is correct
        mockMvc.perform(
                get("/api/project/" + main.getId())
                .with(auth())
        ).andExpectAll(
                status().isOk(),
                jsonPath("$.name", is(main.getName())),
                jsonPath("$.contents").isArray(),
                jsonPath("$.contents[0].name", is(lower.getName()))
        );
    }
}