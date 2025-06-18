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

@SpringBootTest
@AutoConfigureMockMvc
class ProjectControllerTest extends QuaKApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        projects.deleteAll();
    }

    @Test
    void createAndGetProject() throws Exception {
        final String name = UUID.randomUUID().toString();
        ObjectNode project = mapper.createObjectNode();
        project.put("name", name);

        MvcResult result = mockMvc.perform(
                post("/project")
                        .contentType(JSON_CONTENT_TYPE)
                        .content(project.toString())
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
                get("/project")
        ).andExpectAll(matchers.apply("$[0]"));
        mockMvc.perform(
                get("/project/" + id)
        ).andExpectAll(matchers.apply("$"));
    }

    @Test
    @Transactional
    void patchProject() throws Exception {
        Project toPatch = projects.save(new Project("ToPatch"));

        final String name = UUID.randomUUID().toString();
        ObjectNode patch = mapper.createObjectNode();
        patch.put("name", name);

        mockMvc.perform(
                patch("/project/"+toPatch.getId())
                        .contentType(JSON_CONTENT_TYPE)
                        .content(patch.toString())
        ).andExpectAll(
                status().isOk()
        );

        Project patched = projects.findById(toPatch.getId()).orElseThrow();
        assertEquals(name, patched.getName());
    }

    @Test
    void failPatchWithContent() throws Exception {
        Project toPatch = projects.save(new Project("toPatch"));

        ObjectNode patch = mapper.createObjectNode();
        ArrayNode contents = mapper.createArrayNode();
        contents.add(FileControllerTest.getResource("file.json"));
        patch.set("contents", contents);

        mockMvc.perform(
                patch("/project/"+toPatch.getId())
                        .contentType(JSON_CONTENT_TYPE)
                        .content(patch.toString())
        ).andExpectAll(
                status().isBadRequest()
        );
    }

    @Test
    void deleteProject() throws Exception {
        Project toDelete = projects.save(new Project("toDelete"));
        mockMvc.perform(
                delete("/project/" + toDelete.getId())
        ).andExpect(status().isOk());
        assertTrue(projects.findById(toDelete.getId()).isEmpty());
    }

    @Test
    @Transactional
    void deleteProjectContent() throws Exception {
        Project toDelete = projects.save(new Project("toDelete"));
        File inner = files.save(new File("Hello"));
        toDelete.addElement(inner);
        projects.save(toDelete);

        mockMvc.perform(
                delete("/project/" + toDelete.getId())
        ).andExpect(status().isOk());
        assertEmpty(files.findById(inner.getId()));
        assertEmpty(projects.findById(toDelete.getId()));
    }

    @Test
    @Transactional
    //We don't allow the content of a contained directory to be displayed
    void noRecursiveDirectoryContent() throws Exception {
        File file = files.save(new File("Hi"));
        Directory lower = new Directory("lower");
        lower.addElement(file);
        lower = directories.save(lower);
        Project main = new Project("main");
        main.addElement(lower);
        main = projects.save(main);

        mockMvc.perform(
                get("/project/" + main.getId())
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
        File inner = files.save(new File("inner"));
        Directory lower = new Directory("lower");
        lower.addElement(inner);
        lower = directories.save(lower);
        Project main = new Project("main");
        main.addElement(lower);
        main = projects.save(main);

        mockMvc.perform(
                get("/project/")
        ).andExpectAll(
                status().isOk(),
                jsonPath("$[0].name", is(main.getName())),
                jsonPath("$[0].contents").isArray(),
                jsonPath("$[0].contents[0].name", is(lower.getName())),
                jsonPath("$[0].contents[0].contents").doesNotExist()
        );

        //Ensure that the normal view is correct
        mockMvc.perform(
                get("/project/" + main.getId())
        ).andExpectAll(
                status().isOk(),
                jsonPath("$.name", is(main.getName())),
                jsonPath("$.contents").isArray(),
                jsonPath("$.contents[0].name", is(lower.getName()))
        );
    }
}