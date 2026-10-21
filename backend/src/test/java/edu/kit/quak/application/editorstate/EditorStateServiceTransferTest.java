package edu.kit.quak.application.editorstate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import edu.kit.quak.application.editorstate.ports.out.EditorStateRepositoryPort;
import edu.kit.quak.application.editorstate.services.EditorStateService;
import edu.kit.quak.core.editorstate.model.EditorState;
import edu.kit.quak.shared.tags.UnitTest;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@UnitTest
@ExtendWith(MockitoExtension.class)
class EditorStateServiceTransferTest {

    private final UUID from = UUID.randomUUID();
    private final UUID to = UUID.randomUUID();

    @Mock
    EditorStateRepositoryPort repository;

    @InjectMocks
    EditorStateService service;

    @Test
    @DisplayName("moves an editor state to the receiving user")
    void movesState() {
        EditorState state = new EditorState("p-1", from.toString(), "[]");
        when(repository.findAllByUserId(from.toString())).thenReturn(List.of(state));
        when(repository.findByProjectIdAndUserId("p-1", to.toString())).thenReturn(Optional.empty());

        service.transferAllByUserId(from, to);

        assertEquals(to.toString(), state.getUserId());
        verify(repository).save(state);
    }

    @Test
    @DisplayName("keeps the receiving user's own state for the same project")
    void keepsExistingState() {
        EditorState state = new EditorState("p-1", from.toString(), "[]");
        when(repository.findAllByUserId(from.toString())).thenReturn(List.of(state));
        when(repository.findByProjectIdAndUserId("p-1", to.toString())).thenReturn(
            Optional.of(new EditorState("p-1", to.toString(), "[]"))
        );

        service.transferAllByUserId(from, to);

        verify(repository).deleteById(state.getId());
        verify(repository, never()).save(state);
    }
}
