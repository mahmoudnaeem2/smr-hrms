# Component guidelines

Components are string-template helpers in `src/mods/m0_core.js` and the base script. Their styles end in `src/mods/m8.css`, the last CSS layer. Use the helpers; do not hand-write new variants.

## Helpers

| Helper | Output | Notes |
|---|---|---|
| `tbl(cols, rows, {empty, csv, ps})` | Table in `.card.wrap` | `empty` text must say what is missing and how to add it. Use `ps` for pagination where the page supports it. Do not add sort or filter controls that do nothing. |
| `bd(text, cls)` | Badge | `s-ok`, `s-wn`, `s-er`, `s-mu`. |
| `note(html, cls)` | Notice | `sm` = info (grey), no class = warning (amber). The text passes through `CPY()`, which rewrites prototype wording in cloud mode. |
| `fld(label, name, type, {req, opts, val})` | Labelled field | Required fields show `*` and are checked on submit. |
| `drawer(title, desc, html)` | Side panel | Title in sentence case. The first focusable element gets focus. |
| `toast(msg)` | Status message | Past tense, matching the button ("Save changes" → "Changes saved"). |
| `ask(msg, okLabel, fn)` | Confirm dialog | The button names the action ("Reset password"), never "OK". |
| `avi(e)` | Avatar | Photo if set, otherwise initials (skips El, Al, ال). |

## Buttons

| Class | Use | States |
|---|---|---|
| `.b` | Secondary action | hover `--soft`, focus ring, press 1 px down, `:disabled` at 48 % with a not-allowed cursor |
| `.b.p` | The main action of an area; one per card or form | hover deepens and lifts the shadow |
| `.b.dng` | Disable, delete, reject | red text; red tint on hover |
| `.b.ghost` | Low-emphasis tool buttons | transparent until hover |
| `.b.sm` (automatic in `td`) | Row actions | 34 px high |
| `[aria-busy="true"]` | While saving | spinner, clicks blocked; remove the attribute when done |

## Fields

- Put the label above the field. Use a placeholder only for an example ("name@savills.me").
- Heights: 42 px for inputs and selects; textarea at least 96 px.
- Focus: brand border plus `--ring`. Keyboard focus also gets a 2 px outline.
- Invalid: set `aria-invalid="true"` on the field and put the message in the form's `.err` element (`role="alert"` where present). The message says how to fix it: "Enter your full work email, for example name@savills.me."

## Tables

- Header: 12.5 px semibold, muted colour, no capitals. Body: tabular numbers.
- Long tables use `ps` pagination. Wide tables scroll inside the card, and edge shadows show that more is there.
- An actions column that must stay visible uses `table.stk`, which keeps the last column sticky with a shadow.
- On phones, tables scroll sideways. The drill-down drawer (`m41_drawer.js`) turns rows into cards.

## Cards and KPIs

- `.card`: 20 px radius, `--surf`, 1 px border, `--e-1`. Use `h2` at 17 px bold for the card title, with an optional `.mu` line under it.
- Dashboard KPI `.sc`: label, icon tile, number, one context line. Use `.hl` only when the number needs action (approvals or contracts above 0).
- Do not invent new KPI styles. The older `.k` and `.tile` styles stay only where they already exist.

## Empty, loading and error

| State | Pattern |
|---|---|
| Empty | `.empty` with one sentence and, where possible, the next action. |
| Loading | `<div class="card" aria-busy="true"><span class="sr-only">Loading …</span><div class="skel" aria-hidden="true"><i></i>…</div></div>` |
| Error | `note(msg, "er")` for page-level errors, `.err` for form errors. The message says what happened and what to do. |

## Accessibility checklist for any new component

- [ ] Reachable and operable by keyboard; focus is visible.
- [ ] It has a name: a visible label or `aria-label`.
- [ ] Status is not shown by colour alone.
- [ ] Contrast is at least 4.5:1 for text (`tests/a11y.py`).
- [ ] Targets are at least 34 px (44 px on mobile primary actions).
- [ ] Works with `prefers-reduced-motion: reduce`.
