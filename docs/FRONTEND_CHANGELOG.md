# Frontend changelog

## 30 Oct 2026: home dashboard v4 (work first)

- The HR dashboard was rebuilt around the questions HR asks each morning. The new layout, from top to bottom:
  - A greeting with today's date and where payroll stands, plus a **New** menu (add employee, add leave, record attendance, HR request) and **Start payroll** or **Open payroll**.
  - **Needs you:** one prioritized queue of approvals, expired and ending contracts, attendance exceptions, overtime, documents and onboarding. Each row shows its count and opens the records.
  - **Today:** present, late, absent and on leave. On a weekend or before any clock-in it falls back to the last working day. Shows who is out and the leave starting in the next 14 days.
  - **Payroll:** monthly cost and a seven-step cycle tracker.
  - **Coming up (next 30 days):** contract ends, probation ends, birthdays and work anniversaries.
  - **Workforce:** headcount, joiners and leavers this month, a 12-month sparkline, and headcount by department.
- Removed from the home page:
  - The big header banner.
  - The quick-action strip, replaced by the New menu.
  - Dashboard filters.
  - The four KPI cards.
  - Charts with no data.
  - The duplicate contract-expiry panel.
  - Recent activity.
- The trend charts remain in HR Analytics.
- The classes are new (`.dhd`, `.dq`, `.dtt`, `.dpay*`, `.dstp`, `.dul`, `.dwk`) and their styles live in `m8.css`. The v3 dashboard CSS was deleted from `m7.css`.
- Checks: smoke, audit_all (0 issues), neg, valid, flow, flow2, cycle, cycle3, sweep (520), a11y, mob (no overflow), stat_test, t_portal, drw and rolebox all passed, and cloud_e2e had 37 PASS.

## 30 Oct 2026: design system layer and motion

**Added**

- `DESIGN.md`, `docs/FRONTEND_AUDIT.md`, `docs/ANIMATION_GUIDELINES.md`, `docs/COMPONENT_GUIDELINES.md`, and `CLAUDE.md` with instructions for future agents.
- `src/mods/m8.css`, the last CSS layer. It holds tokens for type, space, radius, elevation, controls, focus, motion and layers, and normalizes shared components:
  - Buttons: 40 px, plus `.dng`, `.ghost`, `.sm` and an `aria-busy` spinner.
  - Fields: 42 px, focus ring, `aria-invalid` style, and an error message with an icon.
  - Cards: 20 px, with inner panels at 14 px.
  - Tables: tabular numbers, edge shadows on wide tables, and a fix so scrolled columns no longer peek past the sticky actions column.
  - Badges, toast, drawer elevation, a backdrop while the drawer is open, `.skel` loading bars and `.sr-only`.
  - Global reduced-motion rules.
- GSAP 3.12.5, vendored in `src/vendor/gsap.min.js` and inlined by `build.py`.
- `src/mods/m44_motion.js`, the motion layer:
  - Page entrance on page change only.
  - Dashboard KPI count-up and chart draw-in.
  - Drawer content stagger.
  - Reduced motion through `gsap.matchMedia`.
  - Context cleanup.
- An entrance for the sign-in card, and an `aria-busy` spinner on the Sign in button (`src/cloud_loader.js`).
- `CPY()` in `m0_core.js`. In cloud mode it rewrites prototype wording in notices and empty states with accurate text (loans, documents, personal fields, bank details, permissions, integrations, audit log).
- A skeleton loader for the Users & Access list.

**Changed**

- The CSS page keyframe is disabled when GSAP is active (`html.mo`). If GSAP is missing, it still runs as before.

**Not changed (by decision)**

- The blue sidebar.
- English only, with no right-to-left layout yet.
- The business logic, data model, Supabase calls and routes.

**Checks run** (local build, then the cloud build against the fake backend)

- Every suite in the table exited 0; the right column is what each one printed.

  | Suite | Result |
  |---|---|
  | smoke, neg, flow, flow2, cycle, cycle3, stat_test, drw, ph, prof, lv2, req50 | no errors |
  | audit_all | 0 issues |
  | valid | 0 fails |
  | sweep | 508 checks, no errors |
  | mob | no overflow |
  | rm, rolebox | PASS |
  | t_portal | only the blocked font request |
  | a11y | measured text contrast between 4.68 and 16.05 to 1 |
  | cloud_e2e | 37 PASS |

- Spot checks with scripts:
  - No horizontal overflow at 390, 820 and 1280 px.
  - With reduced motion, `html.mo` is off and content is visible at once.
  - Keyboard focus shows a 2 px outline.
  - Filters do not replay the entrance.
- Screenshots reviewed: dashboard (desktop and mid-entrance), Employees at 1440 and 820 px, Add employee drawer, sign-in at 1440 px (mid-entrance and final), mobile dashboard.
