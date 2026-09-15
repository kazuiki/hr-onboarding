# DESIGN — HR Onboarding Portal Design System

## Role / Authority

- **Role:** Definition of UI tokens, aesthetic principles, and component standards.
- **Authority:** All frontend components must derive styling from these defined tokens. Changes to the design system must be validated against accessibility requirements.

---

## 1. Aesthetic Principles

- **Professional HR Tone:** Calm, trustworthy, clear.
- **Scan-Friendly:** High information hierarchy, generous whitespace.
- **Responsiveness:** Mobile-first, desktop-optimized layouts.
- **Accessibility:** WCAG 2.1 compliance (sufficient color contrast, keyboard-navigable components).

## 2. Design Tokens

### Colors
Official brand palette (locked):
- **Deep Navy:** `#011f4b` — headers, sidebar, high-contrast text.
- **Classic Navy:** `#03396c` — section emphasis, active structure.
- **Ocean Blue:** `#005b96` — primary buttons, links, focus rings, progress fills.
- **Steel Blue:** `#6497b1` — secondary text, icons, borders.
- **Ice Blue:** `#b3cde0` — soft surfaces, hover tints, table headers.
- **Canvas:** `#F8FAFC` background, `#FFFFFF` cards.
- **Status:** Emerald `#10B981` approved, Amber `#F59E0B` in review, Crimson `#EF4444` needs changes.

### Typography
- **Font Family:** Inter (or similar Sans-Serif).
- **Headings:** Bold, clear hierarchy (`h1`, `h2`, `h3`).
- **Body:** 16px base size.

### Spacing
- Standardized grid system using Tailwind's default spacing scale (4px, 8px, 16px, 24px, 32px, 48px).

---

## 3. Component Standards
- **Buttons:** Consistent padding, rounded corners (`rounded-md`), clear focus states.
- **Cards:** Used for sectioning content (e.g., specific requirements).
- **Status Indicators:** Clear badges (Not started, In progress, Submitted, Approved).
