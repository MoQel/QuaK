package edu.kit.quak.application.library.services;

import edu.kit.quak.application.library.ports.out.GateRepositoryPort;
import edu.kit.quak.shared.tags.UnitTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verify;

@UnitTest
@ExtendWith(MockitoExtension.class)
class GateServiceTest {

    @Mock
    GateRepositoryPort repo;
    @InjectMocks
    GateService service;

    @Test
    void getAllGates_delegatesToRepo() {
        service.getAllGates();
        verify(repo).findAllGates();
    }
}