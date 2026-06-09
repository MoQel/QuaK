package edu.kit.quak.core.lsp.model;

import static org.junit.jupiter.api.Assertions.*;

import edu.kit.quak.core.lsp.exceptions.InvalidLspLanguageIdException;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.Test;

@UnitTest
class LspLanguageIdTest {

    @Test
    void constructor_rejectsNullValue() {
        assertThrows(InvalidLspLanguageIdException.class, () -> new LspLanguageId(null));
    }

    @Test
    void constructor_rejectsBlankValue() {
        assertThrows(InvalidLspLanguageIdException.class, () -> new LspLanguageId(" "));
    }

    @Test
    void constructor_acceptsLanguageId() {
        LspLanguageId languageId = new LspLanguageId("python");

        assertEquals("python", languageId.value());
    }
}
