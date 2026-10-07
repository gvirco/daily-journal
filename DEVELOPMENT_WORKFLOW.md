# Daily Journal — Development Workflow

Use this operational flow for a coherent feature or tightly related set of subfeatures:

**discuss → define → implement → inspect → verify → commit → PR → merge → clean up**

## 1. Start

Start from a clean, current `main`, then create a feature branch.

```bash
git switch main
git pull
git status
git switch -c feat/<feature-name>
```

## 2. Define the work

Use ChatGPT to agree the:

- objective;
- relevant UX and architecture decisions;
- observable acceptance criteria;
- explicit out-of-scope work.

Read `AGENTS.md` by default. Read product, design, workflow, or README documentation only when it is relevant to the task; do not require every implementation prompt to read every repository document.

## 3. Prepare the Codex prompt

Create a concise prompt that names the requested work, relevant documents, requirements, decisions, acceptance criteria, out-of-scope items, and verification commands. State that Codex must not commit.

## 4. Implement

Codex implements the agreed scope but does not create a commit. Keep the task focused; do not accept unrelated dependency additions or scope expansion.

## 5. Inspect

Review the working tree and the complete diff before accepting the work.

```bash
git status
git diff --stat
git diff
```

Confirm that changed files, architecture, and scope match the agreed objective.

## 6. Verify

Run the relevant checks and manually test the acceptance criteria. Normally:

```bash
npm run lint
npm run build
```

Run tests when they exist and apply. Treat manual verification as separate from a successful build.

## 7. Commit accepted work

Commit only accepted changes with a clear message. A branch or PR may contain multiple tightly related subfeatures as separate commits when that makes review clearer.

```bash
git add <accepted-files>
git commit -m "feat: <short description>"
```

## 8. Review and merge

Push the feature branch, open a PR, and review its final diff and checks. Normally squash-merge small feature PRs after approval.

## 9. Clean up

Synchronize local `main` after merging and delete merged feature branches locally and remotely.

```bash
git switch main
git pull
git branch -d feat/<feature-name>
git status
```
