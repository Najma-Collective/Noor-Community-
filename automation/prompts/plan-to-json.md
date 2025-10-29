---
title: "Plan-to-JSON Authoring Prompt"
version: 1.0.0
schema: lesson-deck
schema_spec: "automation/schema/lesson-deck.schema.json"
updated: 2024-05-07
---

## Purpose
Provide a deterministic prompt for converting a validated lesson plan or storyboard into a schema-compliant lesson deck JSON payload consumed by the automation pipeline.

## Schema contract
- **Canonical source** – Follow `automation/schema/lesson-deck.schema.json` (Draft 2020-12). Only emit keys defined in the schema; `additionalProperties` are disallowed at the deck root and on nested objects such as slides, assets, and archetype data blocks.
- **Required root fields** – Ensure `id`, `title`, `language`, `level`, `version`, `assets`, `slides`, and `contributors` are present. Propagate optional catalog metadata (`subtitle`, `description`, `subject`, `theme`, `estimated_duration_minutes`, `tags`, `notes`, `review_notes`, `release_status`) when supplied in the plan.
- **Learning objectives** – Render each outcome in the `learning_objectives` array as localized rich text (objects with `format` + `content`). Split multi-clause objectives into discrete entries to preserve a one-to-many relationship with slide `objective_refs`.
- **Contributors** – Populate `contributors` with `name` and `role` per participant. Maintain declared ordering from the plan to preserve crediting.
- **Assets block** – Always include `cover_image` with `type`, `src`, and `alt`. Add optional `hero_video`, `downloads`, `brand_palette`, and similar substructures only when the plan provides data. Avoid empty arrays/objects.
- **Slides array** – Each slide requires a unique `slug`, learner-facing `title`, `archetype`, `duration_hint` when pacing is defined, and `objective_refs` matching zero-based indices from `learning_objectives`. Preserve storyboard order.
- **Archetype data** – For every `archetype`, embed a `data` object that satisfies the corresponding `$defs` schema. Reference `automation/archetypes/README.md` plus the example payloads in `automation/archetypes/examples/` to mirror required keys, nested arrays, and accessibility copy.

## Archetype selection rules
1. Derive the `archetype` value from the instructional intent of each storyboard beat. Use the field guide decision points:
   - **Context-setting** beats → `hero.overlay`, `pill.simple`, or `content.wrapper` (choose based on whether the plan calls for media-rich hero, concise instructional card, or mixed-media wrapper).
   - **Information sequencing** beats → `pill.card-stack` or `card.stack` depending on whether the plan specifies ordered steps or parallel cards.
   - **Dialogue / modeling** beats → `centered.dialogue`, `dialogue.grid`, or `dialogue.stack` based on layout density and whether multiple speakers are juxtaposed.
   - **Guided practice / workspaces** → `grid.workspace`, `interactive.activity-card`, or `content.wrapper` with embedded tasks depending on whether the plan emphasises free-form capture, scenario cards, or facilitator-led walkthroughs.
   - **Interactive assessments** → select among `interactive.token-board`, `interactive.token-table`, `interactive.token-quiz`, or `interactive.quiz-feedback` according to interaction pattern (drag-and-drop categorisation, token-to-cell matching, hybrid quiz, or multi-question feedback loop).
   - **Audio-driven practice** → `interactive.audio-dialogue` when the plan supplies listening prompts plus transcript or caption requirements.
2. Confirm the chosen archetype’s mandatory fields (`headline`, `dialogue_box`, `token_bank`, etc.) appear in the plan; otherwise request clarification or select a layout whose requirements the plan satisfies.
3. Maintain consistency across recurring patterns—reuse the same `archetype` when identical interactions repeat, updating only the `slug` and content.

## Output formatting
- Respond with **strict JSON** representing a single lesson deck object. No Markdown fences, comments, trailing commas, or explanatory prose.
- Preserve input capitalisation, punctuation, and markdown syntax within `content` strings. Do not convert rich text to plain text unless directed.
- Encode all URLs as absolute or plan-relative paths exactly as provided; do not infer file extensions.
- Sort keys according to the template order when feasible to ease diffs: metadata → learning objectives → contributors → workflow → assets → optional sections → slides.

## Validation checklist
1. **Schema validation (AJV)** – Ensure the payload validates under AJV Draft 2020-12 with `allErrors=true` and `strict=true`. Expect failures if:
   - Required properties are missing (`assets.cover_image.alt`, `slides[].data` fields, etc.).
   - Types are incorrect (e.g., `estimated_duration_minutes` must be a number, `objective_refs` must be integer arrays).
   - String patterns are violated (`id` must match `^[A-Z0-9._-]{3,40}$`, `slug` must be kebab-case).
   - Additional properties or comment-style keys are included.
2. **Cross-references** – Verify each slide’s `objective_refs` indexes existing objectives. AJV will not catch out-of-range integers when the array is non-empty, so perform a manual index check.
3. **Asset availability** – Confirm every asset referenced in slides (e.g., `mediaAsset.src`, `audio_player.source`) also appears or is justified within the plan’s asset list. Flag discrepancies before finalising.
4. **Accessibility commitments** – Ensure alt text, captions, transcripts, and ARIA labels promised in the plan are present. Missing accessibility copy is a common QA blocker.
5. **Archetype fidelity** – Compare each `data` block against the corresponding example JSON to confirm required nested structures are present (e.g., `token_board.action_bar.buttons`, `dialogue_box.lines[].speaker`).

## Common failure modes to avoid
- Duplicated `slug` values or skipped sequencing that breaks navigation order.
- Drifting archetype names (e.g., `heroOverlay`, `dialogue.grid` vs `dialogue-grid`). Always use schema enums verbatim.
- Emitting markdown objects as bare strings or vice versa (`{ "format": "markdown", "content": "..." }`).
- Leaving placeholder copy from the template in the final output.
- Omitting `objective_refs` or using 1-based indexes.
- Supplying empty arrays/objects for optional sections instead of omitting them.

## Self-review protocol
1. Diff the generated JSON against `automation/schema/lesson-deck.template.jsonc` to confirm section ordering and naming parity.
2. Spot-check at least two archetype instances against their canonical examples under `automation/examples/` (or `automation/archetypes/examples/`) to verify nested shapes and accessibility text.
3. Run AJV validation locally or through the pipeline linter. Address every error—do not ship with suppressed warnings.
4. Re-read the storyboard to confirm each beat, asset, and facilitator note was transcribed; annotate any missing source material for follow-up.
5. Perform a final pass for typography and markdown consistency (sentence case headlines, intentional bold/italic use, correct bullet syntax).
