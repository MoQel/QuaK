package edu.kit.quak.application.lsp.ports.out;

import edu.kit.quak.core.lsp.model.LspLanguage;
import edu.kit.quak.core.lsp.model.LspServerDefinition;
import java.util.Optional;

public interface LspServerRegistryPort {
    Optional<LspServerDefinition> findByLanguage(LspLanguage language);
}
