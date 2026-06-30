package edu.kit.quak.application.lsp.ports.out;

import edu.kit.quak.core.lsp.model.LspLanguageId;
import edu.kit.quak.core.lsp.model.LspServerDefinition;
import java.util.Optional;

public interface LspServerRegistryPort {
    Optional<LspServerDefinition> findByLanguage(LspLanguageId language);
}
