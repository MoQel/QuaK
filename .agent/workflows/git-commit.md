---
description: Generate a git commit message based on current changes and previous commit style patterns.
---

// turbo-all
1. Run `git status` to identify current staged and unstaged changes.
2. Run `git diff` to see the detailed changes in the modified files.
3. Run `git diff --cached` to see the changes that are already staged (if any).
4. Run `git log -n 20 --pretty=format:"%s"` to analyze recent commit messages and understand the commit message style, format, conventions, and patterns used in this repository.
5. Based on the changes from steps 1-3 and the commit style analysis from step 4, generate an appropriate commit message that:
   - Accurately describes the current changes
   - Follows the established commit message conventions and style patterns from the repository
   - Is concise yet descriptive
   - Uses the same prefixes, structure, and tone as previous commits
6. Output the generated commit message, stage all changes of this repo with `git add .`, and execute the commit command.
