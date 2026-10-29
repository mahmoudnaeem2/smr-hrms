# Notes for coding agents

- **Front end:** read `DESIGN.md` before changing any CSS or markup. Component rules are in `docs/COMPONENT_GUIDELINES.md` and motion rules in `docs/ANIMATION_GUIDELINES.md`.
- **Source of truth:** edit `src/` (`src/mods/*.js|css`, `src/frag_v5.html`, `src/cloud_loader.js`). Never edit `index.html`; `python3 build.py` writes it.
- **Styles:** add rules to `src/mods/m8.css` (the last layer). Use the tokens (`--sp-*`, `--r-*`, `--e-*`, `--fs-*`, `var(--brand)`) and do not add new hard-coded colours or sizes.
- **Motion:** use `MO` / GSAP only through `src/mods/m44_motion.js`. Respect reduced motion. Do not add per-card hover lifts or scroll reveals.
- **Copy:** sentence case; buttons are verb first; empty states say what to do next. Wrap notice text in `note()` so `CPY()` can fix wording in cloud mode.
- **Brand:** blue `#0460B5` via `var(--brand)`; keep the blue sidebar; English only (no right-to-left layout yet).
- **Tests:** copy `index.html` to `/tmp/full_new.html` and run `tests/smoke.py`, `tests/audit_all.py`, `tests/a11y.py`. For cloud, build with a fake `config.json`, copy the result to `/tmp/full_cloud.html` and run `tests/cloud_e2e.py`.
- **Back end:** Supabase SQL lives in `supabase/00x_*.sql` and Edge Functions in `supabase/functions/`. Do not change the database contract from front-end work.
