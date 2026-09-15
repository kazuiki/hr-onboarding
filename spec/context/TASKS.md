# TASKS — HR Onboarding Portal Implementation

## Role / Authority

- **Role:** Definition of incremental development tasks and tracking progress against requirements.
- **Authority:** All work must be completed according to the tasks defined herein to ensure project adherence to the `agent-spec` standard.

---

## 1. Foundation & Infrastructure (Must-Have)
- [ ] Initialize Next.js (App Router, TypeScript, Tailwind)
- [ ] Bootstrap Supabase CLI + Basic Migration (`001_initial_schema.sql`)
- [ ] Configure `src/lib/supabase-client.ts`

## 2. Authentication & Core Security
- [ ] Setup Supabase Auth provider
- [ ] Implement protective RLS policy on `profiles` table
- [ ] Create `AuthGuard` layout component for employee/HR routes

## 3. Employee Portal - First Slice
- [ ] Create `Employee Dashboard` view
- [ ] Create dummy HR dashboard entry point
