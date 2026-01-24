---
description: Automated Git workflow to analyze message patterns, format code, stage, commit, and push changes.
---

// turbo-all
1. Run `git status` to identify current changes and untracked files.
2. Run `git log -n 15 --pretty=format:"%s"` to analyze the recent commit message style, prefixes, and patterns used in the repository.
3. Apply code formatting in the backend by running `./gradlew spotlessApply` in the `backend` directory.
4. Stage all changes in the repository using `git add .`.
5. Based on the analysis in step 2 and the changes identified in step 1, generate a commit message that follows the project's style and run `git commit -m "<commit_message>"`.
6. Push the committed changes to the current branch using `git push`.
