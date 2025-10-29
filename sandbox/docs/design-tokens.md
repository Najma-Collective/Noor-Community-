# Sandbox design token audit

The sandbox deck styles are split across two layers:

- `sandbox-theme.css` defines the core palette, typography, spacing and layout primitives.
- `sandbox-css.css` consumes those primitives for slide scaffolds, utilities and activity widgets.

This audit lists the source tokens, how they are consumed, and the few vetted exceptions that remain after the refactor.

## Core primitives (`sandbox-theme.css`)

| Category | Tokens | Notes |
| --- | --- | --- |
| Typography | `--font-display`, `--font-body`, `--font-accent`, ramp tokens `--step--2` → `--step-3`, and line-height controls `--body-line-height`, `--heading-line-height`. | All deck text uses the ramp; builder widgets reuse the same steps for consistency. |
| Spacing | `--space-0` → `--space-8`, plus radius scale `--radius-sm` → `--radius-xl`. | Layout helpers in `sandbox-css.css` only reference the spacing/radius scale or derived clamps such as `--stack-gap-*`. |
| Palette | Forest/sage core (`--primary-forest`, `--primary-sage`, etc.), extended semantic sets (`--status-*`, `--info-*`, `--accent-*`), overlay neutrals (`--soft-white`, `--warm-white-*`, `--cool-white-*`, `--warm-blush-*`, `--overlay-forest-*`). | Every solid colour in `sandbox-css.css` now resolves to one of these tokens. |
| Surface & elevation | `--surface-base`, `--surface-card`, `--surface-muted`, `--surface-overlay-{light|strong}`, `--shadow-0` → `--shadow-3`, `--shadow-glow`, gradients `--gradient-sand`, `--gradient-forest`, `--gradient-amber-sky`. | Decks stay inside the shared surface stack; gradients now pull from named tokens instead of literal hex stops. |
| Layout system | `--toolbar-h`, `--workspace-pad`, `--stage-pad`, `--stage-radius`, `--slide-stack-gap`, `--stack-gap-tight`, `--stack-gap-roomy`. | Slide wrappers in `sandbox-css.css` consume these via `var(--stack-gap)` overrides. |

## Applied primitives (`sandbox-css.css`)

Key layout utilities now reference tokens directly:

- Stack/grid helpers: `--stack-gap`, `--grid-gap`, `--content-max-width`, `--card-max-width`, and the list/grid clamps default to the spacing scale (`--space-*`).
- Typography helpers (`.text-step-*`, `.deck-subtitle`, instruction lists) map straight to `--step-*` ramp tokens.
- Colour application uses the semantic sets from `sandbox-theme.css`, including the new status/overlay aliases (`--status-warning-strong`, `--info-sky-dark`, `--accent-clay-strong`, etc.).

Inline overrides for interactive widgets (textbox, table, mind-map, matching activities) are now driven from the semantic palette tokens rather than literal hex codes. When a light-on-dark variant is needed (e.g., `.textbox[data-color="wheat"]`), the handles/toolbars reference the matching `--status-*` or `--warm-blush-*` token.

### Remaining exceptions

Some declarations still use raw numeric values:

1. **Alpha overlays for builder widgets.** Components such as `.textbox`, `.canvas-table`, `.blank-canvas`, and drag-drop affordances rely on `rgba()` blends (e.g., `rgba(248, 246, 240, 0.9)`) to express translucency during interactions. These align with the semantic colours but require channel-level control that CSS custom properties cannot currently express without dramatically increasing the token surface. Documented usage lives between lines 3660–3955 in `sandbox-css.css` and will remain until a future refactor introduces shared opacity tokens.
2. **Legacy rhythm helpers.** A small number of clamps still contain literal `rem` breakpoints (for example, the upper bounds in list/card clamps around lines 983, 1490, and 3530). They are recorded for follow-up so we can move them into named tokens once the responsive scale is finalised.

No hard-coded hex values remain in the file.

## Guidance for contributors

- Use the semantic tokens from `sandbox-theme.css` when colouring UI elements. If you need a new semantic, add it to the palette and document the intent here before applying it.
- Pull spacing and sizing from the scale (`--space-*`, `--stack-gap-*`, `--grid-gap-*`). If a composition demands a new clamp, define it once in `:root` with a descriptive name rather than embedding literals inline.
- Typography should remain on the shared type ramp (`--step-*`) and inherit weights and tracking from the theme. When a new tracking behaviour is required, declare a token in `sandbox-theme.css`.

### Exception log

If you introduce a new literal value for colour/spacing/typography, record it here with rationale and the code reference. The current outstanding items are limited to the opacity-controlled overlays noted above.
