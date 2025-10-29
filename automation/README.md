# Automation hand-off checklist

This directory houses the schema, archetype kit, and rendering helpers that transform authored lesson decks into production HTML
and interactive assets. Before passing a deck to the automation pipeline, complete the following steps:

1. **Duplicate the template** – Copy [`schema/lesson-deck.template.jsonc`](schema/lesson-deck.template.jsonc) and rename the file
   using your deck ID (e.g., `GLOBAL-STUDIES-A2-01.jsonc`). The comment scaffolding highlights every required field.
2. **Populate required metadata** – Fill in identification fields (`id`, `title`, `language`, `level`, `version`) and curriculum
   descriptors (`subject`, `theme`, `estimated_duration_minutes`, `tags`). Keep the structure intact; do not remove placeholder keys.
3. **Translate your storyboard** – Use [`schema/lesson-deck.md`](schema/lesson-deck.md) to convert natural-language objectives,
   sequencing notes, and asset requests into valid schema blocks. Reference the [Slide Archetype Field Guide](archetypes/README.md)
   whenever you choose an `archetype` ID.
4. **Audit assets and accessibility** – Confirm the `assets` object lists every required file path, credit, and accessibility note.
   Include transcripts or alternative text wherever media appears in your plan.
5. **Validate structure** – Run your preferred JSON validator or the internal schema check against
   [`schema/lesson-deck.schema.json`](schema/lesson-deck.schema.json). Fix any errors before handing over the file.
6. **Package for automation** – Deliver the populated JSON (without `.jsonc` comments) plus referenced media in the agreed folder
   structure. The automation team will ingest the files into `render/` tooling for compilation.

Following this checklist keeps downstream rendering predictable and reduces turnaround time for QA and localisation.
