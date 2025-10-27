# Slide Archetypes Reference

This document inventories recurring slide components across the A1–C1 reference decks and maps them to the design tokens exported by `sandbox-theme.css`. Use it as a contract when building or refactoring slides so that the shared archetypes stay visually consistent.

## Hero overlay slides
- **Seen in:** A1/1/A1-1-2/A1-1-2-b.html (Slides 1–2), B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html (Slides 1–2), C1/1/C1-1-1/C1-1-1.html (title slides).
- **Structure:**
  ```html
  <div class="slide-stage full-width-bg">
    <div class="bg-media"><img ... /></div>
    <div class="img-overlay overlay-dark"></div>
    <div class="slide-inner is-centered">
      <div class="bg-content centered|overlay-align-right|overlay-align-left">
        <div class="overlay-card [centered] [is-light]">
          <span class="pill overlay-pill">…</span>
          <h1|h2>…</h1|h2>
          <p class="deck-subtitle">…</p>
          <p class="overlay-instructions">…</p>
        </div>
      </div>
    </div>
  </div>
  ```
- **Tokens:**
  - Typography: headings use `--font-display` with steps `--step-3`/`--step-2`; subtitles inherit `--step-1`; overlay instructions track `--step-1` emphasised weights.【F:sandbox/sandbox-theme.css†L3-L27】【F:sandbox/sandbox-css.css†L1801-L1839】
  - Spacing & radius: overlay cards pad via `clamp` values matching the spacing scale (`--space-4` – `--space-7`) and round with `--radius-lg`; pill chips respect the `--pill-*` sizing vars.【F:sandbox/sandbox-theme.css†L29-L44】【F:sandbox/sandbox-css.css†L1755-L1787】
  - Colour & elevation: background glass uses `--surface-overlay-strong` (or `.is-light` + `--surface-overlay-light`), borders rely on `--border-soft`, type keeps contrast against `--soft-white`, and shadows elevate via `--shadow-3` (dark) or `--shadow-2` (light). Overlay pills invert using `#fdfbf5` and icon colour from `--primary-sage` when not inverted.【F:sandbox/sandbox-theme.css†L64-L89】【F:sandbox/sandbox-css.css†L1725-L1765】【F:sandbox/sandbox-css.css†L1790-L1798】
- **Modifiers:**
  - `.overlay-card.centered` centers content; `.bg-content.overlay-align-{left|right}` realigns without changing the internal stack.【F:sandbox/sandbox-css.css†L1734-L1744】
  - `.overlay-card.is-light` swaps to the light overlay palette; `.overlay-pill` enforces translucent pills on glass backgrounds.【F:sandbox/sandbox-css.css†L1720-L1765】

## Pill-forward cards
- **Seen in:** A1/1/A1-1-2/A1-1-2-b.html (Lesson aims), B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html (agenda slides), C1/1/C1-1-1/C1-1-1.html (stage labels).
- **Structure:**
  ```html
  <div class="slide-inner">
    <span class="pill [overlay-pill]">…</span>
    <h2>Section title</h2>
    <div class="card [dense|transparent]">
      <!-- content: paragraphs, instruction lists, grids -->
    </div>
  </div>
  ```
- **Tokens:**
  - Pills use the shared chip primitives (`--pill-min-width`, `--pill-gap`, `--primary-sage`, `--deep-forest`, `--shadow-0`). Overlay variants add translucency via `.overlay-pill` when rendered atop photography.【F:sandbox/sandbox-css.css†L1767-L1798】
  - Cards inherit `--surface-card`, `--border-soft`, `--radius`, and `--shadow-1`; `card.dense` compresses padding via spacing clamps; `card.transparent` raises elevation with `--shadow-2` for on-photo placement.【F:sandbox/sandbox-theme.css†L64-L89】【F:sandbox/sandbox-css.css†L1853-L1879】
- **Modifiers:**
  - `card.dense` for tighter agendas or checklists; `card.transparent` for overlaying on imagery; `column-card` when a pill card needs neutral background in multi-column grids.【F:sandbox/sandbox-css.css†L1869-L1886】

## Instruction lists
- **Seen in:** A1/1/A1-1-2/A1-1-2-b.html (grounding + aims), B1/1/B1-1-1/B1-1-1-b.html (task steps), B2/1/B2-1-1/B2-1-1-b.html (activity prep), C1/1/C1-1-1/C1-1-1.html (discussion prompts).
- **Structure:**
  ```html
  <ul class="instruction-list [stack-sm] [text-step-1] [list-grid] [editable-text]">
    <li>
      <i class="fa-solid fa-icon"></i>
      <div>Step description</div>
    </li>
    …
  </ul>
  ```
- **Tokens:**
  - Grid gap aligns with the list scale (`--space-3`/`--space-4`), icon colour with `--primary-sage`, and body copy at `--step-0`. The optional `.text-step-1` upsizing mirrors heading hierarchy from the type ramp.【F:sandbox/sandbox-theme.css†L29-L59】【F:sandbox/sandbox-css.css†L1918-L1934】
  - When embedded in cards the parent uses `--stack-gap` so lists stay spaced consistently within the slide stack.【F:sandbox/sandbox-css.css†L1853-L1864】
- **Modifiers:**
  - `.list-grid` converts the list into responsive columns (auto-fit ≥220 px) for inventories; `.stack-sm` tightens vertical rhythm for dense instructions; `.editable-text` flags copy for builder UIs without altering layout.【F:A1/1/A1-1-2/A1-1-2-b.html†L270-L297】【F:A1/1/A1-1-2/A1-1-2-b.html†L25-L38】
  - Contextual classes such as `.aims-list` only swap icons but rely on the same base spacing/typography tokens.【F:A1/1/A1-1-2/A1-1-2-b.html†L295-L316】

## Grid layouts
- **Seen in:** C1/1/C1-1-1/C1-1-1.html (two-column cards + media), B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html (three-column agenda, definition grids), A1/1/A1-1-2/A1-1-2-b.html (`.grid-two`, `.id-card-grid`).
- **Structure:**
  ```html
  <div class="two-column-grid [grid-gap-sm|grid-gap-lg]">
    <div class="card|column-card">…</div>
    <div class="context-image|card">…</div>
  </div>
  ```
- **Tokens:**
  - `two-column-grid` and related helpers pull `--grid-gap-default` from the layout root (`clamp(var(--space-5), 3vw, var(--space-7))`), inheriting the spacing scale. Column cards use `--surface-muted` and `--border-soft` to contrast adjacent imagery.【F:sandbox/sandbox-css.css†L1892-L1909】【F:sandbox/sandbox-theme.css†L29-L89】【F:C1/1/C1-1-1/C1-1-1.html†L167-L207】
  - Custom grids in decks (`.grid-two`, `.list-grid`, `.id-card-grid`) mirror the same minmax pattern (≥220 px) and re-use `--radius` and `--shadow-1` to maintain card affordances.【F:A1/1/A1-1-2/A1-1-2-b.html†L25-L70】
- **Modifiers:**
  - `.grid-gap-{sm|md|lg}` override the default clamp for looser or tighter compositions; nested cards can opt into `.column-card.is-flat` to remove shadows when multiple surfaces sit together.【F:sandbox/sandbox-css.css†L69-L90】【F:sandbox/sandbox-css.css†L1881-L1889】

## Reflection boards
- **Seen in:** B2/1/B2-1-2/B2-1-2.html (Slide 19) and parallel closing slides in B2/C1 decks.
- **Structure:**
  ```html
  <div class="card reflection-board">
    <p>Framing instruction…</p>
    <ul class="reflection-list">
      <li><strong>What?</strong> Prompt…</li>
      <li><strong>So What?</strong> Prompt…</li>
      <li><strong>Now What?</strong> Prompt…</li>
    </ul>
  </div>
  ```
- **Tokens:**
  - Reuses the base card elevation (`--surface-card`, `--border-soft`, `--shadow-1`) while the list items reinforce rounded corners with `--radius` and neutral fills sampled from `--surface-base` mix; spacing matches the mid-scale (≈`--space-4`).【F:sandbox/sandbox-theme.css†L29-L89】【F:B2/1/B2-1-2/B2-1-2.html†L678-L692】【F:B2/1/B2-1-2/B2-1-2.html†L1313-L1321】
- **Modifiers:**
  - Keep prompts in a simple vertical stack; if a lighter background is required atop photography, pair the card with `.transparent` and adjust list backgrounds to use `--surface-overlay-light` for sufficient contrast.

### Implementation checklist
1. Import `sandbox-theme.css` + `sandbox-css.css` so the variables and base classes resolve consistently across decks.
2. Compose slides from these archetypes before adding bespoke styling; extend with modifier classes rather than duplicating base rules.
3. When introducing a new variant, map it back to existing tokens (type ramp, spacing, palette, elevation) to maintain consistency.
