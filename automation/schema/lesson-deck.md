# From lesson concept to JSON deck

This guide walks learning designers through the hand-off from a natural-language lesson outline to a schema-valid JSON deck. Use
it alongside the [lesson deck schema](./lesson-deck.schema.json), the [authoring template](./lesson-deck.template.jsonc), and the
[Slide Archetype Field Guide](../archetypes/README.md) when planning a build.

## 1. Capture the high-level brief
Start by translating the creative brief into the **identification block** of the template:

1. Copy the template JSONC file and replace the placeholder `id`, `title`, `language`, `level`, and `version` values.
2. Distil the headline promise and hook into `subtitle` and `description`—keep copy learner-facing and in sentence case.
3. Record curriculum tags, target theme, estimated duration, and any facilitator notes that surfaced during intake interviews.

> **Tip:** Keep IDs stable. Updating `version` is safer than mutating the canonical `id` once a deck is in review.

## 2. Convert objectives into structured outcomes
Take the natural-language learning outcomes from the brief or storyboard and map them directly into the `learning_objectives`
array:

- Each objective should be action-oriented (`describe`, `compare`, `create`) and scoped to a single observable behaviour.
- When objectives include multiple clauses, split them into separate array entries so slide `objective_refs` can stay precise.
- Use the localized rich-text shape from the template if you need formatting (bold emphasis, inline vocabulary, etc.).

If facilitators provided prerequisite skills or success criteria, capture them in `notes` or `review_notes` rather than
overloading objectives.

## 3. Log contributors and workflow metadata
Translate the production roster into `contributors` entries. Capture everyone who shaped the plan—writer, editor, illustrator,
and QA. Use `release_status` to mirror the current review gate, and move meeting minutes or outstanding questions into
`review_notes` so the rendering pipeline receives an authoritative record of blockers.

## 4. Map narrative beats to slide archetypes
Work through the storyboard or beat sheet and decide which archetype best expresses each moment:

1. Annotate each beat with its intent (e.g., *set context*, *model dialogue*, *run collaborative activity*).
2. Cross-reference that intent with the [archetype guide](../archetypes/README.md) to select the corresponding `archetype` ID.
3. For each chosen layout, consult the relevant example JSON to confirm required fields and supported optional embellishments.
4. Log the beat in the `slides` array with a unique `slug`, plain-language `title`, and `objective_refs` pointing back to the
   objective indices established earlier.

Keep the order faithful to the lesson flow. Use `duration_hint` to note pacing adjustments surfaced during storyboarding so
facilitators can judge transitions at a glance.

## 5. Structure slide data blocks
Translate each beat’s narrative copy and interaction notes into the `data` object expected by the chosen archetype:

- For media-heavy slides, specify `mediaAsset` entries with descriptive `alt`/`caption` values gathered from the plan.
- For dialogue beats, split each turn into `dialogue_box.lines` and carry over any stage directions as `dialogue_box.stage_direction`.
- For collaborative tasks, map workspace zones, tokens, or prompts exactly as described by facilitators. Maintain consistent IDs so
  drop zones, feedback, and call-to-action buttons can reference each other without confusion.

Leverage the template placeholders as scaffolding; replace the sample copy with your own while preserving key names.

## 6. Assemble the asset manifest
Gather image, audio, and document references from the plan and slot them into the `assets` object:

- Always provide a `cover_image`. If the plan references motion intros or downloadable worksheets, represent them using `hero_video`
  and `downloads`.
- Capture licensing or credit details in `caption` or `credit` fields to avoid ambiguity during production.
- If accessibility requirements were noted (e.g., transcript needed, high-contrast visuals), add them now so the rendering pipeline
  can validate before export.

## 7. Optional support sections
Use the plan’s inclusivity notes, vocabulary lists, or glossary requirements to populate optional schema sections:

- `accessibility`: Summaries, audio description notes, or instructions for adapting the experience.
- `glossary`: Terms and definitions promised in the scope.
- `assets.brand_palette`: Colour directions from the visual design kit.

Only add these blocks when the plan calls for them; the renderer rejects empty objects.

## 8. Review and validate
Before handing off the JSON to engineering or the automation pipeline:

1. Run a JSON validator or the internal schema check to confirm structural compliance.
2. Verify that every slide `objective_refs` index corresponds to an existing entry in `learning_objectives`.
3. Spot-check that archetype-specific data blocks include all required keys listed in the archetype guide examples.

Once validated, deliver the populated JSON file along with any referenced asset folders. The automation team can ingest it
immediately into the rendering pipeline with confidence that it reflects the agreed-upon natural-language plan.
