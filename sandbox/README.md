# Sandbox deck scaffolding

The sandbox now ships with a lightweight command-line utility that transforms a JSON "brief" into a fully interactive Noor Community deck. The generator renders slides with the same layout functions used by the in-browser builder (`sandbox/int-mod.js`) so the output stays in sync with design updates.

## Quick start

1. Install dependencies inside `sandbox/`:
   ```bash
   cd sandbox
   npm install
   ```
2. Author a brief (see [Brief format](#brief-format)). You can start from the samples in [`sandbox/examples/`](./examples/).
3. Run the generator:
   ```bash
   node scripts/create-deck.mjs --input examples/card-stack-brief.json --output decks/card-stack.html \
     --pexels-key "$PEXELS_API_KEY"
   ```

The script prints the path to the generated HTML deck. Open the file in a browser to review the scaffolded slides. The deck boots `setupInteractiveDeck` automatically, so navigation and editing affordances remain available.

## Blank sandbox deck

Open [`blank-master.html`](./blank-master.html) to launch a single-slide deck that already wires up the toolbar, canvas tools, and module builder from `exemplar-master.html`.
Use the Add Blank Slide button or the Slide Builder overlay to grow the deck without manually stripping demo content.

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
      "layout": "pill-with-gallery", // Any value from SUPPORTED_LESSON_LAYOUTS
      "data": { /* Layout specific configuration */ }
    }
  ]
}
```

Each slide must declare a `layout`. The CLI will merge the corresponding defaults from `BUILDER_LAYOUT_DEFAULTS` before applying your overrides, so you can omit any field you want to keep at its template value.

The current layouts exposed to the generator are:

```
blank-canvas
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
```

> **Tip:** If you request an unsupported layout the script exits with a helpful error listing the invalid value.

## Pexels integration

Any layout field that ultimately expects an image URL can be seeded from the Pexels catalogue by supplying a placeholder object instead of a string. The CLI recognises an object with a `pexelsQuery` property and replaces it with the first match returned by the [Pexels Search API](https://www.pexels.com/api/documentation/#photos-search).

Example gallery item:

```json
{
  "caption": "Prototype lab · Crews sketch solutions and annotate their trade-offs.",
  "image": {
    "pexelsQuery": "students prototyping project",
    "orientation": "landscape",
    "creditPrefix": "Photo",
    "fallback": "https://images.pexels.com/photos/3182745/pexels-photo-3182745.jpeg",
    "alt": "Students huddled around a table comparing notes"
  }
}
```

Supported placeholder options:

| Field | Purpose |
| --- | --- |
| `pexelsQuery` | Search term sent to the Pexels API (required). |
| `orientation`, `size`, `variant`, `color`, `locale`, `perPage` | Passed directly to the API request for finer control. |
| `alt` | Overrides the auto-generated alternative text. |
| `fallback` | URL to use if the API request fails or returns zero results. |
| `includeCredit` | Set to `false` to skip automatic credit lines. |
| `credit` | Custom credit string to inject into the slide caption. |
| `creditPrefix` | Prefix prepended to the photographer name (defaults to `Photo`). |
| `creditUrl` | Manually specify a credit link (otherwise the photographer URL from Pexels is used when available). |

When media is resolved, the CLI stores the chosen URL in the layout data, fills any missing `alt` text, and—unless disabled—adds a credit string plus optional link. The pill-with-gallery layout surfaces credits as an extra caption line automatically.

Provide your API key via `--pexels-key`, the `PEXELS_API_KEY` environment variable, or the `pexelsKey` field in the brief. For local prototyping you can use the shared sandbox key:

```
PEXELS_API_KEY=ntFmvz0n4RpCRtHtRVV7HhAcbb4VQLwyEenPsqfIGdvpVvkgagK2dQEd
```

## Example briefs

Two ready-to-run briefs live in [`sandbox/examples/`](./examples/):

- [`card-stack-brief.json`](./examples/card-stack-brief.json) – generates a workflow preview stack.
- [`pill-gallery-brief.json`](./examples/pill-gallery-brief.json) – demonstrates auto-populated gallery imagery with credits.

Generate both decks and compare the resulting HTML to understand how the CLI applies defaults, merges overrides, and captures Pexels metadata for you.

## Output structure

The CLI produces an HTML document that already links to the sandbox fonts and styles, injects the standard toolbar shell, and initialises `setupInteractiveDeck` via an inline module script. Slides are rendered into the main stage in the order provided by the brief; the first slide is automatically unhidden.

Because the output reuses the production layout generators, you can safely edit the generated markup further in code or drop it back into the builder without structural drift.
