package edu.kit.quak.core.filesystem.service;

import edu.kit.quak.core.filesystem.exception.DuplicateNameException;
import edu.kit.quak.core.filesystem.model.Project;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/** Keeps the project names of one owner unique regardless of case. */
public final class ProjectNaming {

    private ProjectNaming() {}

    /**
     * @param ownedProjects all projects of the owner the new project is created for
     * @throws DuplicateNameException if one of them already has the name
     */
    public static void ensureAvailable(String name, Collection<Project> ownedProjects) {
        if (isTaken(name, names(ownedProjects))) {
            throw new DuplicateNameException(name);
        }
    }

    /**
     * @param ownedProjects all projects of the renamed project's owner, which may include the renamed project
     * @throws DuplicateNameException if another of them already has the name
     */
    public static void ensureAvailableForRename(Project renamed, String newName, Collection<Project> ownedProjects) {
        ensureAvailable(
            newName,
            ownedProjects
                .stream()
                .filter(project -> !project.equals(renamed))
                .toList()
        );
    }

    /**
     * Renames projects that move to an owner where their names are taken, using the next free number, e.g.
     * "Demo (2)". Names that are free stay as they are and are taken into account before any numbering.
     *
     * @param movingProjects the projects that change owner, renamed in place where necessary
     * @param ownedProjects  the projects the new owner already has
     */
    public static void makeNamesUnique(List<Project> movingProjects, Collection<Project> ownedProjects) {
        List<String> taken = names(ownedProjects);
        List<Project> clashing = movingProjects
            .stream()
            .filter(project -> isTaken(project.getName(), taken))
            .toList();
        movingProjects
            .stream()
            .filter(project -> !clashing.contains(project))
            .forEach(project -> taken.add(project.getName()));
        for (Project project : clashing) {
            project.rename(nextFreeName(project.getName(), taken));
            taken.add(project.getName());
        }
    }

    private static String nextFreeName(String name, List<String> taken) {
        int number = 2;
        while (isTaken(name + " (" + number + ")", taken)) {
            number++;
        }
        return name + " (" + number + ")";
    }

    private static boolean isTaken(String name, List<String> taken) {
        return taken.stream().anyMatch(name::equalsIgnoreCase);
    }

    private static List<String> names(Collection<Project> projects) {
        return new ArrayList<>(projects.stream().map(Project::getName).toList());
    }
}
