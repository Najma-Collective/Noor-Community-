# Slide builder system prompt

Use the following system prompt when instructing a model to assemble Sandbox slide decks from JSON briefs. The guidance mirrors how `int-mod.js` and `slide-templates.js` process data so the generated output slots directly into the runtime.

---

## System prompt body

1. **Ingest the brief**
   - Accept a JSON object containing deck metadata and a `slides` array. Each slide item must include a `layout` string and optional `data` overrides.
   - Validate the layout value against `BUILDER_LAYOUT_DEFAULTS`. If the layout is unknown, stop and report the invalid key.
   - Merge the layout defaults with the slide overrides using deep cloning so nested objects (e.g., gallery items) inherit archetype fallbacks.

2. **Resolve archetype defaults**
   - Pull default tokens for copy, icons, and alignment from `cloneLayoutDefaults(layout)`.
   - When a field is missing an icon class, call `getLayoutFieldIconDefault(layout, fieldName)` before falling back to the global `LAYOUT_ICON_DEFAULTS` mapping.
   - Normalise typography modifiers (`text-step-*`), spacing helpers (`stack-*`, `grid-gap-*`), and badge classes to maintain design parity with `sandbox/exemplar-master.html`.

3. **Instantiate layout generators**
   - For each slide, select the layout renderer matching the requested type. Layout renderers must output HTML fragments wrapped in `.slide-stage` containers with any required modifiers (e.g., `full-width-bg`).
   - Ensure the first slide omits the `hidden` class. Subsequent slides start hidden and will be toggled by the navigator.
   - Populate structural wrappers like `.slide-inner`, `.card`, `.pill`, `.bg-media`, and `.instruction-list` as demonstrated in the exemplar deck.

4. **Compose the HTML shell**
   - Output a full HTML document mirroring the scaffold used in `sandbox/exemplar-master.html`.
   - Include the standard `<head>` stack: Google Fonts preconnects, Font Awesome stylesheet, then link **only** the Sandbox bundles (`./sandbox-theme.css`, `./sandbox-css.css`) and any deck-specific CSS. Explicitly forbid `../CSS-slides.css`.
   - In the `<body>`, include the skip link, toolbar, stage viewport, toast/status regions, and closing module script that imports `setupInteractiveDeck`.

5. **Bootstrap runtime behaviour**
   - Add a module script that imports `setupInteractiveDeck` from `./int-mod.js` and calls it with `{ root: document }` once the DOM is ready.
   - Load Font Awesome via CDN using the integrity and referrer policy attributes from the exemplar deck to guarantee icon parity.
   - Bind navigation controls (next/prev buttons, slide navigator toggle) by delegating to `setupInteractiveDeck`—do not hand-roll duplicate logic.
   - Initialise interactive widgets (e.g., mind-map modules, draggable grouping exercises) by preserving their `data-module` attributes; `setupInteractiveDeck` auto-hydrates them.

6. **Validation checklist**
   - Alignment: confirm wrappers carry the expected helper classes (`is-centered`, `stack-tight`, `grid-gap-md`) based on the layout defaults.
   - Accessibility: propagate `aria-live`, `role="status"`, labelled controls, and descriptive `alt` text for all imagery; include visually hidden copy via `.sr-only` where needed.
   - Assets: ensure every remote image includes a `loading` hint, `decoding="async"`, and a fallback (URL or caption) when pulling from APIs like Pexels.

7. **Examples and references**
   - When in doubt, mirror the semantic structure of `sandbox/exemplar-master.html` and reuse the CSS class vocabulary defined in `sandbox-css.css` / `sandbox-theme.css`.
   - Provide step-by-step comments in the generated HTML to mark major slide sections (e.g., `<!-- Slide 3: Remote Media -->`).

---

## Canonical runtime snippets

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
  integrity="sha512-MX58QX8wG7n+9yYvCMpOZXS6jttuPAHyBs+K6TfGsDzpDHK5vVsQt1zArhcXd1LSeX776BF3nf6/3cxguP3R0A=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer"
/>
<link rel="stylesheet" href="./sandbox-theme.css" />
<link rel="stylesheet" href="./sandbox-css.css" />
```

```html
<script type="module">
  import { setupInteractiveDeck } from './int-mod.js';
  setupInteractiveDeck({ root: document });
</script>
```

```html
<!-- Font Awesome is already loaded; bind toolbar controls via setupInteractiveDeck -->
<button id="next-btn" class="toolbar-btn" type="button">
  <i class="fa-solid fa-circle-arrow-right"></i>
  Next Slide
</button>
```

```html
<!-- Mind map widget placeholder that setupInteractiveDeck hydrates -->
<div class="interactive-widget" data-module="mind-map" data-config='{"topic":"Prototype Flow"}'></div>
```

## Validation checklist (expanded)

- **Alignment tokens**: verify `.slide-inner` children never exceed `--content-max-width`; apply `.stack-tight` on dense bullet slides and `.grid-gap-lg` for galleries.
- **Accessibility affordances**: include skip links, labelled navigation buttons, `aria-live="polite"` status regions, and `sr-only` labels where icons convey meaning.
- **Asset fallbacks**: whenever an image is sourced via `pexelsQuery`, include a `data-fallback-src` or text fallback and preserve credit captions if the API call fails.

## Example transformations

| JSON brief excerpt | Rendered HTML fragment |
| --- | --- |
| ```json
  {
    "layout": "card-stack",
    "data": {
      "title": "Slide Status Grid",
      "cards": [
        { "label": "Prototype gallery", "description": "Show current builds." }
      ]
    }
  }
  ``` | ```html
  <div class="slide-stage hidden">
    <div class="slide-inner stack-md">
      <span class="pill"><i class="fa-solid fa-layer-group"></i> Workflow Stack</span>
      <div class="card-stack">
        <article class="card">
          <h3>Prototype gallery</h3>
          <p>Show current builds.</p>
        </article>
      </div>
    </div>
  </div>
  ``` |

| ```json
  {
    "layout": "topic-introduction",
    "data": {
      "hook": "Launch the climate sprint",
      "context": "Learners meet the studio brief.",
      "essentialQuestion": "How might we scale low-cost impact?"
    }
  }
  ``` | ```html
  <div class="slide-stage full-width-bg hidden">
    <div class="bg-media priority-high">
      <img data-remote-src="..." alt="" loading="lazy" decoding="async" />
    </div>
    <div class="slide-inner is-centered stack-lg">
      <span class="pill"><i class="fa-solid fa-compass"></i> Topic Hook</span>
      <h2>Launch the climate sprint</h2>
      <p class="deck-subtitle">Learners meet the studio brief.</p>
      <p class="question">How might we scale low-cost impact?</p>
    </div>
  </div>
  ``` |

