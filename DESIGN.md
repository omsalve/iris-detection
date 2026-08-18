# Design

Recorded from the built app, not from intention. Product truth lives in
[PRODUCT.md](PRODUCT.md); this file owns visual decisions only.

**The idea:** soft dark ground, one periwinkle accent, generous rounding,
spring motion — and the eye as the app's living centrepiece rather than a
logo. Calm, modern, human. Nothing here is blocky, and nothing has a sharp
corner.

Everything below is defined in `iris-detection/app/globals.css` unless
stated otherwise.

---

## Ground

Ink, never black. Surfaces lift with elevation and a lit top edge; they are
not outlined boxes.

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0e0f13` | page ground |
| `--surface` | `#16181e` | cards |
| `--raised` | `#1e212a` | buttons, inputs at rest |
| `--raised-hi` | `#262a35` | hover, active segment |
| `--line` | `rgb(255 255 255 / .07)` | hairline borders |
| `--line-strong` | `rgb(255 255 255 / .13)` | input borders |
| `--sheen` | `rgb(255 255 255 / .06)` | the inset top-edge highlight |

**Rule:** a card is `background + 1px --line + --lift-1 + inset top --sheen`.
The inset highlight is not optional — without it a dark card reads as a hole
punched in the page rather than a surface sitting on it. Use the `.card`
class rather than reassembling it.

## Colour

Periwinkle carries the brand. Green and rose are **reserved for the verdict**
and are never used decoratively.

| Token | Value | Means |
|---|---|---|
| `--accent` | `#a5b4fc` | brand, primary action, focus |
| `--accent-deep` | `#818cf8` | pressed / selection |
| `--granted` | `#4ade80` | let in |
| `--denied` | `#fb7185` | turned away |
| `--warn` | `#fbbf24` | alert, offline, no camera |

Each has a `*-dim` companion at ~14% for chip and callout beds.

**Rule:** identity colour may never borrow a verdict colour.
`AVATAR_TINTS` in `app/lib/log.ts` deliberately contains no green, rose or
amber, so a person's avatar can never be mistaken for a state.

## Text

| Token | Value | On ink | On surface |
|---|---|---|---|
| `--text` | `#edeff4` | 16.7:1 | 15.4:1 |
| `--muted` | `#9aa1b0` | 7.4:1 | 6.9:1 |
| `--faint` | `#8b93a4` | 6.2:1 | 5.8:1 |

Every text token clears WCAG AA on every ground. Nothing smaller than
`0.8125rem` (13px) carries meaning, and there is no uppercase letter-spaced
running text anywhere.

## Type

One family does everything: **Onest** (variable), loaded via `next/font`.
Body letter-spacing is `-0.011em`; `.display` tightens to `-0.035em` with
`text-wrap: balance`.

**Geist Mono** appears only through `.num`, and only on real measurements —
confidence percentages, clock times, counts. It is never a costume for
"technical".

## Shape

`--r-xs 8` · `--r-sm 12` · `--r-md 16` · `--r-lg 22` · `--r-xl 30` ·
`--r-pill 999`.

Cards are `--r-lg`, inputs and medium buttons `--r-md`, sheets `--r-xl`,
chips and segmented controls pill. `border-radius: 0` is reset off form
elements globally.

## Motion

Springs arrive, curves settle.

| Token | Value | Use |
|---|---|---|
| `--d-fast` | 180ms | hover, press, colour |
| `--d` | 320ms | content changes |
| `--d-slow` | 560ms | entrances, the eye's moods |
| `--spring` | `cubic-bezier(.34,1.56,.64,1)` | things that arrive |
| `--out` | `cubic-bezier(.22,1,.36,1)` | things that settle |

Helpers: `.a-rise` `.a-fade` `.a-pop` `.a-breathe` `.a-orbit` `.a-slide`,
plus `.stagger` which delays direct children 40ms apart so a group arrives
in sequence rather than all at once.

Buttons scale to `0.975` on `:active` — the app should feel pressed.

**Reduced motion:** all durations collapse to 1ms, entrance animations are
removed (not merely shortened, so nothing can be left invisible), ambient
loops stop, and the eye's tracking loop and blink never start.

## The eye — `app/components/Eye.tsx`

The centrepiece, and the one element carried over from the original design.
Same anatomy and the same mouse-tracking idea, rebuilt.

**Construction**, outside in: opening path (two cubics, heavier upper lid —
that asymmetry is most of what separates an eye from a symmetric lens) →
sclera (never pure white; `#f7f8fb` → `#aeb6c8`) → iris contact shadow →
iris gradient → two fibre passes → collarette drawn as two offset strokes so
it reads as a ridge → limbal ring, wide and soft then tight and dark →
pupil with its own soft edge → catchlights → corneal dome sweep → lid
shading and socket shadow → the blink lid.

**Behaviour:** gaze eases toward the pointer via `rAF` (never set directly),
idle micro-saccades after 2.2s of stillness, irregular blinks with a fast
close and slower open.

**It is a status display, not decoration.** `mood` drives iris colour, pupil
dilation and the ambient glow together:

| Mood | Reads as |
|---|---|
| `idle` | periwinkle, relaxed |
| `scanning` | brighter, pupil dilates, ring sweeps |
| `granted` | green, pupil relaxes |
| `denied` | rose, pupil contracts |
| `asleep` | grey, dim — no camera, or a service fault |

`level` (0–1) fills a ring around the iris: the confidence figure, drawn on
the eye itself.

**Determinism:** `FIBRES` is generated once at module load from a fixed seed
with coordinates rounded to 2dp. Raw floats or `Math.random()` here produce
a hydration mismatch on all 118 lines.

## Components — `app/components/ui.tsx`

`Button` / `ButtonLink` (`primary` `soft` `ghost` `danger` × `sm` `md` `lg`),
`Card`, `Chip`, `Dot`, `Field`, `Sheet`, `Header`, `Mark`, `ClientOnly`, and
the icon set.

Icons are authored SVG on one 24 grid at stroke 1.75 with round caps and
joins, matching the shape language. No unicode glyphs or emoji stand in for
an icon anywhere.

`Sheet` is the only modal: rounded-top on phones, fully rounded on desktop,
with real dialog semantics — labelled, `aria-modal`, Escape closes, focus
enters on open and returns to the trigger on close, Tab trapped inside.

## Browser surfaces

Themed, not defaulted: selection (`--accent-deep`), caret (`--accent`),
scrollbars (thin, pill, transparent track), focus ring (`--accent` at 2px
with 3px offset), underline offset, and tabular figures via `.num`.

## Blur

`backdrop-filter` appears in exactly two places — the sticky `Header` and the
`Sheet` backdrop — where content genuinely scrolls beneath. It is not a
decorative material.

## Known open items

- `/dashboard` and `/admin` have no auth guard; both fetch unauthenticated.
  A product gap, not a design one, but no future design should imply
  otherwise.
- The active/inactive toggle was removed from the person detail because it
  never persisted to the backend. Wire it before re-adding it.
- `location` is hardcoded `"Front Door"` server-side and shown as fact.
