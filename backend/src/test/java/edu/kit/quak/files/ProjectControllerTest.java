package edu.kit.quak.files;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import edu.kit.quak.QuaKApplicationTests;
import edu.kit.quak.files.model.File;
import edu.kit.quak.files.model.Project;
import jakarta.transaction.Transactional;
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
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ProjectControllerTest extends QuaKApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createAndGetProject() throws Exception {
        final String name = UUID.randomUUID().toString();
        JsonObject project = new JsonObject();
        project.addProperty("name", name);

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

        String id = JsonParser.parseString(result.getResponse().getContentAsString())
                                      .getAsJsonObject()
                                              .get("id").getAsString();
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
        Project toPatch = projects.save(new Project());

        final String name = UUID.randomUUID().toString();
        JsonObject patch = new JsonObject();
        patch.addProperty("name", name);

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
        Project toPatch = projects.save(new Project());

        JsonObject patch = new JsonObject();
        JsonArray contents = new JsonArray();
        contents.add(FileControllerTest.getResource("file.json"));
        patch.add("contents", contents);

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
        Project toDelete = projects.save(new Project());
        mockMvc.perform(
                delete("/project/" + toDelete.getId())
        ).andExpect(status().isOk());
        assertTrue(projects.findById(toDelete.getId()).isEmpty());
    }

    @Test
    @Transactional
    void deleteProjectContent() throws Exception {
        Project toDelete = projects.save(new Project());
        File inner = files.save(new File("Hello"));
        toDelete.addElement(inner);
        projects.save(toDelete);

        mockMvc.perform(
                delete("/project/" + toDelete.getId())
        ).andExpect(status().isOk());
        assertEmpty(files.findById(inner.getId()));
        assertEmpty(projects.findById(toDelete.getId()));
    }
}