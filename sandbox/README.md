# Sandbox deck scaffolding

The sandbox generator scaffolds interactive Noor Community decks using the refreshed Sandbox theme. It now includes the hero overlay and activity-focused layouts that ship with the exemplar deck, so you can prototype lessons locally before handing them to facilitators or importing them into the Activity Builder.

## Quick start

1. Install dependencies inside `sandbox/`:
   ```bash
   cd sandbox
   npm install
   ```
2. Choose or author a brief (see [Brief format](#brief-format)). Sample payloads live in [`sandbox/examples/`](./examples/).
3. Run the generator:
   ```bash
   node scripts/create-deck.mjs --input examples/hero-overlay-brief.json --output decks/hero-overlay.html \
     --pexels-key "$PEXELS_API_KEY"
   ```

The script prints the path to the generated HTML deck. You can also invoke it through the package script (`npx sandbox-create-deck --input …`) once `sandbox/` has been bootstrapped.

## CLI usage

```
node scripts/create-deck.mjs --input <brief.json> [--output <deck.html>] [--pexels-key <key>]
```

- `--input, -i` – Path to the deck brief JSON file (required).
- `--output, -o` – Optional destination for the generated HTML (defaults to `<brief-name>.html` next to the brief).
- `--pexels-key, -k` – Pexels API key. Falls back to the `PEXELS_API_KEY` environment variable or `brief.pexelsKey`.
- `--help, -h` – Print CLI usage details.

## Brief format

Deck briefs are plain JSON objects. At minimum they declare global metadata and the ordered list of slides to render.

```jsonc
{
  "title": "Optional deck title shown in the <title> tag",
  "lang": "Optional BCP-47 language code (defaults to \"en\")",
  "brand": {
    "label": "Toolbar brand text",
    "logos": [
      { "src": "../assets/noor_logo.webp", "alt": "Noor Community" },
      { "src": "../assets/almanar_logo.png", "alt": "Al Manar" }
    ]
  },
  "pexelsKey": "Optional per-brief Pexels key override",
  "slides": [
    {
      "layout": "hero-overlay",
      "data": {
        "pill": "Bethlehem × Amman Partnership",
        "headline": "Applying Critical Thinking to Pivot",
        "subtitle": "Signal the shared purpose before diving into negotiations and design work.",
        "image": {
          "pexelsQuery": "professional team negotiating around table",
          "orientation": "landscape",
          "alt": "Professional team negotiating around a meeting table"
        }
      }
    }
  ]
}
```

The generator merges layout defaults from `BUILDER_LAYOUT_DEFAULTS` before layering each slide’s `data` overrides. Supplying an unknown layout identifier raises an error so briefs do not silently desynchronise.

## Layout reference

The following layouts are currently shipped by the Sandbox theme:

### `hero-overlay`
- **Purpose:** Opening moments and high-impact hero slides with photography.
- **Required data:** `pill`, `headline`, `image` (with either `src` or `pexelsQuery`).
- **Optional data:** `subtitle`, `pillIcon`, `overlayTint`, `overlayOpacity`, `alignment` (`start|center|end`).

### `card-stack`
- **Purpose:** Agenda stacks, checklists, or layered prompts.
- **Required data:** `title`, `cards` (array of `{ title, description }`).
- **Optional data:** `pill`, `pillIcon`, `description`, `cardIcon`, modifier values from the builder (`stackDensity`, alignment, etc.).

### `pill-with-gallery`
- **Purpose:** Scenario spotlights that pair pill framing with a media mosaic.
- **Required data:** `pill`, `title`, `gallery` (array of `{ caption, image }`).
- **Optional data:** `description`, `mosaicStyle`, `actions` (`label`, `description`, `icon`, `href`), overrides for item/action icons.

### `reflection-board`
- **Purpose:** Glow/grow retrospectives and closing reflections.
- **Required data:** Two `columns` with `cards` (`prompt`, `detail`).
- **Optional data:** `pill`, `title`, `description`, icon overrides, `boardNote`, `footer` metadata.

### `split-grid`
- **Purpose:** Comparative canvases with two parallel tracks.
- **Required data:** `pill`, `title`, `columns` (left/right `items`).
- **Optional data:** `description`, icon overrides for the columns/items, supporting imagery blocks.

### `blank-canvas`
- **Purpose:** Free-form slide that leaves the canvas empty for bespoke layouts.
- **Required data:** None beyond the layout identifier; you control the markup inside the canvas.

## Pexels integration

The generator understands the Pexels placeholder object format. Provide your API key via `--pexels-key`, the `PEXELS_API_KEY` environment variable, or the `pexelsKey` field in the brief. For local prototyping you can use the shared sandbox key:

```
PEXELS_API_KEY=ntFmvz0n4RpCRtHtRVV7HhAcbb4VQLwyEenPsqfIGdvpVvkgagK2dQEd
```

Example placeholder object:

```json
{
  "pexelsQuery": "students prototyping project",
  "orientation": "landscape",
  "fallback": "https://images.pexels.com/photos/3182745/pexels-photo-3182745.jpeg"
}
```

When a placeholder is encountered the CLI requests an image using the configured key, falls back to any `fallback` URL if the API call fails, and annotates the resolved asset with the provided `alt` text.

## Output structure

The CLI produces an HTML document that links to the sandbox fonts, `sandbox-theme.css`, and `sandbox-css.css`. It injects the shared toolbar shell (skip link, toast region, status live region, toolbar actions, and stage navigation) and initialises `setupInteractiveDeck` via an inline module script. Slides render into the main stage in the order provided by the brief; the first slide is automatically unhidden. Because the output reuses the production layout generator, you can safely edit the generated markup further in code or round-trip it through the builder without structural drift.

## Deprecated layout identifiers

Legacy identifiers removed from the refreshed catalogue remain unsupported. Referencing any of these values will cause the sandbox build steps to fail fast so downstream decks stay in sync:

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
```

Use the layouts listed in the [Layout reference](#layout-reference) section instead.
