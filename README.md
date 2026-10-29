# SMR HRMS & Payroll (prototype)

Single-page HR and payroll prototype for Savills Management Resources (Egypt).
Plain HTML, CSS and JavaScript. No framework and no server: data is stored in the browser (localStorage).

Live: https://mahmoudnaeem2.github.io/smr-hrms/

## Layout

- `index.html` is the built app. This is the file GitHub Pages serves. Do not edit it by hand.
- `src/frag_v5.html` is the page skeleton and base script.
- `src/mods/*.js` are the modules, joined in this order by `build.py`:
  m0_core, payroll_engine, m1_people, m2_time, m3_payroll, m4_talent_admin, m8_io, m9_files, m10_projects, m13_reports, m11_edit, m12_access, m14_nav, m15_requests, m16_portal, m17_login, m18_seed, m19_notify, m20_extra, m21_mail, m5_boot, then dash_new.js.
- `src/mods/m5.css`, `m6.css`, `m7.css` are the styles (m7 is the latest layer).
- `build.py` joins everything and patches the base script (the `R_(old, new)` lines), then writes `index.html`.
- `tests/` holds Playwright checks (see below).

## Build

```
python3 build.py        # writes index.html and dist/chk.js
node --check dist/chk.js
```

Edit a file in `src/mods/`, run the build, open `index.html`.
A later function with the same name overrides an earlier one, which is how newer modules replace older pages.

## Tests

Needs Python 3 with Playwright (`pip install playwright && playwright install chromium`).
The scripts open the app at `file:///tmp/full_new.html`, so copy it first:

```
cp index.html /tmp/full_new.html
python3 tests/smoke.py
python3 tests/stat_test.py     # every dashboard stat opens a list
python3 tests/crawl.py "HR Director"   # clicks every button of a role and reports dead ones
```

## Important limits

- All data and any sign-in details stay in each person's own browser. There is no shared database and no real security.
- Payroll rules (insurance, tax, overtime) are loaded as TRIAL values and must be checked by an accountant before real use.
- Email notifications open ready-filled in Outlook. The app cannot send mail by itself.
- Employee salaries, dates and phones in the starter team are placeholders.

## Next step for real use

Move storage to a server database (for example Supabase) with real sign-in and per-role access rules, then connect email sending through the company mail system.
