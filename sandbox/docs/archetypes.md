# Lesson slide archetypes

This reference summarises the slide layouts available in the sandbox lesson builder. Each entry combines the structure rendered in `int-mod.js`, the form controls surfaced in the builder sections of `exemplar-master.html`, and any modifier controls from `slide-templates.js`. Background imagery and overlays for lesson slides are applied through `createBaseLessonSlide`, which injects CSS variables for `--lesson-bg-image`, `--lesson-overlay-color`, and `--lesson-overlay-opacity` whenever image or colour data is provided. These same helpers attach the layout icon badge to every slide stage, so the icon guidance below applies across layouts. 

> The previews below are lightweight 16:9 SVG schematics that mirror each layout’s structural regions for quick-loading documentation.
## Shared conventions

* **Base wrapper.** `createBaseLessonSlide` wraps each lesson slide in `.slide-stage.hidden.lesson-slide` with an inner `.lesson-slide-inner` specific to the layout. The helper automatically applies background image, overlay colour, and opacity tokens when present, and it adds `.lesson-slide--has-image` or `.lesson-slide--has-overlay` for styling hooks.
* **Layout badge.** The builder stores a `layoutIcon` on every slide record; when omitted, layouts listed in `LAYOUT_ICON_DEFAULTS` (blank canvas, card stack, and pill with gallery) fall back to the provided Font Awesome classes. All other layouts inherit whichever icon the author sets in the builder toolbar.
* **Overlay schema.** Builder fields labelled “Background image URL”, “Overlay colour”, and “Overlay opacity” map directly to the `imageUrl`, `overlayColor`, and `overlayOpacity` keys in `getBuilderFormState`. Supplying a colour plus an opacity above `0` activates the `.lesson-slide--has-overlay` style treatment.

## Layout index

- [Blank canvas](#blank-canvas-blank-canvas)
- [Learning objectives](#learning-objectives-learning-objectives)
- [Model dialogue](#model-dialogue-model-dialogue)
- [Interactive practice](#interactive-practice-interactive-practice)
- [Communicative task](#communicative-task-communicative-task)
- [Pronunciation focus](#pronunciation-focus-pronunciation-focus)
- [Reflection](#reflection-reflection)
- [Grounding activity](#grounding-activity-grounding-activity)
- [Topic introduction](#topic-introduction-topic-introduction)
- [Guided discovery](#guided-discovery-guided-discovery)
- [Creative practice](#creative-practice-creative-practice)
- [Task divider](#task-divider-task-divider)
- [Task reporting](#task-reporting-task-reporting)
- [Genre deconstruction](#genre-deconstruction-genre-deconstruction)
- [Linguistic feature hunt](#linguistic-feature-hunt-linguistic-feature-hunt)
- [Text reconstruction](#text-reconstruction-text-reconstruction)
- [Jumbled text sequencing](#jumbled-text-sequencing-jumbled-text-sequencing)
- [Scaffolded joint construction](#scaffolded-joint-construction-scaffolded-joint-construction)
- [Independent construction checklist](#independent-construction-checklist-independent-construction-checklist)
- [Card stack](#card-stack-card-stack)
- [Pill with gallery](#pill-with-gallery-pill-with-gallery)

---

### Blank canvas (`blank-canvas`)

**Visual structure.** Provides an empty `.blank-slide` workspace with a controls host and `.blank-canvas` region for free-form authoring. No lesson framing is added until authors layer content manually.

**Builder fields.** Layout selection only; the builder does not expose additional fields for this archetype.

**Icon hooks.** Defaults to `fa-solid fa-border-all` unless overridden in the layout picker.

**Alignment & spacing modifiers.**

- Stage alignment (`top`, `center`).
- Content alignment (`start`, `center`, `end`).

**Preview.** ![Provides an empty `.blank-slide` workspace with a controls host and `.blank-canvas` region for free-form authoring. No lesson framing is added until authors layer content manually.](./archetypes/preview-blank-canvas.svg)

---

### Learning objectives (`learning-objectives`)

**Visual structure.** A lesson header with the slide title and optional “So you can…” communicative goal line, followed by a `.lesson-goals-card` listing up to three goals with icon bullets. Placeholders prompt authors to add goals when fields are empty.

**Builder fields.**

- *Core inputs:* Slide title, Goal 1–3, Communicative goal text.
- *Optional enrichments:* Goal icon class, Communicative goal icon class (stored but currently unused in the renderer), Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** Goal bullets default to `fa-solid fa-bullseye` when no custom icon is supplied. The layout badge uses the selected `layoutIcon`.

**Preview.** ![A lesson header with the slide title and optional “So you can…” communicative goal line, followed by a `.lesson-goals-card` listing up to three goals with icon bullets. Placeholders prompt authors to add goals when fields are empty.](./archetypes/preview-learning-objectives.svg)

---

### Model dialogue (`model-dialogue`)

**Visual structure.** Header with title and optional student instructions, followed by `.lesson-dialogue` containing a dialogue column (speaker/line pairs) and an optional supporting image. An audio player renders beneath the body when an audio URL is provided.

**Builder fields.**

- *Core inputs:* Slide title, Student instructions, Dialogue turns (speaker + line pairs).
- *Optional enrichments:* Instructions icon class (retained for future styling), Image URL, Overlay colour, Overlay opacity, Audio URL.

**Icon hooks.** Currently renders text-only dialogue turns; icon fields are captured for future use. The layout badge displays the chosen icon.

**Preview.** ![Header with title and optional student instructions, followed by `.lesson-dialogue` containing a dialogue column (speaker/line pairs) and an optional supporting image. An audio player renders beneath the body when an audio URL is provided.](./archetypes/preview-model-dialogue.svg)

---

### Interactive practice (`interactive-practice`)

**Visual structure.** `.practice-header` with title and an activity type badge, `.practice-instructions` with either the prompt or a placeholder, an ordered list of `.practice-question` items (each may include options and an answer line), and a `.practice-module` region hosting interactive embeds with an “Add interactive module” button.

**Builder fields.**

- *Core inputs:* Slide title, Practice instructions, Activity type, Question prompts with optional options/answers.
- *Optional enrichments:* Instructions icon class, Activity type icon class (stored for badge styling), Interactive module configuration via the module overlay.
- *Module embed:* `moduleTemplate` selects a prebuilt iframe from `sandbox/Templates/`, while `moduleConfig`/`moduleHtml` can store a fully configured activity export. When omitted, the generator automatically maps `activityType` to the matching template file.

**Authoring notes.** Deck exports now persist module HTML alongside the JSON payload. Any generated slide includes the `<script type="application/json" class="module-embed-config">…</script>` block so downstream builders can reopen the activity without manually re-inserting the iframe.

**Icon hooks.** Layout badge uses the configured icon. The activity type badge text is derived from `activityType`; icon placeholders from the builder are saved but not yet rendered inline.

**Preview.** ![`.practice-header` with title and an activity type badge, `.practice-instructions` with either the prompt or a placeholder, an ordered list of `.practice-question` items (each may include options and an answer line), and a `.practice-module` region hosting interactive embeds with an “Add interactive module” button.](./archetypes/preview-interactive-practice.svg)

---

### Communicative task (`communicative-task`)

**Visual structure.** Header with title, optional scenario callout (extracted from the first line of preparation), and a `.task-body` containing an instruction card (Preparation and Performance steps with icons) plus a `.task-scaffolding` column listing language support items or a placeholder.

**Builder fields.**

- *Core inputs:* Slide title, Preparation text, Performance text.
- *Optional enrichments:* Scaffolding list (one per line), Preparation icon class, Performance icon class, Scaffolding icon class (stored for future use), Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** Preparation defaults to `fa-solid fa-list-check` and Performance to `fa-solid fa-people-group` when no icon classes are supplied. Stored scaffolding icons are not yet rendered.

**Preview.** ![Header with title, optional scenario callout (extracted from the first line of preparation), and a `.task-body` containing an instruction card (Preparation and Performance steps with icons) plus a `.task-scaffolding` column listing language support items or a placeholder.](./archetypes/preview-communicative-task.svg)

---

### Pronunciation focus (`pronunciation-focus`)

**Visual structure.** Header with title and target sound line, followed by a `.pronunciation-focus-card` that can show word chips, sentence examples, and a practice instruction block.

**Builder fields.**

- *Core inputs:* Slide title, Target sound/feature, Practice instructions.
- *Optional enrichments:* Example words (two fields), Example sentences (two fields), Icon classes for target, words, sentences, and practice (stored for future use), Image URL, Overlay colour, Overlay opacity.

**Icon hooks.** The renderer currently outputs plain text elements; icon classes are recorded for future styling while layout icons surface via the badge.

**Preview.** ![Header with title and target sound line, followed by a `.pronunciation-focus-card` that can show word chips, sentence examples, and a practice instruction block.](./archetypes/preview-pronunciation-focus.svg)

---

### Reflection (`reflection`)

**Visual structure.** Header plus a `.reflection-body` that renders a bulleted list of prompts or a placeholder when the list is empty.

**Builder fields.**

- *Core inputs:* Slide title, Prompts 1–3.
- *Optional enrichments:* Prompts icon class (stored for future use), Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** Prompts display as plain list items today; the stored icon field supports future custom bullets. Layout badge inherits the configured icon.

**Preview.** ![Header plus a `.reflection-body` that renders a bulleted list of prompts or a placeholder when the list is empty.](./archetypes/preview-reflection.svg)

---

### Grounding activity (`grounding-activity`)

**Visual structure.** Header with title and optional subtitle, followed by `.grounding-body` containing an ordered list of steps with numbered badges.

**Builder fields.**

- *Core inputs:* Slide title, Guided steps (one per line).
- *Optional enrichments:* Subtitle, Steps icon class (held for future styling), Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** Step numbering uses built-in badges; icon data is retained but not rendered yet. Layout badge applies the selected icon.

**Preview.** ![Header with title and optional subtitle, followed by `.grounding-body` containing an ordered list of steps with numbered badges.](./archetypes/preview-grounding-activity.svg)

---

### Topic introduction (`topic-introduction`)

**Visual structure.** Header with title and optional hook, `.topic-body` paragraphs for context and an “Essential question” card, plus a vocabulary section listing key terms or a placeholder.

**Builder fields.**

- *Core inputs:* Slide title, Hook/opener, Context, Essential question, Key vocabulary (one per line).
- *Optional enrichments:* Icon classes for hook, context, essential question, and vocabulary (stored), Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** Text sections render without icons; builder icon fields are stored for later theming. Layout badge uses the configured icon.

**Preview.** ![Header with title and optional hook, `.topic-body` paragraphs for context and an “Essential question” card, plus a vocabulary section listing key terms or a placeholder.](./archetypes/preview-topic-introduction.svg)

---

### Guided discovery (`guided-discovery`)

**Visual structure.** Header with context blurb, followed by three `.discovery-section` blocks: “Explore the text”, “What do you notice?”, and “Sample language”, each rendering a list or placeholder.

**Builder fields.**

- *Core inputs:* Slide title, Context, Discovery prompts, Noticing questions, Sample language (all lists accept one item per line).
- *Optional enrichments:* Icon classes for each section (stored), Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** Sections currently render text-only lists; icon fields are persisted for future styling. Layout badge reflects the chosen icon.

**Preview.** ![Header with context blurb, followed by three `.discovery-section` blocks: “Explore the text”, “What do you notice?”, and “Sample language”, each rendering a list or placeholder.](./archetypes/preview-guided-discovery.svg)

---

### Creative practice (`creative-practice`)

**Visual structure.** Header introducing the brief, followed by up to three `.creative-section` panels for materials, “Make together” steps, and sharing options.

**Builder fields.**

- *Core inputs:* Slide title, Creative brief text, Making steps (one per line).
- *Optional enrichments:* Materials list, Sharing options, Icon classes for each section (stored), Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** Sections render chips and lists without icons; the builder captures icon fields for future designs. Layout badge displays the selected icon.

**Preview.** ![Header introducing the brief, followed by up to three `.creative-section` panels for materials, “Make together” steps, and sharing options.](./archetypes/preview-creative-practice.svg)

---

### Task divider (`task-divider`)

**Visual structure.** Header with title and optional subtitle, plus a banner that can show timing and focus text. The `.divider-body` lists learner actions or a placeholder.

**Builder fields.**

- *Core inputs:* Slide title, Actions (one per line).
- *Optional enrichments:* Subtitle, Timing, Focus, Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** No per-field icons; only the layout badge icon appears.

**Preview.** ![Header with title and optional subtitle, plus a banner that can show timing and focus text. The `.divider-body` lists learner actions or a placeholder.](./archetypes/preview-task-divider.svg)

---

### Task reporting (`task-reporting`)

**Visual structure.** Header with title and optional goal statement, plus three `.reporting-section` blocks: prompts list, roles table, and evidence list.

**Builder fields.**

- *Core inputs:* Slide title, Reporting prompts (one per line), Roles (label/value pairs), Evidence list (one per line).
- *Optional enrichments:* Goal statement, Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** Sections render text without icons; layout badge uses the configured icon.

**Preview.** ![Header with title and optional goal statement, plus three `.reporting-section` blocks: prompts list, roles table, and evidence list.](./archetypes/preview-task-reporting.svg)

---

### Genre deconstruction (`genre-deconstruction`)

**Visual structure.** Header showing title plus optional genre and purpose meta, followed by a feature list and an optional mentor text blockquote.

**Builder fields.**

- *Core inputs:* Slide title, Genre, Purpose, Feature list (label/value pairs).
- *Optional enrichments:* Mentor text excerpt, Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** No dedicated icon fields; the layout badge conveys the chosen icon.

**Preview.** ![Header showing title plus optional genre and purpose meta, followed by a feature list and an optional mentor text blockquote.](./archetypes/preview-genre-deconstruction.svg)

---

### Linguistic feature hunt (`linguistic-feature-hunt`)

**Visual structure.** Header plus a `.feature-body` with an optional source text excerpt, a hunt targets list, and an optional reflection list.

**Builder fields.**

- *Core inputs:* Slide title, Source text excerpt, Feature hunt list (one per line).
- *Optional enrichments:* Reflection prompts (one per line), Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** Text renders without icons; layout badge shows the configured icon.

**Preview.** ![Header plus a `.feature-body` with an optional source text excerpt, a hunt targets list, and an optional reflection list.](./archetypes/preview-linguistic-feature-hunt.svg)

---

### Text reconstruction (`text-reconstruction`)

**Visual structure.** Header with title and optional context, a steps section, and a segments grid that displays reconstruction segments or a placeholder.

**Builder fields.**

- *Core inputs:* Slide title, Context, Steps (one per line), Segments (one per line).
- *Optional enrichments:* Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** No per-field icons; layout badge communicates the selected icon.

**Preview.** ![Header with title and optional context, a steps section, and a segments grid that displays reconstruction segments or a placeholder.](./archetypes/preview-text-reconstruction.svg)

---

### Jumbled text sequencing (`jumbled-text-sequencing`)

**Visual structure.** Header with title and optional instructions, followed by an ordered list of segments and an optional support tips section.

**Builder fields.**

- *Core inputs:* Slide title, Instructions, Segments (one per line).
- *Optional enrichments:* Support tips (one per line), Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** No per-field icons; layout badge relays the configured icon.

**Preview.** ![Header with title and optional instructions, followed by an ordered list of segments and an optional support tips section.](./archetypes/preview-jumbled-text-sequencing.svg)

---

### Scaffolded joint construction (`scaffolded-joint-construction`)

**Visual structure.** Header optionally showing mentor focus and shared outcome meta, with two columns listing teacher moves and learner moves.

**Builder fields.**

- *Core inputs:* Slide title, Mentor focus, Shared outcome, Teacher moves (one per line), Learner moves (one per line).
- *Optional enrichments:* Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** No dedicated icon fields; the layout badge presents the selected icon.

**Preview.** ![Header optionally showing mentor focus and shared outcome meta, with two columns listing teacher moves and learner moves.](./archetypes/preview-scaffolded-joint-construction.svg)

---

### Independent construction checklist (`independent-construction-checklist`)

**Visual structure.** Header with title and optional reminder, plus sections for checklist items and optional stretch goals.

**Builder fields.**

- *Core inputs:* Slide title, Reminder, Checklist items (one per line).
- *Optional enrichments:* Stretch goals (one per line), Background image URL, Overlay colour, Overlay opacity.

**Icon hooks.** Checklist bullets use built-in symbols; icon fields captured in the builder are saved for future enhancement. Layout badge uses the configured icon.

**Preview.** ![Header with title and optional reminder, plus sections for checklist items and optional stretch goals.](./archetypes/preview-independent-construction-checklist.svg)

---

### Card stack (`card-stack`)

**Visual structure.** `.card-stack-layout` with a pill tag, title, optional lead paragraph, and a vertical stack of `.stack-card` articles that include icon badges and supporting text.

**Builder fields.**

- *Core inputs:* Pill text, Slide title, Card list (title + description pairs).
- *Optional enrichments:* Pill icon class, Card icon class, Description lead copy.

**Icon hooks.** Defaults include `fa-solid fa-bookmark` for the pill and `fa-solid fa-circle-dot` for each card when no overrides are set. The layout badge defaults to `fa-solid fa-layer-group` unless changed.

**Alignment & spacing modifiers.**

- Stage alignment (`top`, `center`).
- Card spacing density (`default`, `tight`, `roomy`).

**Preview.** ![`.card-stack-layout` with a pill tag, title, optional lead paragraph, and a vertical stack of `.stack-card` articles that include icon badges and supporting text.](./archetypes/preview-card-stack.svg)

---

### Pill with gallery (`pill-with-gallery`)

**Visual structure.** `.pill-gallery-layout` with a pill tag, title, description, and a responsive gallery of figure elements (image, caption with optional icon, and credit line).

**Builder fields.**

- *Core inputs:* Pill text, Slide title, Gallery items (image, alt text, caption, credit fields).
- *Optional enrichments:* Pill icon class, Gallery item icon class, Description lead copy.

**Icon hooks.** Defaults include `fa-solid fa-camera-retro` for the pill and `fa-solid fa-image` for gallery captions. The layout badge defaults to `fa-solid fa-images` unless changed.

**Alignment & spacing modifiers.**

- Stage alignment (`top`, `center`).
- Gallery alignment (`start`, `center`).

**Preview.** ![`.pill-gallery-layout` with a pill tag, title, description, and a responsive gallery of figure elements (image, caption with optional icon, and credit line).](./archetypes/preview-pill-with-gallery.svg)

