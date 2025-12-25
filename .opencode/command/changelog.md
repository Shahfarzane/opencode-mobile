---
description: Draft user-facing CHANGELOG.md entries for [Unreleased]
agent: build
---

You are updating @CHANGELOG.md.

Goal: write user-facing bullet points for the `## [Unreleased]` section that summarize the changes since the latest git tag up to `HEAD`.

Style rules:
- Match the writing style of the existing changelog (tone + level of detail).
- User-facing and benefit-oriented; avoid internal component names unless users see them (ex: “VS Code extension”, “Desktop app”, “Web app”).
- Prefer 5–9 bullets; group by platform only if it reads better.
- No new release header; only update the `[Unreleased]` bullets.
- Don’t include implementation notes, commit hashes, or file paths in the changelog text.

Determine the base version:
- Use the latest tag (ex: `v1.3.2`) as the base.
- Inspect all commits after the base up to `HEAD`.

Repo context for style:
!`BASE=$(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD); echo "Base: $BASE"; echo; sed -n 1,140p CHANGELOG.md`

Latest tag and commit context:
!`BASE=$(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD); COMMIT_COUNT=$(git rev-list --count "$BASE"..HEAD); DIFF=$(git diff --shortstat "$BASE"..HEAD); echo "Base: $BASE | Commit count: $COMMIT_COUNT | Diff: $DIFF"`

Top commits (newest first):
!`BASE=$(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD); git log --oneline -30 "$BASE"..HEAD`

Changed files summary:
!`BASE=$(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD); git diff --stat "$BASE"..HEAD`

Additional hints (optional, use only if needed):
- If there are breaking changes or user-visible behavior changes, call them out first.
- If changes are mostly internal refactors, summarize them as reliability/performance improvements.

Now:
1) Propose the new `[Unreleased]` bullet list.
2) Apply it to @CHANGELOG.md (only that section).
