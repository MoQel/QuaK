package edu.kit.quak;

import edu.kit.quak.files.repository.DirectoryRepository;
import edu.kit.quak.files.repository.FileRepository;
import edu.kit.quak.files.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class QuaKApplicationTests {

	@Autowired
	protected ProjectRepository projects;
	@Autowired
	protected FileRepository files;
	@Autowired
	protected DirectoryRepository directories;

	@Test
	void contextLoads() {
	}

}
