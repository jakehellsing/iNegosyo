# Agent Rules

This repository follows a **single-branch, tag-based workflow**.

- All changes must be pushed directly to the `main` branch on GitHub.
- Do not create or merge pull requests for routine work.
- Do not maintain release, hotfix, or feature branches.
- Version control is done exclusively with git tags. Create and push a new tag to mark a releasable version when the `main` branch is in a good state.

Example:

```bash
git checkout main
git pull origin main
# make changes, commit
git push origin main
git tag -a v0.2.8 -m "Release v0.2.8"
git push origin v0.2.8
```

## Supabase migrations

Pushing code does **not** apply Supabase migrations. After any commit that adds or changes a file in `supabase/migrations/`, open the Supabase project SQL Editor and run the new migration in filename order after all earlier migrations. Record that it was applied so it is not run twice.

Only deviate from this rule if explicitly instructed by the repository owner.
