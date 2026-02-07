---
description: Sync the current feature branch with the latest changes from the development branch.
---

// turbo-all
1. Fetch the latest changes from all branches using `git fetch origin`.
2. Identify the current branch using `git branch --show-current`.
3. Merge the latest changes from the `development` branch into the current branch using `git merge origin/development`.
4. If merge conflicts arise, identify the conflicting files and resolve them.
