# Neuro360 Website Changes Report
### (After 27 October 2024)

---

## Summary

| Metric | Count |
|--------|-------|
| **Total Commits (Changes)** | **162** |
| **Total Days Website Changed** | **49 days** |

---

## Month-wise Breakdown

| Month | Days Changed | Total Commits |
|-------|-------------|---------------|
| Aug 2025 | 6 | 10 |
| Sep 2025 | 1 | 13 |
| Nov 2025 | 7 | 35 |
| Dec 2025 | 12 | 30 |
| Jan 2026 | 17 | 58 |
| Feb 2026 | 4 | 13 |
| **TOTAL** | **49** | **162** |

---

## Day-wise Commit Count

| # | Date | Commits | Description of Changes |
|---|------|---------|----------------------|
| 1 | 2025-08-09 | 2 | First Neuro360 commit, A1 |
| 2 | 2025-08-11 | 1 | A2 |
| 3 | 2025-08-19 | 1 | A3 |
| 4 | 2025-08-20 | 1 | A4 |
| 5 | 2025-08-22 | 2 | A5, Remove AWS credentials from tracking |
| 6 | 2025-08-28 | 2 | A6 lab, Modern hospital-themed UI overhaul (glassmorphism design, sidebar, clinic management) |
| 7 | 2025-09-19 | 13 | SuperAdmin, Supabase integration, Vercel deployment fixes (CORS, Tailwind, SPA routing, monorepo structure) |
| 8 | 2025-11-07 | 1 | Update Neuro360 |
| 9 | 2025-11-13 | 1 | Enhanced features and documentation |
| 10 | 2025-11-19 | 4 | Landing pages, Registration page, Updates of landing pages |
| 11 | 2025-11-20 | 21 | **Biggest day!** - Sidebar/Navbar changes, Profile image (Supabase Storage), Clinic login fix, SuperAdmin activate/deactivate clinics, Registration form fixes, LastPass icon fix, Branding logos, Clinic validation, Landing page buttons |
| 12 | 2025-11-21 | 3 | Landing page navbar design, Footer tagline update |
| 13 | 2025-11-25 | 1 | Patient dashboard, profile management, report handling |
| 14 | 2025-11-26 | 1 | QEEG Algorithm 1 Data Processor with OpenAI integration |
| 15 | 2025-11-28 | 8 | PDF reports (Supabase storage, download fix, design update, button color), CORS fix |
| 16 | 2025-11-29 | 1 | Today's update |
| 17 | 2025-12-01 | 1 | PDF report generation improvements |
| 18 | 2025-12-05 | 4 | Login page, NeuroSense report, PDF generation improvements, Git fixes |
| 19 | 2025-12-06 | 3 | Patient, Add form, Updated report |
| 20 | 2025-12-12 | 2 | Registration form, Gemini code update |
| 21 | 2025-12-13 | 1 | UI changes update |
| 22 | 2025-12-15 | 1 | Updated UI |
| 23 | 2025-12-17 | 1 | Update UI |
| 24 | 2025-12-18 | 2 | Parameter update, UI update |
| 25 | 2025-12-19 | 5 | Patient login, EDF upload fix, Updated report |
| 26 | 2025-12-20 | 1 | Updated UI landing |
| 27 | 2025-12-22 | 5 | Algorithm 2, UI updates, Guide page update |
| 28 | 2025-12-23 | 2 | Gemini AI error handling fix, CORS configuration |
| 29 | 2026-01-05 | 2 | Updates |
| 30 | 2026-01-09 | 4 | Merge branch, Delete Dockerfile, Updates |
| 31 | 2026-01-10 | 2 | Updates (pp3, pp4) |
| 32 | 2026-01-12 | 3 | UI changes |
| 33 | 2026-01-13 | 8 | Brochure, Replace external media logos with local images, Video file gitignore, Website changes |
| 34 | 2026-01-14 | 6 | Bundle optimisation, Multiple updates |
| 35 | 2026-01-15 | 1 | Update |
| 36 | 2026-01-16 | 2 | Login, Poonam update |
| 37 | 2026-01-17 | 7 | Email/Nodemailer setup, CORS fix, Node.js version update (20.19.0 for Vite 7) |
| 38 | 2026-01-19 | 1 | Patient dashboard |
| 39 | 2026-01-20 | 3 | Patient dashboard updates |
| 40 | 2026-01-21 | 5 | Dynamic brain page, Email system (Resend switch, SMTP fix, Contact form fix) |
| 41 | 2026-01-23 | 3 | Updates, SMTP port revert |
| 42 | 2026-01-24 | 6 | Clinical documentation form, Form update, Scroll fix, Error fix |
| 43 | 2026-01-27 | 3 | Patient dashboard, Video update |
| 44 | 2026-01-28 | 1 | Patient dashboard videos |
| 45 | 2026-01-29 | 5 | Sidebar, Photobiomodulation, Location updates |
| 46 | 2026-02-03 | 2 | Scrollbar fix, Upgrade now |
| 47 | 2026-02-04 | 1 | Update |
| 48 | 2026-02-06 | 4 | Logo change, Rename, Updates |
| 49 | 2026-02-07 | 2 | P1, P2 |

---

## Key Feature Changes (Category-wise)

### 1. UI/Landing Pages
- Modern hospital-themed UI overhaul with glassmorphism design
- Landing page navbar, footer, buttons redesign
- Sidebar/Navbar restructuring (move profile to navbar)
- Branding logos (theme-based, collapsed sidebar)
- Scrollbar fixes, UI guide page updates
- Replace external media logos with local images

### 2. Patient Dashboard
- Patient dashboard creation and multiple updates
- Patient login system
- Profile management
- Video integration in patient dashboard
- Clinical documentation form

### 3. PDF Reports
- PDF generation with professional layout
- Supabase storage integration for PDF reports
- PDF download fix (trigger download vs open in tab)
- PDF design matching reference template
- Color coding consistency

### 4. Admin/SuperAdmin
- SuperAdmin panel
- Activate/deactivate clinics
- Clinic validation and linking for patient registration

### 5. Backend/Server
- Supabase integration (auth, storage, database)
- Vercel deployment and configuration fixes
- CORS fixes (multiple origins)
- Email system (Nodemailer, Resend, SMTP configuration)
- Node.js version update to 20.19.0
- QEEG Algorithm with OpenAI/Gemini integration
- EDF file upload fix

### 6. Registration/Login
- Registration form improvements
- Different account type labels
- Clinic name field for clinic registration
- LastPass icon removal
- Datepicker enhancement

### 7. Performance/Optimization
- Bundle optimization
- Large video file management (.gitignore)
- AWS credentials removal from tracking

### 8. Other
- Dynamic brain page
- Brochure
- Photobiomodulation page
- Location updates
- FAQ updates

---

*Report generated on: 2026-02-10*
