# ARCHITECTURE — HR Onboarding Portal

## Role / Authority

- **Role:** High-level system design, data flow, and infrastructure standards.
- **Authority:** All new code and infrastructure must conform to the defined stack and security models.

---

## 1. System Overview

The HR Onboarding Portal is a Next.js (App Router) web application utilizing Supabase for backend services. It employs a server-client architecture where the frontend handles UI/UX and the frontend Supabase client interacts with PostgreSQL and Storage via secure RLS policies.

- **Frontend:** Next.js (TypeScript) + Tailwind CSS.
- **Backend:** Supabase (PostgreSQL, Auth, Storage).
- **Hosting:** Vercel (Frontend), Supabase (Backend/Database).

## 2. Infrastructure & Integration

- **Authentication:** Supabase Auth (Email/Password).
- **Database:** PostgreSQL (Supabase) with defined Row-Level Security (RLS).
- **Storage:** Supabase Storage (Private buckets for sensitive documents, signed URLs for retrieval).
- **Migrations:** Supabase CLI for database migrations.

## 3. Data Flow & Security

- **Row Level Security (RLS):** Enabled on all tables. Policies strictly enforce user-data isolation (e.g., `auth.uid() = user_id`).
- **Storage Policies:** Private buckets require authenticated users and ownership checks.
- **Security Principles:**
    1.  Never expose `service_role` key in frontend code.
    2.  Use Supabase public client for client-side interactions.
    3.  Critical operations must be performed on the server side (Server Actions).
    4.  Files are accessed via signed URLs with short TTL.

## 4. Components & Views

- **Employee Portal:** Next.js dynamic routing based on `employee_id`.
- **HR Dashboard:** Administrative routing `/hr/*`.
- **Responsive Web Design:** Mobile-first approach using Tailwind.
