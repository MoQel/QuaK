package edu.kit.quak.files.repository;

import edu.kit.quak.files.model.File;
import org.springframework.data.repository.CrudRepository;

public interface FileRepository extends CrudRepository<File, String> {
}
