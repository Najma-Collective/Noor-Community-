# Deck compliance assertions

This document enumerates the structural checks enforced by `tests/validate-deck.mjs`. The runner
constructs lesson decks from JSON briefs, loads the production Sandbox CSS/JS into a JSDOM runtime,
and then inspects every generated slide. When a selector is missing or a count diverges from the
expected archetype definition the failure is reported with an actionable diff (selector, expectation,
and observed value).

## Deck shell

* A live region (`#deck-status`) and toast mount (`#deck-toast-root`) are always present at the top of
the document so screen readers can receive navigation updates.
* The `.deck-toolbar` renders a brand block, the slide counter (`#slide-counter`), and the builder
  controls: `#add-slide-btn`, `#activity-builder-btn`, `#save-state-btn`, and `#load-state-btn` plus the
  canvas tools dropdown toggle (`#canvas-tools-toggle`).
* The workspace mounts inside `<main id="lesson-stage" class="deck-workspace">` with a `.stage-viewport`
  wrapper and paired navigation buttons (`.slide-nav-prev`, `.slide-nav-next`) exposing `aria-label`
  attributes for assistive technology.
* Generated decks surface at least one slide. The first slide is revealed (`.hidden` removed) and the
  slide counter renders as `1 / <total>`.

## Blank canvas (`blank-canvas`)

* Slides render with `data-type="blank"` and wrap their content in `.blank-slide`.
* Builder affordances surface via `.blank-controls-home[data-role="blank-controls-home"]`.
* The workspace region is exposed as `.blank-canvas[role="region"][aria-label]`.

## Learning objectives (`learning-objectives`)

* Slides inherit the `.lesson-slide.lesson-slide--learning-objectives` classes and set
  `data-layout="learning-objectives"`.
* `.lesson-header` contains the slide title and, when provided, the communicative goal line with the
  `So you can` label.
* A `.lesson-goals-card` renders inside `.lesson-body` with one `<li>` per configured goal. Each item
  carries the `.lesson-goal-icon` wrapper and visible goal text.

## Model dialogue (`model-dialogue`)

* Slides inherit the `.lesson-slide.lesson-slide--model-dialogue` classes and set
  `data-layout="model-dialogue"`.
* `.lesson-header` renders both the title and the optional `.lesson-instructions` block.
* Dialogue content is wrapped in `.lesson-dialogue-text` with a `.dialogue-turn` for every speaker/line
  pair. Each turn includes `.dialogue-speaker` and `.dialogue-line` children.

## Interactive practice (`interactive-practice`)

* Slides use the `.interactive-practice-slide` class and expose the activity type through
  `data-activity-type`.
* `.practice-header` contains the title and `.practice-type` label describing the configured activity
  type.
* `.practice-instructions` and `.practice-questions` both render within `.practice-body`. Question
  lists use an ordered list with `.practice-question` items matching the configured prompts.
* The interactive host is mounted at `.practice-module[data-role="practice-module-area"]` with a
  `.practice-module-host[data-role="practice-module-host"]` and an `.activity-btn[data-action="add-module"]`
  control so authors can inject interactive embeds.
