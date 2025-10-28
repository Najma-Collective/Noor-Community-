# Sandbox deck scaffolding

The sandbox deck tooling is in the middle of a major refresh. We are rebuilding a curated collection of lesson archetypes and, during that work, the generator and in-browser builder only expose the `blank-canvas` layout. Existing identifiers such as `learning-objectives`, `interactive-practice`, and the other legacy archetypes have been deprecated and now produce explicit errors when requested. This temporary pause keeps the codebase tidy while the next wave of layouts is authored.

## Quick start

1. Install dependencies inside `sandbox/`:
   ```bash
   cd sandbox
   npm install
   ```
2. Author a brief (see [Brief format](#brief-format)). While the curated list is under construction, every slide should use the `blank-canvas` layout—e.g. create `examples/blank-canvas-brief.json` with the sample payload below.
3. Run the generator:
   ```bash
   node scripts/create-deck.mjs --input examples/blank-canvas-brief.json --output decks/blank-deck.html \
     --pexels-key "$PEXELS_API_KEY"
   ```

The script prints the path to the generated HTML deck. Open the file in a browser to review the scaffolded slides. The deck boots `setupInteractiveDeck` automatically, so navigation and editing affordances remain available.

## Brief format

Deck briefs are plain JSON objects with the following top-level shape:

```jsonc
{
  "title": "Optional deck title shown in the `<title>` tag",
  "lang": "Optional BCP-47 language code (defaults to \"en\")",
  "brand": { "label": "Toolbar brand text" },
  "pexelsKey": "Optional per-brief Pexels key override",
  "slides": [
    {
      "layout": "blank-canvas", // Only accepted value while curated layouts are rebuilt
      "data": {}
    }
  ]
}
```

Each slide must declare a `layout`. The CLI still merges defaults from `BUILDER_LAYOUT_DEFAULTS`, but that table currently only contains the blank archetype. Supplying one of the previously documented identifiers will raise a descriptive error reminding you that the layout is retired for now.

## Supported layouts

```
blank-canvas
```

A refreshed catalogue of layouts will arrive in upcoming releases. When that happens, the README and CLI help text will expand to include usage guidance for each archetype.

## Deprecated layout identifiers

The following identifiers were removed as part of the cleanup and should no longer be used in briefs, saved state files, or custom tooling:

```
learning-objectives
model-dialogue
interactive-practice
communicative-task
pronunciation-focus
reflection
grounding-activity
topic-introduction
guided-discovery
creative-practice
task-divider
task-reporting
genre-deconstruction
linguistic-feature-hunt
text-reconstruction
jumbled-text-sequencing
scaffolded-joint-construction
independent-construction-checklist
card-stack
pill-with-gallery
reflection-board
split-grid
```

Referencing any of these identifiers will now cause the sandbox build steps to fail fast so that downstream decks are not silently desynchronised.

## Pexels integration

The generator still understands the Pexels placeholder object format. Although `blank-canvas` does not automatically slot imagery, you can stash resolved URLs in your brief and reference them from custom markup inside the canvas. The [Pexels Search API](https://www.pexels.com/api/documentation/#photos-search) remains available through the same configuration fields as before.

Example placeholder object:

```json
{
  "pexelsQuery": "students prototyping project",
  "orientation": "landscape",
  "fallback": "https://images.pexels.com/photos/3182745/pexels-photo-3182745.jpeg"
}
```

Provide your API key via `--pexels-key`, the `PEXELS_API_KEY` environment variable, or the `pexelsKey` field in the brief. For local prototyping you can use the shared sandbox key:

```
PEXELS_API_KEY=ntFmvz0n4RpCRtHtRVV7HhAcbb4VQLwyEenPsqfIGdvpVvkgagK2dQEd
```

## Output structure

The CLI produces an HTML document that already links to the sandbox fonts and styles, injects the standard toolbar shell, and initialises `setupInteractiveDeck` via an inline module script. Slides are rendered into the main stage in the order provided by the brief; the first slide is automatically unhidden. Because the output reuses the production layout generator, you can safely edit the generated markup further in code or drop it back into the builder without structural drift.

As additional archetypes graduate into the curated list, they will surface here along with any new data contracts or media affordances they introduce.
