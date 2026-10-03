---
name: pr-code-review
description: Orchestrates a multi-agent review of a PR/diff in this repo against CODE_REVIEW_GUIDELINES.md (risk triage, framework compliance, locator quality, test quality, isolation, naming, config-change care, hygiene, security). Use whenever the user asks to review a PR, branch, or diff against the repo's code review guidelines, or when invoked as a CI step after static checks pass. Report-only; never edits code.
---

# pr-code-review

Orchestrate a review of changes against `CODE_REVIEW_GUIDELINES.md` — the checklist in that file only.
Never restate or rely on memory of it; re-read it every run, it may change. You dispatch three
specialized sub-agents to cover the checklist, then merge their findings into one report — you do not
review the checklist sections yourself.

## Principle

Don't re-review what a tool already checks. `tsc --noEmit` and the configured ESLint rules must pass
before this review runs — when running as a CI step, that is already enforced by the prior static-checks
job. This skill (and its sub-agents) cover what those tools cannot catch: layering, locator quality, test
isolation, business meaning of assertions, coverage gaps, naming/tagging conventions, config-change blast
radius, and secrets/security concerns.

## Workflow

1. **Read the checklist.** Read `CODE_REVIEW_GUIDELINES.md` in full — you need it to write the final
   summary and risk rating, even though the sub-agents do the section-by-section work.
2. **Scope the diff.** Default to `git diff origin/main...HEAD` (plus any uncommitted/untracked files via
   `git status` when run locally). In CI, diff against the PR's base ref. Resolve this to a concrete list
   of changed files once.
3. **Dispatch sub-agents in parallel.** In one message, launch all three, each given the same file list
   and diff scope:
   - `pr-architecture-reviewer` — §1 risk triage, §2 framework compliance, §7 config/framework-critical
     changes.
   - `pr-security-reviewer` — §5 test isolation & data, §8 hygiene/secrets, general PCI-relevant security
     concerns (this is a payments-domain test suite; treat any credential-shaped literal as worth a
     finding even if clearly synthetic).
   - `pr-locator-standards-reviewer` — §3 locator quality, §4 test quality & assertions, §6 naming &
     tagging.

   All three are read-only by tool restriction (`Read, Grep, Glob` only) — they cannot edit code, run
   commands, or commit. Do not widen their toolsets.
4. **Merge.** Combine all three agents' findings into one list; dedupe near-identical findings reported by
   more than one agent, keeping the clearer `file:line — §N — issue — fix` version. If two agents disagree
   on severity for the same finding, keep the higher one.
5. **Risk triage.** Using `pr-architecture-reviewer`'s §1 classification (LOW/MEDIUM/HIGH) plus whether
   any Blocker was found by any agent (a Blocker always raises risk to at least Medium), decide the
   overall risk for the summary line.
6. **Apply §9 (what NOT to do):** don't restate lint/tsc output, don't nitpick unstated conventions,
   don't block solely on a coverage judgment call — flag it and let a human decide.
7. **Report** using the format below.

## Output format

No preamble, no trailing summary beyond what's specified below. Group findings by severity:

- **Blocker** — secrets/credentials committed, framework-critical wiring broken, a claimed `@regression`
  test that cannot fail
- **Major** — layering violations (locators/assertions in the wrong layer), locator-quality violations,
  test isolation/shared-state risk
- **Minor** — naming/tagging gaps, hygiene nits (generated output, leftover debug statements)
- **Suggestion** — coverage gaps (missing negative/boundary cases) a human should judge

Each finding: `file:line — [Guideline section] — issue — fix`, in the citation style from §10 of
`CODE_REVIEW_GUIDELINES.md`.

Immediately before the final risk/checklist lines, add one line naming which sub-agents ran:
`reviewers: pr-architecture-reviewer, pr-security-reviewer, pr-locator-standards-reviewer` — this is how a
run (local or CI) is confirmed to have used them.

End with one line: `risk: Low | Medium | High` and one line: `checklist: CODE_REVIEW_GUIDELINES.md`. If
nothing is found, say so in one line plus the reviewers/risk/checklist lines.

## Rules

- Report only. Never edit files, commit, or push.
- If `CODE_REVIEW_GUIDELINES.md` is missing, stop and say so — do not improvise a checklist.
- Don't duplicate findings the static-checks/lint/typecheck step already reports.
- The three sub-agents are read-only by tool restriction, not just instruction — don't widen their
  toolsets, and don't review their checklist sections yourself instead of dispatching them.
