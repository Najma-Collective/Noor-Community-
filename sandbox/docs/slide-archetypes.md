# Slide Archetypes Reference

This document inventories recurring slide components across the A1–C1 reference decks and maps them to the design tokens exported by `sandbox-theme.css`. Use it as a contract when building or refactoring slides so that the shared archetypes stay visually consistent. The canonical list of available primitives lives in [`design-tokens.md`](./design-tokens.md).

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
  - Colour & elevation: background glass uses `--surface-overlay-strong` (or `.is-light` + `--surface-overlay-light`), borders rely on `--border-soft`, type keeps contrast with `--soft-white` / `--warm-white-100`, and shadows elevate via `--shadow-3` (dark) or `--shadow-2` (light). Overlay pills invert using `--warm-white-100` with icon colour from `--primary-sage` unless `--status-warning-strong` is applied for emphasis.【F:sandbox/sandbox-theme.css†L64-L114】【F:sandbox/sandbox-css.css†L1725-L1798】
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
  - Cards inherit `--surface-card`, `--border-soft`, `--radius`, and `--shadow-1`; `card.dense` compresses padding via spacing clamps; `card.transparent` raises elevation with `--shadow-2` for on-photo placement. Status annotations inside the cards draw from the semantic palette (`--status-success`, `--status-warning-strong`, `--status-error`).【F:sandbox/sandbox-theme.css†L64-L114】【F:sandbox/sandbox-css.css†L1853-L1879】
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

## Centered callouts
- **Seen in:** C1/Getting to know you/getting-to-know-you-b.html (Slide 4) uses a centered prompt card to frame a language focus moment; B2/1/B2-1-1/B2-1-1-Strategic Planning.html (Slide 13) reuses the same centered stack for pronunciation reminders.【F:C1/Getting to know you/getting-to-know-you-b.html†L723-L731】【F:B2/1/B2-1-1/B2-1-1-Strategic Planning.html†L891-L896】
- **Structure:**
  ```html
  <div class="slide-inner centered-text">
    <span class="pill">Topic</span>
    <div class="prompt-card">
      <h2>Headline</h2>
      <p>Supporting reminder or challenge.</p>
    </div>
  </div>
  ```
- **Tokens:**
  - Centered stacks inherit the display/body ramps from the design tokens (`--font-display`, `--step-2`) and rely on the global spacing scale to keep the prompt card breathing room consistent.【F:sandbox/sandbox-theme.css†L1-L73】
  - `.prompt-card` borrows the neutral card palette and radius so that the centered slide still reads as part of the core surface system.【F:C1/Getting to know you/getting-to-know-you-b.html†L725-L731】
- **Modifiers:**
  - Pair with `.pill` chips for quick context labels and constrain prose with inline width utilities (e.g., `max-width: 70%`) when you want tighter focus.【F:B2/1/B2-1-1/B2-1-1-Strategic Planning.html†L891-L896】

## Dialogue spotlights
- **Seen in:** B2/1/B2-1-4/B2-1-4-b.html (Slides 6–8) use `.dialogue-box` cards inside grids for model conversations; B2/1/B2-1-3/B2-1-3-b.html (Slide 7) collapses to a single centered box for a scenario question.【F:B2/1/B2-1-4/B2-1-4-b.html†L2136-L2147】【F:B2/1/B2-1-3/B2-1-3-b.html†L208-L216】
- **Structure:**
  ```html
  <div class="grid-container">
    <div class="dialogue-box">
      <h3>Prompt</h3>
      <p>Guided language or sample exchange.</p>
    </div>
    <!-- repeat for multi-column grids -->
  </div>
  ```
- **Tokens:**
  - `.dialogue-box` inherits the base card radius and shadow while swapping to a cream fill for contrast; typography sits on the standard type scale so grids can mix narrative paragraphs and highlighted phrases. The highlighted speaker names use `--status-warning-strong` / `--status-warning-dark` to stay within the semantic range.【F:sandbox/sandbox-css.css†L1898-L1935】【F:B2/1/B2-1-4/B2-1-4-b.html†L2136-L2147】
  - Grid-driven variants lean on `.grid-container` / `.split-grid` helpers to stay responsive without redefining breakpoints.【F:sandbox/sandbox-css.css†L1898-L1935】【F:sandbox/sandbox-css.css†L2009-L2016】
- **Modifiers:**
  - Swap the grid container for a centered `.dialogue-box` when a single case study should dominate the slide; lists inside the box can reuse `.instruction-list` styling for step-by-step phrasing.【F:B2/1/B2-1-3/B2-1-3-b.html†L208-L216】

## Token bank sorting boards
- **Seen in:** C1/Getting to know you/getting-to-know-you-b.html (Slide 16) and C1/1/C1-1-2/C1-1-2.html (Slides 9 & 20) for categorisation and table-completion practice.【F:C1/Getting to know you/getting-to-know-you-b.html†L1000-L1026】【F:C1/1/C1-1-2/C1-1-2.html†L332-L361】
- **Structure:**
  ```html
  <div class="card" data-activity="categorization">
    <div class="token-bank">…</div>
    <div class="category-columns">
      <div class="category-column">
        <div class="drop-zone"></div>
      </div>
      …
    </div>
    <div class="activity-actions">
      <button class="activity-btn" data-action="check">Check</button>
      <button class="activity-btn secondary" data-action="reset">Reset</button>
    </div>
    <div class="feedback-msg"></div>
  </div>
  ```
- **Tokens:**
  - `.token-bank`, `.click-token`, and `.category-column` draw from the same neutral palette and spacing scale as cards, adding dashed borders and chip styling to signal drag/drop affordances. Correct/incorrect states hook into `--status-success` / `--status-error` for feedback labels.【F:sandbox/sandbox-css.css†L2456-L2480】【F:sandbox/sandbox-css.css†L2748-L2765】
  - Action bars reuse the shared `.activity-actions` flex gap and `.activity-btn` button chroma (`--status-success`, `--status-error`, `--accent-amber`) so controls stay consistent across interactive slides.【F:sandbox/sandbox-css.css†L5743-L5750】
- **Modifiers:**
  - Attach `.feedback-msg` beneath the board for automated evaluation text and extend the pattern with `.table-completion-wrapper` when tokens should snap into table cells instead of columns.【F:sandbox/sandbox-css.css†L4363-L4376】【F:C1/1/C1-1-2/C1-1-2.html†L332-L361】

## Quiz feedback boards
- **Seen in:** C1/Getting to know you/getting-to-know-you-b.html (Slide 8) and C1/Getting to know you/Getting-to-know-you.html (Slides 7–14) for grammar polls and trivia checks.【F:C1/Getting to know you/getting-to-know-you-b.html†L807-L825】【F:C1/Getting to know you/Getting-to-know-you.html†L460-L534】
- **Structure:**
  ```html
  <div class="card">
    <div class="quiz-grid">
      <div class="quiz-card">
        <p>Prompt…</p>
        <select>…</select>
      </div>
      …
    </div>
    <p class="feedback-msg">Coach the class once answers are in.</p>
  </div>
  ```
- **Tokens:**
  - `.quiz-card` and `.quiz-clause-control` sit on the neutral card palette with rounded controls that reuse the `--radius` and `--shadow-1` elevation for tactile dropdowns.【F:sandbox/sandbox-css.css†L2296-L2344】
  - `.feedback-msg` provides a consistent place to surface success/error states or facilitator notes, with weight/colour tokens tuned for clarity.【F:sandbox/sandbox-css.css†L4363-L4376】
- **Modifiers:**
  - Combine with the token-bank pattern when answer options should be dragged rather than selected; the JSON index flags this union as `interactive.token-quiz` for automation.【F:sandbox/docs/slide-archetypes.json†L213-L241】

## Activity action cards
- **Seen in:** C1/Getting to know you/getting-to-know-you-b.html (Slides 9 & 10) and B2/Getting to know you/Getting-to-know-you.html (Slides 2–5) where instructions, editable grids, and facilitator tips share a single surface.【F:C1/Getting to know you/getting-to-know-you-b.html†L862-L895】【F:B2/Getting to know you/Getting-to-know-you.html†L345-L368】
- **Structure:**
  ```html
  <div class="card transparent">
    <span class="pill">Activity label</span>
    <h2>Task headline</h2>
    <ul class="instruction-list">…</ul>
    <div class="split-grid">…</div>
    <div class="activity-actions">
      <button class="activity-btn">Check</button>
      <button class="activity-btn secondary">Reset</button>
    </div>
  </div>
  ```
- **Tokens:**
  - `.card` and `.split-grid` reuse the shared radius/spacing tokens to host editable “workspace” elements alongside instructions.【F:sandbox/sandbox-css.css†L1898-L1935】【F:sandbox/sandbox-css.css†L2009-L2016】
  - `.activity-actions` / `.activity-btn` align with the interactive control palette so every task provides the same affordances for checking work.【F:sandbox/sandbox-css.css†L5743-L5750】
- **Modifiers:**
  - Switch the base card to `.transparent` when stacking atop photography and use `.feedback-msg` below the action bar for just-in-time coaching.【F:sandbox/sandbox-css.css†L1920-L1924】【F:sandbox/sandbox-css.css†L4363-L4376】

## Legacy content wrappers
- **Seen in:** C1/Getting to know you/Getting-to-know-you.html (Slides 1–5) which lean on the legacy `.content-wrapper` shell to separate headers, bodies, and footers inside the slide canvas.【F:C1/Getting to know you/Getting-to-know-you.html†L119-L167】【F:C1/Getting to know you/Getting-to-know-you.html†L344-L368】
- **Structure:**
  ```html
  <div class="content-wrapper">
    <div class="content-header">…</div>
    <div class="content-body">…</div>
    <div class="content-footer">…</div>
  </div>
  ```
- **Tokens:**
  - The wrapper honours the same spacing variables defined in the theme (`--space-4`, `--space-5`) so the header/body/footer rhythm matches newer components even without the modern card helpers.【F:sandbox/sandbox-theme.css†L24-L57】【F:C1/Getting to know you/Getting-to-know-you.html†L119-L167】
- **Modifiers:**
  - Apply grid utilities such as `.icon-choice-grid` inside the body to modernise legacy slides while keeping the container contract stable for backwards compatibility.【F:C1/Getting to know you/Getting-to-know-you.html†L349-L366】

### Implementation checklist
1. Import `sandbox-theme.css` + `sandbox-css.css` so the variables and base classes resolve consistently across decks.
2. Compose slides from these archetypes before adding bespoke styling; extend with modifier classes rather than duplicating base rules.
3. When introducing a new variant, map it back to existing tokens (type ramp, spacing, palette, elevation) to maintain consistency.
