# Change History (HR Onboarding)

## 2026-09-16 — Complete Layout Update matching Reference Design

### What was changed
- **`app/dashboard/page.tsx` & `lib/mock-data.ts`**:
  1. **Header Bar**:
     - Left: Branding updated to **"Philkoei International, Inc. (PKII)"** with the subtitle **"Consultants, Planners, Engineers"**.
     - Right: User profile configured for **John Pritch L. Arcas** with employee details.
     - Added an active **"30 days remaining"** countdown timer badge.
  2. **Left Sidebar Navigation**:
     - Main onboarding portal directory containing:
       - **Welcome**
       - **Employment Forms** (with "Restricted" status indicator)
       - **ID Photo**
       - **Pre-Employment Requirements** (default active page)
       - **Medical**
       - **First Day Preparation**
       - **Data Privacy**
       - **Need Help**
  3. **Main Content Area (Pre-Employment Requirements Workspace)**:
     - Header area with "Download Form Templates" option.
     - Document checklist with clear distinction between **mandatory items (marked with `*`)** and **conditional items (marked as `(If Applicable)`)**:
       - *Employment Application Form* (includes "Download Form" action button)
       - *PSA Birth Certificate\**
       - *Marriage Certificate (If Applicable)*
       - *SSS Form E1 / SSS ID\**
       - *PhilHealth MDR\**
       - *2x2 / 1x1 Photo\**
       - *BIR Form 2316\**
       - *PAG-IBIG MDR\**
       - *BIR Form 1902 / TIN ID\**
       - *Diploma\**
       - *Transcript of Records\**
       - *PRC License (If Applicable)*
       - *NBI Clearance\**
       - *Certificate of Employment (If Applicable)*
     - Each item is equipped with its individual **Upload** action button and real-time status pill.
     - Footer note added: *"Important: Ensure all scanned documents and photos are clear, legible, and up to date. Incomplete or blurred submissions will be marked as 'Needs Changes' and will require re-uploading."*
  4. **Right Sidebar (Getting Started Checklist)**:
     - Shows **Overall Progress** metric with progress bar.
     - Sequential step-by-step milestones (Complete Employee Forms, Upload ID Photo, Submit Pre-Employment Requirements, Complete Medical, Review First Day Preparation, Privacy Policy) paired with individual **"Start" / "Viewing"** buttons that navigate directly to the corresponding section.

### Verification
- `npm run build` executed successfully without errors or warnings.
