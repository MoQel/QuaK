package edu.kit.quak;

import edu.kit.quak.files.repository.DirectoryRepository;
import edu.kit.quak.files.repository.FileRepository;
import edu.kit.quak.files.repository.ProjectRepository;
import org.junit.jupiter.api.Assertions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Optional;

@SuppressWarnings("OptionalUsedAsFieldOrParameterType")
@SpringBootTest
public abstract class QuaKApplicationTests {

	@Autowired
	protected ProjectRepository projects;
	@Autowired
	protected FileRepository files;
	@Autowired
	protected DirectoryRepository directories;

	public void assertEmpty(Optional<?> optional) {
		Assertions.assertTrue(optional.isEmpty());
	}

	public void assertPresent(Optional<?> optional) {
		Assertions.assertTrue(optional.isPresent());
	}
}
