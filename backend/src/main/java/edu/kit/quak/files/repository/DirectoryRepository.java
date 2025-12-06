package edu.kit.quak.files.repository;

import edu.kit.quak.core.filesystem.model.Directory;
import org.springframework.data.repository.CrudRepository;

public interface DirectoryRepository extends CrudRepository<Directory, String> {
}
