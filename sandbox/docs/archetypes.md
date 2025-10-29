# Sandbox archetype reference

The sandbox deck builder reads canonical archetype metadata from `sandbox/config/archetypes.json`, which defines schema constraints, layout identifiers, and visual guidance for each template.【F:sandbox/config/archetypes.json†L1-L133】 Preview thumbnails are rendered from lightweight markup in `sandbox/templates/archetypes.js` and surface inside the builder picker UI.【F:sandbox/templates/archetypes.js†L1-L85】 The live exemplars in `sandbox/exemplar-master.html` mirror these specifications so designers can inspect finished slides before applying them in a deck.【F:sandbox/exemplar-master.html†L1490-L1919】

## Shared design tokens

* **Typography:** Display and body typography resolve to `--font-display` and `--font-body`, backed by Questrial and Nunito families with a responsive modular scale (`--step--1` through `--step-3`).【F:sandbox/sandbox-theme.css†L1-L27】
* **Color & surfaces:** Archetype backgrounds, overlays, and card treatments reuse theme tokens such as `--primary-forest`, `--surface-card`, and overlay mixes defined in the sandbox theme.【F:sandbox/sandbox-theme.css†L47-L88】
* **Layout primitives:** Width and spacing constraints use `--content-max-width`, `--card-max-width`, and stack helpers from the sandbox CSS bundle, keeping archetype content aligned with the broader slide system.【F:sandbox/sandbox-css.css†L1-L118】
* **Icon defaults:** Layout-level badges and form placeholders fall back to `LAYOUT_ICON_DEFAULTS` and `LAYOUT_FIELD_ICON_DEFAULTS`, ensuring Font Awesome glyphs stay consistent across archetypes.【F:sandbox/slide-templates.js†L3-L56】

### Canonical archetype list

| Archetype ID | Layout | Default icon |
| --- | --- | --- |
| `hero-overlay-intro` | `topic-introduction` | `fa-solid fa-lightbulb` |
| `grounding-ritual` | `grounding-activity` | `fa-solid fa-leaf` |
| `lesson-aims` | `learning-objectives` | `fa-solid fa-bullseye` |
| `scenario-with-media` | `communicative-task` | `fa-solid fa-people-group` |
| `interactive-checkpoint` | `interactive-practice` | `fa-solid fa-puzzle-piece` |
| `task-report` | `task-reporting` | `fa-solid fa-bullhorn` |
| `reflection-321` | `reflection` | `fa-solid fa-moon` |
| `card-stack` | `card-stack` | `fa-solid fa-layer-group` |
| `pill-gallery` | `pill-with-gallery` | `fa-solid fa-images` |

The identifiers and layouts derive from the JSON config, while icon classes come from the slide template defaults.【F:sandbox/config/archetypes.json†L51-L305】【F:sandbox/slide-templates.js†L3-L13】

## Archetype catalog

### Hero overlay intro (`topic-introduction`)
* **Use case:** Opens a deck with a full-bleed hero image, foregrounding the hook and essential question to frame the session.【F:sandbox/config/archetypes.json†L51-L75】
* **Structure & rhythm:** Places an overlay card sized by `--content-max-width` on top of the hero background; it anchors left/top on wide screens and centers for narrow viewports.【F:sandbox/config/archetypes.json†L56-L59】【F:sandbox/sandbox-css.css†L1-L118】
* **Typography & color:** Leverages the theme display scale for headings, body copy at `--step-0`, and overlay surfaces tinted by `--surface-overlay-strong`/`--surface-overlay-light`.【F:sandbox/config/archetypes.json†L59-L66】【F:sandbox/sandbox-theme.css†L3-L78】
* **Icon slots:** Defaults to `fa-solid fa-lightbulb` for the layout badge and `fa-solid fa-compass` for the scenario pill; hook and vocabulary icons fall back via field defaults.【F:sandbox/config/archetypes.json†L68-L76】【F:sandbox/slide-templates.js†L21-L26】
* **Constraints:** Keep overlay copy under ~420 characters and choose imagery with focal points away from the card footprint.【F:sandbox/config/archetypes.json†L72-L75】
* **Preview & exemplar:** Preview snippet: `sandbox/templates/archetypes.js` → `ARCHETYPE_PREVIEW_MARKUP['hero-overlay-intro']`. Slide sample lives at lines 1490-1522 of `sandbox/exemplar-master.html`.【F:sandbox/templates/archetypes.js†L1-L12】【F:sandbox/exemplar-master.html†L1490-L1522】

### Grounding ritual (`grounding-activity`)
* **Use case:** Scripts mindful arrival routines with a numbered sequence of settling moves.【F:sandbox/config/archetypes.json†L79-L104】
* **Structure & rhythm:** Single-column stack placing the header above an ordered list of `.grounding-steps` badges to maintain breathing cadence.【F:sandbox/config/archetypes.json†L84-L94】
* **Typography & color:** Headings pull from the display scale while steps use body typography; badges lean on `--primary-forest` and card surfaces reuse muted tokens.【F:sandbox/config/archetypes.json†L87-L94】【F:sandbox/sandbox-theme.css†L47-L74】
* **Icon slots:** Layout badge uses `fa-solid fa-leaf` with numeric badges standing in for per-step icons.【F:sandbox/config/archetypes.json†L96-L104】
* **Constraints:** Limit to four or five steps and avoid busy imagery behind the card.【F:sandbox/config/archetypes.json†L100-L103】
* **Preview & exemplar:** Preview markup in `ARCHETYPE_PREVIEW_MARKUP['grounding-ritual']`; exemplar slide at lines 1524-1561 in the exemplar deck.【F:sandbox/templates/archetypes.js†L13-L22】【F:sandbox/exemplar-master.html†L1524-L1561】

### Lesson aims (`learning-objectives`)
* **Use case:** Highlights lesson outcomes alongside a communicative goal to ground performance expectations.【F:sandbox/config/archetypes.json†L107-L133】
* **Structure & rhythm:** Header plus `.lesson-goals` card arranged as icon/text pairs, constrained by `--content-max-width` for readability.【F:sandbox/config/archetypes.json†L113-L124】【F:sandbox/sandbox-css.css†L1-L118】
* **Typography & color:** Uses display scale for the heading and body typography for list items; icon circles pull from `--surface-muted` and `--primary-forest`.【F:sandbox/config/archetypes.json†L116-L122】【F:sandbox/sandbox-theme.css†L47-L74】
* **Icon slots:** Layout badge defaults to `fa-solid fa-bullseye`, while goal rows fall back to `fa-solid fa-crosshairs` unless overridden.【F:sandbox/config/archetypes.json†L124-L133】【F:sandbox/slide-templates.js†L17-L20】
* **Constraints:** Target three to four goals and keep the communicative paragraph under two sentences.【F:sandbox/config/archetypes.json†L128-L131】
* **Preview & exemplar:** Preview snippet entry `lesson-aims`; sample slide at lines 1563-1609 of the exemplar deck.【F:sandbox/templates/archetypes.js†L23-L32】【F:sandbox/exemplar-master.html†L1563-L1609】

### Scenario with media (`communicative-task`)
* **Use case:** Briefs learners on a real-world communicative task, pairing scenario context with preparation, performance, and scaffolding cues.【F:sandbox/config/archetypes.json†L135-L162】
* **Structure & rhythm:** Two-column pattern with a scenario card beside an instruction list; aligns with flex grid behavior to keep columns legible on wide stages.【F:sandbox/config/archetypes.json†L141-L149】
* **Typography & color:** Section headings use the display step, while body copy stays at `--step-0`. Instruction icons reuse Font Awesome defaults colored with `--primary-forest` over neutral cards.【F:sandbox/config/archetypes.json†L144-L150】【F:sandbox/sandbox-theme.css†L47-L74】
* **Icon slots:** Layout badge `fa-solid fa-people-group`; preparation and performance steps default to `fa-solid fa-list-check` and `fa-solid fa-people-arrows` respectively.【F:sandbox/config/archetypes.json†L152-L156】【F:sandbox/slide-templates.js†L30-L33】
* **Constraints:** Scenario callout should stay short (~120 characters) and optional imagery works best at 4:3.【F:sandbox/config/archetypes.json†L157-L160】
* **Preview & exemplar:** Preview markup `scenario-with-media`; exemplar slide at lines 1611-1658 in the deck.【F:sandbox/templates/archetypes.js†L33-L37】【F:sandbox/exemplar-master.html†L1611-L1658】

### Interactive checkpoint (`interactive-practice`)
* **Use case:** Provides a quick formative check with ordered prompts and space for an embedded module host (e.g., H5P).【F:sandbox/config/archetypes.json†L164-L190】
* **Structure & rhythm:** Header plus `.practice-body` grouping instructions, questions, and the module host; questions render as an ordered list for scanning.【F:sandbox/config/archetypes.json†L170-L176】
* **Typography & color:** Heading uses the display scale, prompts follow body text, and the module host features dashed borders leveraging theme tokens such as `--hover-sage`.【F:sandbox/config/archetypes.json†L173-L178】【F:sandbox/sandbox-theme.css†L61-L76】
* **Icon slots:** Layout badge defaults to `fa-solid fa-puzzle-piece`; question/answer icons inherit from the practice icon defaults when populated via the builder.【F:sandbox/config/archetypes.json†L182-L189】【F:sandbox/slide-templates.js†L35-L38】
* **Constraints:** Reserve space for a single embed and cap prompts around five items to avoid scrolling.【F:sandbox/config/archetypes.json†L185-L188】
* **Preview & exemplar:** Preview entry `interactive-checkpoint`; exemplar slide sits at lines 1661-1713 of the deck.【F:sandbox/templates/archetypes.js†L39-L47】【F:sandbox/exemplar-master.html†L1661-L1713】

### Task report board (`task-reporting`)
* **Use case:** Guides whole-class share-outs by balancing speaker prompts, listener roles, and evidence capture checklists.【F:sandbox/config/archetypes.json†L192-L219】
* **Structure & rhythm:** Two responsive columns—report prompts and listener roles—with optional evidence lists stacked below.【F:sandbox/config/archetypes.json†L198-L206】
* **Typography & color:** Subheadings use the display scale while lists remain at body size; dividers and badges pull from `--border-soft` and other neutral tokens.【F:sandbox/config/archetypes.json†L201-L206】【F:sandbox/sandbox-theme.css†L61-L82】
* **Icon slots:** Layout badge `fa-solid fa-bullhorn` with supporting glyphs for reporter/listener cues (`fa-solid fa-users`, `fa-solid fa-ear-listen`).【F:sandbox/config/archetypes.json†L209-L218】【F:sandbox/slide-templates.js†L39-L44】
* **Constraints:** Limit presenter bullets to three and keep listener prompts concise (<160 characters).【F:sandbox/config/archetypes.json†L214-L217】
* **Preview & exemplar:** Preview key `task-report`; exemplar slide at lines 1715-1769 of the deck.【F:sandbox/templates/archetypes.js†L49-L53】【F:sandbox/exemplar-master.html†L1715-L1769】

### 3-2-1 reflection (`reflection`)
* **Use case:** Captures quick close-out prompts for synchronous or asynchronous journaling.【F:sandbox/config/archetypes.json†L221-L247】
* **Structure & rhythm:** Single card with `.reflection-prompts` stacked for easy scanning and centered alignment.【F:sandbox/config/archetypes.json†L227-L229】
* **Typography & color:** Headings use the display scale and prompts lean on body copy; emphasis numerals adopt `--primary-forest` over `--surface-card` with `--shadow-1` for depth.【F:sandbox/config/archetypes.json†L230-L235】【F:sandbox/sandbox-theme.css†L47-L88】
* **Icon slots:** Layout badge falls back to `fa-solid fa-moon`, while numeral styling doubles as implicit iconography.【F:sandbox/config/archetypes.json†L239-L241】【F:sandbox/slide-templates.js†L45-L47】
* **Constraints:** Maintain the 3-2-1 block rhythm and pair with journaling instructions when used asynchronously.【F:sandbox/config/archetypes.json†L243-L245】
* **Preview & exemplar:** Preview identifier `reflection-321`; exemplar slide located at lines 1771-1793 in the deck.【F:sandbox/templates/archetypes.js†L55-L63】【F:sandbox/exemplar-master.html†L1771-L1793】

### Card stack sprint (`card-stack`)
* **Use case:** Maps multi-stage workflows with a pill headline above three stacked cards.【F:sandbox/config/archetypes.json†L249-L276】
* **Structure & rhythm:** Stack layout (`.card-stack-list`) uses flex spacing to keep cards readable while respecting `--card-max-width`.【F:sandbox/config/archetypes.json†L255-L264】【F:sandbox/sandbox-css.css†L1-L118】
* **Typography & color:** Card headings use the display step and body copy stays at `--step-0`; pill and icons reuse accent palette values from the theme.【F:sandbox/config/archetypes.json†L258-L264】【F:sandbox/sandbox-theme.css†L47-L74】
* **Icon slots:** Layout badge `fa-solid fa-layer-group`, pill icon `fa-solid fa-bookmark`, and per-card icons default to `fa-solid fa-circle-dot`.【F:sandbox/config/archetypes.json†L266-L270】【F:sandbox/slide-templates.js†L48-L51】
* **Constraints:** Keep stacks to three or four cards and write concise, verb-led headings (≈32 characters).【F:sandbox/config/archetypes.json†L271-L274】
* **Preview & exemplar:** Preview entry `card-stack`; exemplar slide at lines 1795-1849 of the deck.【F:sandbox/templates/archetypes.js†L65-L73】【F:sandbox/exemplar-master.html†L1795-L1849】

### Pill gallery showcase (`pill-with-gallery`)
* **Use case:** Combines a scenario pill with responsive gallery tiles and captions for quick evidence scans.【F:sandbox/config/archetypes.json†L278-L305】
* **Structure & rhythm:** Header stack plus `.pill-gallery-grid` auto-fitting figures to available width while keeping captions left-aligned.【F:sandbox/config/archetypes.json†L284-L286】
* **Typography & color:** Captions use the reduced body step (`--step--1`) while the lead paragraph stays at `--step-0`; pill and frames reuse accent tokens (`--surface-card`, `--border-sage`).【F:sandbox/config/archetypes.json†L287-L293】【F:sandbox/sandbox-theme.css†L61-L76】
* **Icon slots:** Layout badge `fa-solid fa-images`, pill icon `fa-solid fa-camera-retro`, and gallery items default to `fa-solid fa-image`.【F:sandbox/config/archetypes.json†L295-L299】【F:sandbox/slide-templates.js†L52-L55】
* **Constraints:** Supply 3-4 images at 4:3 or 1:1 ratios and keep captions under 120 characters with alt text.【F:sandbox/config/archetypes.json†L301-L303】
* **Preview & exemplar:** Preview mapping `pill-gallery`; exemplar slide recorded at lines 1851-1919 of the deck.【F:sandbox/templates/archetypes.js†L75-L83】【F:sandbox/exemplar-master.html†L1851-L1919】

## Working with archetypes

* **Builder defaults:** `sandbox/slide-templates.js` exposes factories that hydrate the builder form with sample copy, media, and icon placeholders for each archetype, ensuring consistent starting points.【F:sandbox/slide-templates.js†L294-L340】
* **Applying archetypes:** In the activity builder, selecting an archetype applies the matching layout, loads these defaults, and keeps icon placeholders aligned with the definitions above.【F:sandbox/int-mod.js†L7630-L7793】

Use this reference to cross-check grid, typography, and icon decisions when expanding the archetype library or designing new slides.
