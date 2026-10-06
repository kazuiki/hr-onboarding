---
name: tailwind-principles
description: Tailwind CSS v4 engineering rules covering design tokens, utility classes, variants, dark mode, responsive design, and performance guidelines for modern web development.
department: frontend
ownerAgent: legolas
triggerCommand: /tailwind-principles
antiPatternsPrevented:
  - AP-1
  - AP-6
  - AP-26
  - AP-28
---

# Tailwind Principles

## 0. Identity

- **Role:** Interface Builder. Owns utility-first styling with token discipline and tree-shakeable output.
- **Role source:** Appendix A of `skills/_template/skill-name/SKILL.md` (Interface Builder).
- **Seniority bar:** Staff (Appendix B). Records why theme tokens beat bracket values (one change propagates, rejected scattered hex), why components beat apply blocks (tree-shaking survives, rejected hidden utilities), and why static class names beat interpolation (scanner detection, rejected dynamic ghosts).
- **Authority:** Tier-5 normative skill for `skills/frontend/tailwind-principles/`. Owns utility and token guidance.
- **Must not define:** Global design language decisions beyond token mechanics.
- **Normative base:** `core/fellowship/legolas.md`, `rules/engineering/architecture-boundaries.md`, `rules/common/code-style-standards.md`, `references/anti-patterns.md`.
- **Anti-pattern gate:** Blocks AP-1 (vague task), AP-26 (no scope boundary), and AP-28 (no stop condition).

## 1. Intent (9 Dimensions)

| #   | Dimension        | Value                                                                                          |
| --- | ---------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Task             | Produce Tailwind v4 styling with tokenized themes and detectable classes.                      |
| 2   | Target Tool      | Any agent runtime: Claude Code, Cursor, Copilot, Windsurf, Kiro, Cline, raw API.                |
| 3   | Output Format    | Styling plan with tokens, variants, detection, and budget notes.                               |
| 4   | Constraints      | Tokens in theme. Classes static. Zero em dashes. Apply sparingly.                              |
| 5   | Input            | Design specs, dark mode needs, responsive targets, bundle budget.                               |
| 6   | Context          | Prevents token sprawl, undetectable classes, and bloated CSS output.                            |
| 7   | Audience         | Frontend engineers styling with Tailwind v4.                                                    |
| 8   | Success Criteria | Tokens centralized; classes detectable; plan approved before coding.                            |
| 9   | Examples         | See Section 10.                                                                                 |

## 2. Trigger Matrix

| Trigger                                      | Fire? | Notes                              |
| -------------------------------------------- | ----- | ---------------------------------- |
| "Tokenize our Tailwind theme"                | YES   | Core trigger.                      |
| "Fix bloated CSS and dark mode bugs"         | YES   | Core trigger.                      |
| "/tailwind-principles"                       | YES   | Slash command trigger.             |
| "Design our brand palette"                   | NO    | Out of scope; design owns it.      |
| "Write JavaScript business logic"            | NO    | Out of scope for this skill.       |

## 3. Execution Workflow

### Step 1: Centralize Theme Tokens

- **Action:** Promote repeated values into theme blocks with semantic names, standardize scales, and sort classes deterministically in CI.
- **Input:** Design specs from user.
- **Stop Condition:** Halt when arbitrary values repeat; require tokens.
- **Validation:** Token audit complete per design surface.

### Step 2: Variant States Correctly

- **Action:** Apply state, responsive, dark, focus-visible, and reduced-motion variants through first-class prefixes with runtime-safe dark theming.
- **Input:** Dark mode and responsive targets.
- **Stop Condition:** Halt on custom CSS duplicating variant jobs.
- **Validation:** Variant review complete per state.

### Step 3: Protect Detection and Budget

- **Action:** Keep class names statically detectable with complete-name maps, register exact sources, extract repeating combos into components instead of apply blocks, and monitor production CSS size.
- **Input:** Bundle budget from user.
- **Stop Condition:** Halt on interpolated class construction; require maps.
- **Validation:** Detection audit complete with size evidence.

### Step 4: Handoff and Human Review

- **Action:** Present the plan and request approval before coding.
- **Input:** Completed plan.
- **Stop Condition:** Await user approval.
- **Validation:** Approval recorded; zero code written by this skill.

## 4. Output Specification

```markdown
# Tailwind Plan

- **Tokens:** [Centralized theme map]
- **Variants:** [State coverage notes]
- **Budget:** [Detection with size evidence]
```

## 5. Validation Gate

- [ ] Tokens centralized in theme.
- [ ] Variants cover states accessibly.
- [ ] Classes statically detectable.
- [ ] Zero em dashes in deliverable.
- [ ] Human approval recorded before coding.

## 6. Anti-Triggers and Calibration

- **Under-execution threshold:** Styling without token centralization.
- **Over-execution threshold:** Redesigning brand palettes unprompted.
- **Calibration default:** Utilities first; custom CSS with receipts.

## 7. Anti-Pattern Compliance

| Step | Prevents AP            | Mechanism                                           |
| ---- | ---------------------- | --------------------------------------------------- |
| 1    | AP-1 (vague task)      | Requires token audit first.                         |
| 2    | AP-26 (no scope)       | Covers variants per state.                          |
| 3    | AP-28 (no stop)        | Protects detection with budgets.                    |
| 4    | AP-45 (no human review)| Halts for approval before coding.                   |

## 8. Versioning & Changelog

- **Version:** 2.0.0
- **Changelog:**
  - `2.0.0` (2026-09-26) - Tier-5 conversion with Interface Builder role, role source, and seniority bar.
  - `1.0.0` - Legacy styling baseline.

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

**Input:** "Our Tailwind CSS is 400KB with broken dark mode."
**Output:** Plan with centralized theme, runtime-safe dark tokens, and detectable classes under budget.
