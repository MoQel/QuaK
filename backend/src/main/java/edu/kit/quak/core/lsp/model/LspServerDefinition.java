package edu.kit.quak.core.lsp.model;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

public record LspServerDefinition(LspLanguage language, List<String> command, Path workingDirectory, Map<String, String> environment) {}
