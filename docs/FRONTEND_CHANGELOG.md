# Frontend changelog

## 30 Oct 2026: finding things, breadcrumb, fixes

- **Search in every list:**
  - Every full table of 8 or more rows has a "Search in this list" box. So do Users & Access (always), Monthly Attendance and the drill-down lists in the side panel.
  - The box filters the rows on screen and matches every word you type, in any column. It shows "6 of 52", a clear message when nothing matches, and Esc clears it.
  - What you typed stays when the page re-renders.
  - Paged lists keep their own search, which covers all pages. The code is `src/mods/m46_find.js`.
- **Global search (Ctrl+K, or the box in the menu):**
  - Matches every word, and shows people first (name, number, job, department, project, email, mobile, manager, location, status).
  - Pages now also match their hub name, tab label and settings description, so "balances" or "tax" finds the right page.
  - Sign-in accounts appear in cloud mode.
- **Top bar:** the product name was replaced with a breadcrumb that shows where you are ("Leave / Leave Balances", "Settings / Company Settings").
- **Long text in tables now wraps inside its column** instead of running over the next column (Tax & Insurance Settings). Tax brackets show one bracket per line.
- **Collapsed menu:** the expand button is always visible at the bottom, the account box shrinks to the avatar, and the account and save-status text hide. The button label switches between "Collapse menu" and "Expand menu".
- Checks: all 21 local suites passed (audit_all 0 issues, sweep 532), and cloud_e2e had 37 PASS.


## 30 Oct 2026: simpler navigation (hubs)

- The side menu went from 47 entries to about 9 (exact numbers depend on the role). Related pages are now tabs inside one hub:
  - **Dashboard**
  - **Inbox:** Approvals, HR requests, Notifications. The menu shows the approvals count.
  - **My portal:** My portal, My profile
  - **Employees:** Directory, Organization chart, Reporting lines, Departments, Job positions
  - **Contracts & records:** Contracts, Probation, Documents, Warnings, Offboarding
  - **Attendance:** Daily, Monthly, Timesheets, Shifts, Overtime, Exceptions
  - **Leave:** Requests, Balances, Calendar, Policies
  - **Payroll:** Overview, Run payroll, Inputs, Loans, Payslips, Final settlements
  - **Reports**
  - **Settings**
- **Settings** is one index page. It lists 17 settings in six groups (Organization, People and access, Payroll, Leave, Email, System), each with a one-line explanation. Every settings page has a "Settings" link back.
- Menu groups that hold a single entry no longer show a heading.
- Employees keep their own short menu (My portal, My profile, Notifications, Leave calendar, Payslips) without hub tabs.
- Page routes are unchanged, so links, search and tests still work. The code is in `src/mods/m45_hubs.js`, with styles at the end of `m8.css`.
- Checks: all 21 local suites passed (audit_all 0 issues, sweep 526), and cloud_e2e had 37 PASS.


## 30 Oct 2026: home dashboard v5 (executive HR summary)

- The dashboard is now a one-page monthly HR summary that can be shown to management and printed. It has these parts:
  - **Header:** "HR summary, October 2026", the as-of date, the employees in service and the payroll state.
  - **Actions:** **Print or save as PDF**, and **Start payroll** or **Open payroll**.
  - **Key figures band:** headcount (vs last month), monthly payroll cost (vs last month), attendance on the last working day, 12-month turnover, open approvals.
  - **Workforce:** the 12-month headcount line, headcount by department, employment type, and joiners and leavers this month.
  - **Payroll cost:** 12 months of gross pay, with basic, allowances and gross for this month.
  - **Attendance and leave:** the on-time, late, on-leave and absent split for the last 30 working days, leave waiting, and approved leave in the next 14 days.
  - **Contracts and compliance:** expired, ending in 30 days, ending in 31 to 90 days, probation ending, missing documents.
- Every figure, bar and row opens the employees behind it.
- A print stylesheet hides the navigation and keeps the cards whole on the page.
- Replaces the v3 KPI cards and the short-lived v4 work-queue layout (CSS for both removed). The quick-action strip is no longer on the dashboard.
- Phone top bar: a menu icon, logo, search icon (opens the search row), notifications and a theme icon. The theme button shows an icon (sun, half circle or moon) on every screen size instead of the word "Light".

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
