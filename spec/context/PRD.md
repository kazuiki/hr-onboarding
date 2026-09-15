# PRD — HR Onboarding Portal

> **Purpose:** Define the product problem, target audience, scope, technical constraints, and success criteria for the secure employee onboarding workspace. 

_Last updated: 15/09/2026_

---

## 1. Executive Summary

The HR Onboarding Portal is a secure, configurable workspace designed to streamline the onboarding process for new employees. It provides a structured, automated flow for completing employment forms, submitting required documents and ID photographs, acknowledging privacy policies, and preparing for the first day. 

For the company, it provides an HR dashboard to manage onboarding templates, assign requirements, review submissions, and track progress, ensuring compliance and a professional introduction for new hires.

---

## 2. Problem Statement & Context

Current employee onboarding processes are often manual, scattered across email/shared drives, and lack clear status tracking. This makes it challenging to ensure all legal, medical, and administrative requirements are met securely and on time. New employees lack a centralized, welcoming space to understand their requirements, and HR managers struggle with tracking progress, maintaining document security, and managing audit histories.

---

## 3. Core Goals & Objectives

- **Goal 1:** Provide a secure, centralized, and clear onboarding space for new employees.
- **Goal 2:** Offer HR a configurable dashboard to manage onboarding templates, employee records, and review cycles.
- **Goal 3:** Automate progress tracking, notifications, and audit logging to ensure compliance.
- **Goal 4:** Ensure strict data privacy and security through Supabase RLS and private Storage buckets.

---

## 4. Target Users & Audience

- **Employee:** Needs a clear, guided onboarding experience with intuitive status tracking.
- **HR Manager/Assistant:** Needs administrative control to create templates, invite employees, and review submissions.
- **User Roles & Access Levels:** 
  - `HR`: Full access to onboarding management, reviews, and employee data.
  - `Employee`: Restricted access to own record and submissions only.

---

## 5. MVP Features (Scope)

All features outlined in the requirements, including:
- [ ] User Authentication (Supabase Auth).
- [ ] Employee Landing Page (Dashboard/Welcome, Progress).
- [ ] Form completion/download system.
- [ ] Document/Photo upload to secure storage (Supabase Storage).
- [ ] HR Dashboard for employee/template management.
- [ ] Configurable Content (e.g., Company Info, Help).
- [ ] RLS policies and secure data handling.

---

## 6. Full Feature List & Prioritization

### Must-Have (P0 — Launch Blockers)
- [ ] **Auth:** Secure sign-in using Supabase Auth.
- [ ] **Employee Portal:** Personalized view of tasks, progress, and requirements.
- [ ] **HR Dashboard:** CRUD for employees/templates and submission review.
- [ ] **Document Security:** RLS enabled tables and private storage buckets.
- [ ] **Configurability:** Store onboarding content/requirements in DB.

### Should-Have (P1 — High Priority Post-MVP)
- [ ] **Notifications:** Automated alerts for overdue tasks or status changes.
- [ ] **Versioning:** Version control for documents and privacy policies.

### Could-Have (P2 — Nice to Have)
- [ ] **Integrated Doc Signer:** Built-in form signing capability.

---

## 7. Success Metrics & KPIs

- **Onboarding Speed:** Completion time of onboarding packet from invite to finish.
- **Accuracy:** Reduction in manual errors in document collection.
- **Compliance:** 100% audit coverage for all privacy acknowledgments and document reviews.

---

## 8. Tech Stack & Technical Requirements

- **Frontend Framework:** Next.js (App Router), TypeScript.
- **Styling:** Tailwind CSS.
- **Database / Storage:** Supabase (PostgreSQL, Storage).
- **Security:** RLS on all tables, Signed URLs for file access.

---

## 9. Deployment & Infrastructure Strategy

- **Hosting Platforms:** Supabase, Vercel.
- **Environments:** `dev`, `prod`.

---

## 10. Phase Roadmap

- **Phase 1 (MVP):** Core feature delivery and essential setup.
- **Phase 2 (Enhancement):** Notifications, document versioning.
