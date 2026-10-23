---
name: feature-orchestrator
description: Coordinate one repository feature request through requirements, architecture, implementation, testing, and review with validated handoffs. Use for end-to-end delivery, not standalone specialist work.
---

# Feature Orchestrator

Accept one feature request per run. Do not combine requests in one run.

At run start, ensure `.factory/` is ignored by Git. If it is not already ignored, add the minimal `.factory/` entry to the repository's `.gitignore` and record that orchestration-metadata change in the run report. Create `.factory/runs/<run-id>/execution-report.md` as the only default run artifact. Update this concise report throughout the run with stage status, material decisions, validation outcomes, commands and results, retries, blockers, unresolved issues, and limits. Do not save separate request, output, or validation files.

Load and follow these skills in this exact order, reading each `SKILL.md` before its stage:

1. `.agents/skills/requirements-analyst/SKILL.md`
2. `.agents/skills/software-architect/SKILL.md`
3. `.agents/skills/feature-developer/SKILL.md`
4. `.agents/skills/test-engineer/SKILL.md`
5. `.agents/skills/code-reviewer/SKILL.md`

Maintain each stage's complete accepted result in the Codex working context and pass it, together with all earlier accepted results, to the next stage. The report must summarize each handoff and its validation, but is not a substitute for the complete in-context handoff. Create additional run artifacts only when needed to diagnose a failure or when the user explicitly requests them. Never claim a check was run when it was not.

Before advancing, validate that the output meets its skill's required output and acceptance conditions, traces to the request, and is usable by the next stage. On failure, return findings to the responsible stage and retry at most twice. After its second failed retry, stop and report the unresolved failure. If a correction changes an earlier handoff, rerun affected downstream stages.

After implementation, identify and run applicable repository tests, lint, and production build. Record unavailable commands or environment blockers; do not substitute unrelated checks. Treat failing tests, lint, build, review blockers, missing required access, and ambiguous acceptance requirements as blockers unless the user resolves them.

Boundaries: make only approved-scope changes. Never commit, push, merge, deploy, or modify external services without explicit authorization.

End with a concise report of changed files, accepted artifacts, review outcome, commands and results, and blockers or unverified items.
