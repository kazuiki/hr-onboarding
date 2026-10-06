---
name: typescript-standards
description: Strict TypeScript standards covering tsconfig setup, erasable syntax, interface vs type rules, runtime validation, and advanced type derivation.
department: frontend
ownerAgent: legolas
triggerCommand: /typescript-standards
antiPatternsPrevented:
  - AP-1
  - AP-6
  - AP-13
  - AP-26
  - AP-28
---

# TypeScript Standards

## 0. Identity

- **Role:** Syntax Reviewer. Owns type-system correctness with erasable, tree-shakeable contracts.
- **Role source:** Appendix A of `skills/_template/skill-name/SKILL.md` (Syntax Reviewer).
- **Seniority bar:** Staff (Appendix B). Records why interfaces beat intersections for objects (cached relationships, rejected structural re-evaluation), why unions beat enums (no runtime pollution, rejected IIFE lookups), and why parse-at-edge beats any-casts (runtime truth over compile theater, rejected type loopholes).
- **Authority:** Tier-5 normative skill for `skills/frontend/typescript-standards/`. Owns typing and compiler guidance.
- **Must not define:** Runtime business logic or bundler internals.
- **Normative base:** `core/fellowship/legolas.md`, `rules/engineering/architecture-boundaries.md`, `rules/common/code-style-standards.md`, `references/anti-patterns.md`.
- **Anti-pattern gate:** Blocks AP-13 (type loopholes), AP-26 (no scope boundary), and AP-28 (no stop condition).

## 1. Intent (9 Dimensions)

| #   | Dimension        | Value                                                                                          |
| --- | ---------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Task             | Produce strictly typed code with erasable syntax and validated boundaries.                     |
| 2   | Target Tool      | Any agent runtime: Claude Code, Cursor, Copilot, Windsurf, Kiro, Cline, raw API.                |
| 3   | Output Format    | Typing plan with config, contracts, and derivation notes.                                      |
| 4   | Constraints      | Strict on. No any. Zero em dashes. No floating promises.                                       |
| 5   | Input            | Codebase inventory, boundary contracts, performance needs.                                      |
| 6   | Context          | Prevents type-loophole sprawl, runtime pollution, and boundary drift.                           |
| 7   | Audience         | Frontend engineers writing TypeScript.                                                          |
| 8   | Success Criteria | Config strict; contracts validated; plan approved before coding.                                |
| 9   | Examples         | See Section 10.                                                                                 |

## 2. Trigger Matrix

| Trigger                                      | Fire? | Notes                              |
| -------------------------------------------- | ----- | ---------------------------------- |
| "Harden our TypeScript config"               | YES   | Core trigger.                      |
| "Kill any-casts and floating promises"       | YES   | Core trigger.                      |
| "/typescript-standards"                      | YES   | Slash command trigger.             |
| "Write JavaScript business logic"            | NO    | Route to `javascript-principles`.  |
| "Design our module graph policy"             | NO    | Route to `module-organization`.    |

## 3. Execution Workflow

### Step 1: Lock Compiler Config

- **Action:** Enable strict, verbatim module syntax, and erasable syntax flags. Place shared types in domain files with explicit type-only imports.
- **Input:** tsconfig inventory from user.
- **Stop Condition:** Halt on silent strict downgrades; require flags.
- **Validation:** Config audit complete per project.

### Step 2: Model Types Correctly

- **Action:** Prefer interfaces with extends for objects, unions over enums, discriminated unions over nullable flags, tuples over loose arrays, and using declarations for disposables.
- **Input:** Domain contracts from Step 1.
- **Stop Condition:** Halt on enums or any-casts; require modern forms.
- **Validation:** Type review complete per domain.

### Step 3: Validate Runtime Boundaries

- **Action:** Parse external payloads with schemas at edges, ban any with unknown narrowing, prefer predicates over casts, annotate exported returns, enforce exhaustive switches, and mark background promises explicitly.
- **Input:** Boundary contracts from user.
- **Stop Condition:** Halt on unvalidated external data; require parsing.
- **Validation:** Boundary audit complete per edge.

### Step 4: Handoff and Human Review

- **Action:** Present the plan and request approval before coding.
- **Input:** Completed plan.
- **Stop Condition:** Await user approval.
- **Validation:** Approval recorded; zero code written by this skill.

## 4. Output Specification

```markdown
# TypeScript Plan

- **Config:** [Strict flags audit]
- **Types:** [Modeling decisions]
- **Boundaries:** [Runtime validation map]
```

## 5. Validation Gate

- [ ] Config strict with erasable syntax.
- [ ] Types modeled without loopholes.
- [ ] Boundaries parsed at runtime.
- [ ] Zero em dashes in deliverable.
- [ ] Human approval recorded before coding.

## 6. Anti-Triggers and Calibration

- **Under-execution threshold:** Typing code without config audit.
- **Over-execution threshold:** Rewriting working systems unprompted.
- **Calibration default:** Strictest flags first; loosen with receipts.

## 7. Anti-Pattern Compliance

| Step | Prevents AP            | Mechanism                                           |
| ---- | ---------------------- | --------------------------------------------------- |
| 1    | AP-13 (type loopholes) | Locks compiler flags first.                         |
| 2    | AP-26 (no scope)       | Models types per domain.                            |
| 3    | AP-28 (no stop)        | Validates every boundary.                           |
| 4    | AP-45 (no human review)| Halts for approval before coding.                   |

## 8. Versioning & Changelog

- **Version:** 2.0.0
- **Changelog:**
  - `2.0.0` (2026-09-26) - Tier-5 conversion with Syntax Reviewer role, role source, and seniority bar.
  - `1.0.0` - Legacy typing baseline.

## 9. Portability Matrix

| Runtime     | Status   | Notes                           |
| ----------- | -------- | ------------------------------- |
| Claude Code | verified | Direct slash command execution. |
| Cursor      | verified | Rules and prompt loading.       |
| Copilot     | verified | Custom instructions support.    |
| Windsurf    | verified | Cascade flow integration.       |
| Kiro        | verified | Steering model execution.       |
| Cline       | verified | Task step-by-step flow.         |
| Raw API     | verified | Model-agnostic execution.       |

## 10. Examples

**Input:** "Our codebase is full of any-casts and floating promises."
**Output:** Plan with strict config, union-based models, and edge parsing with exhaustive checks.
