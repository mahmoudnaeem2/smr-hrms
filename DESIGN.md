# SMR HRMS & Payroll: design system

This file is the single source of truth for the front end. Read it before changing anything in `src/mods/*.css`, `src/frag_v5.html` or the markup inside the `.js` modules.

## 1. Philosophy

The audience is HR, payroll and finance staff who use the app for hours every day. Employees also use it a few minutes at a time, often on a phone. The design follows from that:

- **Calm and dense enough to work in.** One brand colour, white surfaces and a light blue-grey page. There is no decoration that does not carry information.
- **Numbers first.** Figures use tabular numerals so money and counts line up. A KPI shows the number large, with one short line of context under it.
- **A summary people can read.** The home page is a one-page monthly HR summary, laid out like a short report: key figures in one band, then four sections. It prints cleanly. Red is used only for items that need action.
- **Motion explains change.** Content enters once when the page changes. Panels slide from where they come from. Nothing loops and nothing moves on its own.
- **Accessible by default.** The target is WCAG 2.2 AA:
  - Visible focus on every control.
  - Text contrast of at least 4.5:1. The `tests/a11y.py` check passes on all measured elements.
  - Touch targets of at least 34 px.
  - `prefers-reduced-motion` turns all motion off.

## 2. Brand

| Token | Light | Dark | Use |
|---|---|---|---|
| `--brand` | `#0460B5` | `#5aa9ee` | Links, active states, focus, primary data series |
| `--btn` / `--btn-d` | `#0460B5` / `#034a8c` | `#2a78c4` / `#3a89d6` | Primary button and its hover |
| `--side` | `#0460B5` | `#06284a` | Sidebar (kept blue by decision, 30 Oct 2026) |
| `--bg` | `#f3f5fb` | `#0a111d` | Page background |
| `--surf` | `#ffffff` | `#111b2c` | Cards, drawer, table cells |
| `--soft` | `#eef2f8` | `#16294a` | Hover, chips, icon tiles |
| `--tx` / `--mu` | `#14213a` / `#3f4f68` | `#e8eef8` / `#94a5bd` | Text and secondary text |
| `--bd` | `#d5dde9` | `#223049` | Borders |
| `--ok` `--wn` `--er` | green, amber, red | lighter tints | Status. Always paired with a word, never colour alone |

Colours live in `:root` in `src/frag_v5.html` and `m7.css`. **New code uses `var(--brand)` and does not hard-code `#0460B5`.**

## 3. Tokens (`src/mods/m8.css`)

| Group | Tokens |
|---|---|
| Type size | `--fs-xs` 12, `--fs-sm` 13, `--fs-md` 14, `--fs-base` 15.5 (body), `--fs-lg` 18, `--fs-xl` 22, `--fs-2xl` 28, `--fs-3xl` 36 px |
| Weight | `--fw-reg` 400, `--fw-med` 500, `--fw-semi` 600, `--fw-bold` 700, `--fw-x` 800 (page titles and KPI numbers only) |
| Space | 4 px grid: `--sp-1` 4 … `--sp-10` 40 |
| Radius | `--r-xs` 6 (skeleton bars), `--r-sm` 8, `--r-md` 10 (buttons, fields), `--r-lg` 14 (inner panels, notices, toast), `--r-xl` 20 (cards), `--r-pill` |
| Elevation | `--e-1` resting controls, `--e-2` raised cards on hover, `--e-3` drawer, toast and menus. All are tinted navy, never pure black |
| Controls | `--h-ctl` 40 (button), `--h-ctl-sm` 34 (button in a table), `--h-fld` 42 (input and select) |
| Focus | `--ring` (brand at 26 %) for mouse focus; a 2 px brand outline for keyboard focus (`:focus-visible`); `--ring-er` for invalid fields |
| Motion | `--dur-1` 0.12 s (hover), `--dur-2` 0.2 s (rings, backdrop), `--dur-3` 0.32 s (entrances); `--ease` cubic-bezier(.2,.7,.2,1) |
| Layers | `--z-top` 15, `--z-side` 20, `--z-drawer` 40 (backdrop is one below), `--z-toast` 60, `--z-menu` 1000 |

**Typeface:** Plus Jakarta Sans, weights 400 to 700, from Google Fonts. It falls back to system-ui. Body text is 15.5 px with a line height of 1.55.

## 4. Layout

```
+-----------+----------------------------------------------+
| sidebar   | top bar: product name · bell · theme          |
| 288 px    +----------------------------------------------+
| (76 px    | page header .ph (title, description, actions) |
|  rail)    | #view: cards in grids (dg2 / dg3 / scs4)      |
+-----------+----------------------------------------------+
                                  drawer #drawer → (620 px)
```

- **Breakpoints:**
  - ≤ 560 px: one column.
  - ≤ 900 px: the sidebar becomes an off-canvas menu and the top bar wraps.
  - ≤ 1100 px: KPI grid of 2 and single-column dashboard rows.
  - Desktop: up to 1440 px and wider.
- **Text:** content is left-aligned, and line length stays under about 75 characters (`max-width: 62–70ch` on descriptions).
- **Right-to-left:** the app is English only for now. New CSS should prefer logical properties (`margin-inline`, `inset-inline`) so it can be added later.

## 4b. Navigation

- The menu shows **hubs**, not pages. A hub groups related pages and shows them as tabs above the page title (`.hubt`). There are 10 hubs: Dashboard, Inbox, My portal, Employees, Contracts & records, Attendance, Leave, Payroll, Reports and Settings.
- The hubs are defined in `HUBS` in `m45_hubs.js`, and the settings list in `SETG`.
- **Adding a page:**
  - Add it to an existing hub; don't create a new menu entry.
  - A settings page goes into `SETG`, with a one-line description.
- The Employee role gets its own short menu and no hub tabs.

## 5. Components

The full rules are in `docs/COMPONENT_GUIDELINES.md`. In short:

| Component | Rule |
|---|---|
| Button `.b` | 40 px high and 10 px radius. Labels are verb first ("Save changes"). Variants: `.p` primary (one per area), `.dng` destructive, `.ghost`, `.sm` (34 px, used in tables). Busy state: `aria-busy="true"` adds a spinner and blocks clicks. |
| Field | 42 px high with a visible label above. Focus shows the brand border and ring. Errors set `aria-invalid="true"` and the red border, and the message sits in `.err` with an icon. |
| Card `.card` | 20 px radius. An inner panel uses 14 px. Do not nest a card inside a card for decoration. |
| Table `tbl()` | Header 12.5 px semibold in the muted colour, with tabular numbers. Wide tables scroll inside the card, with shadow cues at the edges. `table.stk` keeps the actions column visible. |
| Badge `bd()` | Pill, 12 px semibold: `s-ok`, `s-wn`, `s-er` or `s-mu`. The text always states the status. |
| KPI `.sc` | Label, icon tile, 42 px number, one context line. `.hl` fills it with the brand colour when it needs attention. |
| Drawer `#drawer` | Slides in from the right and dims the page. Closes with Close, Esc or a click outside. |
| Toast `#toast` | `role="status"`; past-tense message ("Saved"). |
| Empty state `.empty` | Says what is missing and how to add it, for example: "No requests yet. Use the form above…" |
| Loading `.skel` | Shimmer bars plus visually hidden text. The container gets `aria-busy="true"`. |
| Notice `note()` | Grey info panel (`sm`) or amber warning. In cloud mode, `CPY()` swaps any prototype wording for accurate text. |

## 6. Motion

See `docs/ANIMATION_GUIDELINES.md`. In summary:
- GSAP 3.12.5 is vendored in `src/vendor/gsap.min.js` and inlined at build time, so there is no runtime CDN.
- `src/mods/m44_motion.js` owns all GSAP use:
  - Page entrance only when the page, role or data mode changes.
  - On the dashboard: KPI count-up and charts that draw in.
  - Drawer content stagger.
- The sign-in card has one entrance (`cloud_loader.js`).
- CSS handles hover, rings and the drawer slide.
- Reduced motion turns GSAP off (the `html.mo` class is removed) and shortens every CSS animation to 0.01 ms.

## 7. Writing

- Sentence case everywhere.
- Buttons say what happens ("Create account", "Reset password"), and the toast echoes it ("Account created").
- Dates read "29 Oct 2026" in the dashboard and employee pages. Older admin tables still show dd/mm/yyyy; this is tracked in Backlog.
- Errors say what happened and what to do, without apologizing.
