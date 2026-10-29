# Frontend audit

Date: 30 Oct 2026. Scope: the whole web app (`src/`), as built by `build.py` into `index.html`.

## 1. Stack

| Item | Finding |
|---|---|
| Framework | None. Vanilla JavaScript, one page, string templates rendered into `#view`. |
| Routing | In-memory `page` key plus `location.hash`. `draw()` re-renders the page. |
| Styling | Plain CSS in four layers, joined in this order: inline `<style>` in `src/frag_v5.html`, `m5.css`, `m6.css`, `m7.css`. Later layers override earlier ones. |
| Fonts | Plus Jakarta Sans from Google Fonts. The skeleton links IBM Plex Sans, and `build.py` swaps it at build time. |
| Charts | Hand-written inline SVG (`line`, `stack`, `cols`, `hbars` in the base script). |
| Icons | Inline SVG paths (`m30_icons.js`). |
| Dependencies | None at runtime. Python and Playwright are used only for build and tests. |
| Back end | Supabase via `src/cloud_loader.js`. Out of scope for this work; not changed. |
| Agent instructions | No `CLAUDE.md` or `AGENTS.md`. The project's only docs are `README.md` and `docs/SUPABASE_SETUP.md`. |

## 2. Routes

There are 89 registered pages. 47 are in the side menu and 42 open from links: reports, drill-downs and sub-pages.

| Menu group | Pages |
|---|---|
| Home | Dashboard, Payroll Dashboard, Approvals, My Portal, My Profile, HR Requests, Notifications |
| People | Employees, Organization Chart, Reporting Lines, Departments, Job Positions, Contracts, Probation Tracker, Documents, Warnings, Offboarding |
| Time & Leave | Daily Attendance, Monthly Attendance, Timesheets, Shifts & Scheduling, Overtime, Exceptions, Leave Requests, Leave Balances, Leave Calendar |
| Payroll | Payroll Processing, Payroll Inputs, Loans, Payslips, Final Settlements |
| Reports | All Reports. This opens 30 report pages, for example Salary Register, Leave Liability and Who Is Out. |
| Settings | Company, Users, Roles & Permissions, Employee Access, Approval Workflows, Cost Centers & Projects, Payroll Periods, Salary Components, Tax & Insurance, Public Holidays, Leave Policies, Email Settings, Email Outbox, Integrations, Audit Logs |
| Not in menu | Employee Profiles, Onboarding, Recruitment, Performance Reviews, Training, Payroll Register, Reconciliation, Variance, Journal Entry, Data Completeness, My Requests, and the report pages |

Page layout pattern: a page header (`.ph`: title, description, actions), then content in `#view`. Drill-downs open in a side drawer (`#drawer`).

## 3. Component inventory

| Component | Where it is defined | Notes |
|---|---|---|
| Button `.b`, `.b.p` (primary) | base style, restyled in m6 and m7 | Heights vary between 34 and 46 px. No danger variant except one-off `.dng`. |
| Icon button `.iconbtn` | base, m7 | Fine. |
| Field `fld()` (label + input/select) | `m0_core.js` | Labels are visible. Errors are shown in a separate `.err` block, and fields are not marked `aria-invalid`. |
| Table `tbl()` | `m0_core.js` | Rendered inside `.card.wrap`. Wide tables clip the last columns on 1440 px screens (Employees: "Hire date"). Some pages have pagination (`ps`); sorting exists on some tables only. |
| Tabs `tabs()` and `.ptabs` | base, m7 | Two visual styles exist. |
| Badge `bd()` with `.s-ok`, `.s-wn`, `.s-er`, `.s-mu` | base | Consistent. |
| Card `.card` | everywhere | Border radius is overridden four times (14, 16, 20, 22 px). |
| KPI `.k` (old), `.sc` (dashboard v3), `.tile` | base, m7 | Three KPI styles. |
| Drawer `#drawer` | frag, m41 | CSS keyframe slide-in; closes on outside click and Esc. |
| Toast `#toast` | `m0_core.js` | `role="status"`. Fine. |
| Empty state `.empty` | base, m7 | Large dashed box in many cards. |
| Notice `note()` | `m0_core.js` | Several notices still say "prototype" in the live cloud build. |
| Sign-in | `cloud_loader.js` (cloud) and `#gate` (local preview) | Cloud sign-in was redesigned on 29 Oct. |

## 4. Findings

### Design-system debt (high)

1. Four overlapping CSS layers, with 234 `!important` in `m7.css` alone. New rules have to fight old ones.
2. No token scale:
   - 20 different font sizes, including 11, 11.5, 12, 12.5, 13 and 13.5 px.
   - 12 different border radii.
   - The brand blue `#0460B5` is hard-coded 52 times instead of using `var(--brand)`.
3. Three KPI card styles and two tab styles.
4. Button heights are inconsistent.

### Motion (medium)

5. The page-enter animation is a CSS keyframe on every child of `#view`. Search and filters used to replay it (screen shake). This is now patched by a MutationObserver hack in `m41_drawer.js`.
6. No coordinated entrance on the dashboard, and charts appear without transition.
7. `prefers-reduced-motion` is handled for the sidebar and drawer only.

### Usability and accessibility (medium)

8. Wide tables clip columns and give no cue that they scroll.
9. Form errors are not linked to their fields (`aria-invalid`, `aria-describedby`).
10. Tables do not use `tabular-nums`, so money columns do not line up.
11. Most admin tables show dates as dd/mm/yyyy, while the dashboard and employee pages use "29 Oct 2026".
12. Loading states are plain text ("Loading accounts…"). There are no skeletons.

### Content (low)

13. "Prototype" wording still appears in cloud mode: loans, documents, personal fields, permissions, integrations and the audit log.

### Performance (low)

14. The page is a single self-contained HTML file of about 750 KB. It has no images except inline SVG.
15. The Google Fonts request blocks rendering for a moment. `display=swap` is set.

## 5. Plan (prioritized)

| # | Work | Why |
|---|---|---|
| 1 | Write `DESIGN.md` and add one final token layer (`m8.css`). The layer defines type, spacing, radius, elevation, motion and z-index tokens, then normalizes buttons, inputs, tables, tabs, badges, cards, empty states and the drawer. | Fixes debt items 1 to 4 without touching business logic. |
| 2 | Add GSAP (vendored inline, so there is no runtime CDN dependency) through one motion module, `m44_motion.js`. It adds a page reveal only when the page changes, the dashboard entrance with chart draw-in, number count-up on KPI cards, and a reduced-motion fallback. Remove the CSS page keyframe and the anti-shake hack. | Fixes motion items 5 to 7. |
| 3 | Improve tables: scroll shadow cue, `tabular-nums`, header weight, row density, `aria-invalid` styling for fields. | Fixes items 8 to 10. |
| 4 | Add skeleton loading for cloud lists, and remove the prototype wording from cloud mode. | Fixes items 12 and 13. |
| 5 | Run regression tests, take screenshots at desktop, tablet and mobile, then write the docs, changelog and `CLAUDE.md`. | Verifies the work and shows the result. |

Deliberately not done now:
- **Arabic and right-to-left:** English only was decided. New CSS uses logical properties where cheap.
- **Sidebar:** the current blue sidebar is kept, as decided.
- **Date format across admin tables:** tracked in Backlog; it needs per-table changes.
