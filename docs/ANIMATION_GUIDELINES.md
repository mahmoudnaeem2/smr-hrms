# Animation guidelines

## Setup

- **GSAP 3.12.5**, the core build only (`src/vendor/gsap.min.js`, 72 KB). It is used under the GreenSock standard no-charge license.
  - `build.py` inlines it in a `<script>` before the app and the cloud loader. No CDN is needed at runtime.
  - No plugins are loaded (ScrollTrigger, SplitText). The app has no long scrolling pages that would justify them.
- All app motion lives in `src/mods/m44_motion.js`, which exposes `MO`:
  - `MO.on`: motion is active.
  - `MO.reveal()`: replays the page entrance.
  - `MO.countUp(el)`: counts a number up.
  - `MO.gsap`: the GSAP instance.

## Patterns

| Pattern | Trigger | Spec |
|---|---|---|
| Page entrance | `#view` children change **and** the page, role or data mode changed. Re-renders from search, filters or saves never replay it. | Header, then the first 10 blocks: opacity 0 → 1, y 8–12 px → 0, 0.36 s `power2.out`, stagger 0.045 s. |
| KPI count-up | Dashboard entrance only | `.scn` and `.k .v` values whose number is 2 or more. 0.6 s `power2.out`. Prefix and suffix are kept ("EGP 156k"), and the original text is restored at the end. |
| Chart draw-in | Dashboard entrance only | Lines use a stroke-dash draw (0.8 s `power3.out`). Bars grow from the baseline (`scaleY`, stagger 0.012 s). Horizontal bars and the progress bar grow from the left. |
| Drawer content | `#drawer` gets `.open` | The first 8 blocks of `#db` stagger in (0.36 s, 0.04 s) after the CSS slide starts. |
| Sign-in card | First time the sign-in gate is shown | Card 0.5 s (y 18 px, scale 0.985), then the form rows and the feature list in sequence. |
| Hover, focus, press | CSS | Background and border 0.12 s; focus ring 0.2 s; press is translateY(1 px). |
| Backdrop | CSS | Opacity 0.2 s while the drawer is open. |
| Loading | CSS | `.skel` shimmer at 1.2 s, and the `aria-busy` spinner on buttons. |

## Rules

1. Animate only `opacity` and `transform`. The exceptions are the SVG stroke-dash draw on charts and the scale of bars.
2. Every GSAP tween ends with `clearProps`, so no inline style is left behind.
3. Each page entrance runs in one `gsap.context()`. A new entrance calls `ctx.revert()` on the previous one, so nothing leaks when the page changes mid-animation.
4. Reduced motion:
   - `gsap.matchMedia("(prefers-reduced-motion: no-preference)")` gates everything.
   - Under "reduce", `html.mo` is removed, CSS animations are cut to 0.01 ms and content shows immediately.
5. If GSAP fails to load, `MO.on` is false and the old CSS page keyframe (`vin` in `m7.css`) still runs. The interface stays usable.
6. Do not animate data that updates often: live counters, notification badges, table re-sorts.
7. Do not add scroll-triggered reveals or hover lifts on every card. One coordinated entrance per page is the whole budget.

## Checklist for new motion

- Does it answer a user action or a page change? If not, drop it.
- Under 0.4 s for anything people wait on?
- Tested with `reduced_motion='reduce'` in Playwright?
- Does a quick second navigation leave no half-faded content? Revert the context.
