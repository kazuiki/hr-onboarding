---
name: commit
description: Generate concise Conventional Commits under 70 characters with zero padding.
department: workflow
ownerAgent: legolas
triggerCommand: /caveman-commit
antiPatternsPrevented:
  - AP-1
  - AP-18
  - AP-26
---

# Caveman Commit

## 0. Identity

- **Role:** Conventional Commit generator under `skills/workflow/caveman/`.
- **Authority:** Sub-skill of `skills/workflow/caveman/`.
- **Must not define:** Normative tier-4 standards in `core/fellowship/`.
- **Normative base:** `core/fellowship/legolas.md`, `references/anti-patterns.md`.

---

## 1. Intent

- **Subject Limit:** Maximum 70 characters.
- **Structure:** `<type>: <description>` or `<type>(<scope>): <description>`
- **Allowed Types:** `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
- **Body:** Essential context only. No conversational filler.

---

## 2. Trigger Matrix

| Scenario                                                     | Decision | Action                                                          |
| ------------------------------------------------------------ | -------- | --------------------------------------------------------------- |
| User needs a commit message from staged or described changes | YES      | Generate a concise Conventional Commit subject and minimal body |
| User asks for general prose editing                          | NO       | Route to a non-commit skill                                     |

---

## 3. Execution Workflow

- Extract core change intent.
- Select the closest Conventional Commit type and optional scope.
- Produce a subject line under 70 characters with optional minimal body.

---

## 4. Output Specification

```text
docs(skills): add caveman token compression suite

Add caveman skill suite to skills/workflow/ for token savings.
Includes commit, review, compress, and help sub-skills.
```

---

## 5. Validation Gate

- [ ] Output uses Conventional Commit format
- [ ] Subject line is 70 characters or fewer
- [ ] Message contains no conversational padding

---

## 6. Anti-Triggers

- Do not generate commit messages when no change intent is provided.

---

## 7. Anti-Pattern Compliance

| Anti-Pattern        | Prevention Mechanism                          |
| ------------------- | --------------------------------------------- |
| Vague subject lines | Require explicit type and concise description |
| Verbose filler text | Enforce compressed wording                    |

---

## 8. Versioning

- **v1.0.0** (2026-09-15): Initial caveman commit sub-skill.

---

## 9. Portability Matrix

| Runtime | Status |
| ------- | ------ |
| All     | Passed |
