---
name: auth-architecture
description: Authentication architecture rules covering OAuth2 and OIDC flows, token storage, BFF patterns, session management, and multi-tenant identity. Excludes backend session implementation code.
department: architecture
ownerAgent: boromir
triggerCommand: /auth-architecture
antiPatternsPrevented:
  - AP-1
  - AP-4
  - AP-6
  - AP-26
  - AP-28
---

# Auth Architecture

## 0. Identity

- **Role:** Security Auditor. Owns identity posture with audited authentication flows and token boundaries.
- **Role source:** Appendix A of `skills/_template/skill-name/SKILL.md` (Security Auditor).
- **Seniority bar:** Staff (Appendix B). Records why short-lived tokens beat long-lived sessions (theft windows shrink, rejected forever-tokens), why BFF patterns beat browser-stored tokens (secrets never reach JavaScript, rejected localStorage auth), and why explicit flows beat implicit grants.
- **Authority:** Tier-5 normative skill for `skills/architecture/auth-architecture/`. Owns auth flow guidance.
- **Must not define:** Backend session implementation code or identity provider administration.
- **Normative base:** `core/fellowship/boromir.md`, `rules/engineering/architecture-boundaries.md`, `rules/common/code-style-standards.md`, `references/anti-patterns.md`.
- **Anti-pattern gate:** Blocks AP-1 (vague task), AP-4 (over-permissive access), AP-26 (no scope boundary), and AP-28 (no stop condition).

## 1. Intent (9 Dimensions)

| #   | Dimension        | Value                                                                                       |
| --- | ---------------- | ------------------------------------------------------------------------------------------- |
| 1   | Task             | Produce authentication designs with explicit flows, token boundaries, and tenant isolation. |
| 2   | Target Tool      | Any agent runtime: Claude Code, Cursor, Copilot, Windsurf, Kiro, Cline, raw API.            |
| 3   | Output Format    | Auth blueprint with flows, token map, and session notes.                                    |
| 4   | Constraints      | Tokens short-lived. Browser never holds secrets. Zero em dashes. Flows explicit.            |
| 5   | Input            | Client types, tenant model, compliance needs, session requirements.                         |
| 6   | Context          | Prevents token theft, confused flows, and tenant-crossing sessions.                         |
| 7   | Audience         | Architects designing identity for products.                                                 |
| 8   | Success Criteria | Flows explicit; tokens bounded; plan approved before implementation.                        |
| 9   | Examples         | See Section 10.                                                                             |

## 2. Trigger Matrix

| Trigger                            | Fire? | Notes                                 |
| ---------------------------------- | ----- | ------------------------------------- |
| "Design auth for our SPA and API"  | YES   | Core trigger.                         |
| "Fix our token storage risks"      | YES   | Core trigger.                         |
| "/auth-architecture"               | YES   | Slash command trigger.                |
| "Implement the login session code" | NO    | Out of scope; implementation owns it. |
| "Administer our identity provider" | NO    | Out of scope for this skill.          |

## 3. Execution Workflow

### Step 1: Classify Clients and Flows

- **Action:** Map each client type to its OAuth2/OIDC flow with PKCE where public clients apply. Ban implicit grants everywhere.
- **Input:** Client inventory from user.
- **Stop Condition:** Halt when a client lacks an explicit flow.
- **Validation:** Flow table reviewed per client.

### Step 2: Bound Tokens and Sessions

- **Action:** Set access token lifetimes in minutes, refresh rotation with reuse detection, and BFF-held sessions for browser apps. Never store tokens in readable browser storage.
- **Input:** Compliance needs from Step 1.
- **Stop Condition:** Halt on long-lived browser tokens; require BFF or httpOnly patterns.
- **Validation:** Token map reviewed with lifetimes.

### Step 3: Isolate Tenants in Identity

- **Action:** Carry tenant claims in tokens, enforce tenant checks at every authorization point, and separate admin identity paths from user paths.
- **Input:** Tenant model from user.
- **Stop Condition:** Halt when tenant checks stay optional.
- **Validation:** Tenant matrix reviewed per path.

### Step 4: Handoff and Human Review

- **Action:** Present the auth blueprint and request approval before implementation.
- **Input:** Completed blueprint.
- **Stop Condition:** Await user approval.
- **Validation:** Approval recorded; zero code written by this skill.

## 4. Output Specification

```markdown
# Auth Blueprint

- **Flows:** [Per-client OAuth2/OIDC map]
- **Tokens:** [Lifetimes with storage rules]
- **Tenants:** [Isolation matrix]
```

## 5. Validation Gate

- [ ] Flows explicit per client.
- [ ] Tokens short-lived with BFF custody.
- [ ] Tenants isolated per path.
- [ ] Zero em dashes in deliverable.
- [ ] Human approval recorded before implementation.

## 6. Anti-Triggers and Calibration

- **Under-execution threshold:** Shipping auth without flow mapping.
- **Over-execution threshold:** Implementing sessions unprompted.
- **Calibration default:** Shortest lifetimes the UX tolerates.

## 7. Anti-Pattern Compliance

| Step | Prevents AP             | Mechanism                                 |
| ---- | ----------------------- | ----------------------------------------- |
| 1    | AP-1 (vague task)       | Requires flow table first.                |
| 2    | AP-26 (no scope)        | Bounds tokens numerically.                |
| 3    | AP-4 (over-permissive)  | Isolates tenants per path.                |
| 4    | AP-45 (no human review) | Halts for approval before implementation. |

## 8. Versioning & Changelog

- **Version:** 1.0.0
- **Changelog:**
  - `1.0.0` (2026-09-26) - Initial release closing the identity architecture gap.

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

**Input:** "Our SPA stores JWTs in localStorage and tenants share sessions."
**Output:** Blueprint with code-flow PKCE, BFF token custody, and tenant-claim isolation.
