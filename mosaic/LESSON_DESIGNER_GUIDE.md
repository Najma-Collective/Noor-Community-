# Mosaic Lesson Designer Guide

This guide explains how to build and maintain presentation decks for the Mosaic lesson experience. It covers the overall data schema, how layouts map to Handlebars templates, asset guidelines (including the new automatic Pexels fallbacks), and workflow tips for crafting lessons that feel consistent and export cleanly.

---

## 1. Conceptual model

Mosaic decks are defined in [`mosaic/app.js`](app.js) inside a single `presentations` object. Each key in that object represents one presentation deck:

```js
const presentations = {
  uniquePresentationName: {
    id: 'uniquePresentationName',
    deckTitle: 'Visible name in the UI',
    slides: [ /* array of slide definitions */ ]
  }
};
```

Every slide definition must include two properties:

- `layout` – matches the Handlebars template id (without the `-template` suffix) in [`mosaic/index.html`](index.html).
- `content` – an object with the fields required by the chosen layout.

During runtime a slide is compiled with `Handlebars`, injected into the stage, and any interactive form fields are tracked via `data-field-key` attributes so that user input persists across navigation and exports.

---

## 2. Slide schema reference

Below is a complete catalogue of the available layouts and the data expected in `content`. Optional fields are marked where relevant.

| Layout key | Purpose | Required fields in `content` |
| --- | --- | --- |
| `hero-title` | Title slide with full-width background image and overlay. | `backgroundImage`, `title`; optional `badgeLabel` by editing template if needed. Deck title is injected automatically. |
| `simple-centered-text` | Large centered heading and optional subtitle. | `title`; optional `subtitle`. |
| `framed-list` | Intro card with bullet list. | `title`, `introText`, `listItems` (array). |
| `full-text-block` | Rich HTML block (e.g. exemplar text). | `htmlContent` (string, rendered as HTML). |
| `blank-slide` | Empty canvas for custom notes. | *(no additional fields)* |
| `discussion-table` | Two-column table for discussion prompts and notes. | `title`, `subtitle`, `questions` (array of strings). |
| `analysis-table` | Prompts with free-response textareas. | `title`, `instruction`, `questions` (array). |
| `matching-task-vertical` | Split layout with stimulus text/HTML and matching options. | `title`, `instruction`, `stimulusHTML` (string rendered as HTML), `options` (array of strings). |
| `image-matching-horizontal` | Image strip with numbered statements beneath. | `title`, `instruction`, `images` (array of URLs), `sentences` (array of strings). |
| `storyboard-creator` | Four-panel storyboard with textarea beneath each image. | `title`, `instruction`, `images` (array of URLs). |
| `image-prompt` | Prompt card with supporting image. | `title`, `instruction`, `image` (URL). |
| `image-response` | Image with two stacked response boxes. | `title`, `instruction`, `image` (URL). |
| `storyboard-display` | Storyboard gallery with alphabetical captions. | `title`, `instruction`, `images` (array of URLs). |
| `reporting-prompt` | Split card encouraging learners to report back. | `title`, `instruction`, `image` (URL). |
| `worksheet` | Two-column worksheet with custom sections. | `sections` (array of `{ title, contentHTML }` blocks rendered as HTML). |
| `gap-fill-exercise` | Gap-fill prompt with draggable-style word bank. | `title`, `instruction`, `wordBox` (array of words), `sentence` (string with blanks indicated by `___`). |
| `multiple-choice-question` | Question stem with four options (radio buttons). | `title`, `instruction`, `question`, `options` (array). |
| `sentence-scramble` | Scramble practice with numbered items. | `title`, `instruction`, `scrambledSentences` (array of strings). |
| `stacked-labels` | Visual labels stacked along an image. | `title`, `subtitle`, `backgroundImage` (URL), `labels` (array of `{ value, text }`). |
| `audio-comprehension` | Audio transcript card with supporting image. | `title`, `instruction`, `text` (transcript string), `image` (URL), optional `audioFile` (URL displayed as a label). |
| `intonation-practice` | Intonation drill list. | `title`, `instruction`, `sentences` (array of strings). |
| `two-column-details` | Two text columns with headings. | `title`, optional `subtitle`, `leftContentHTML`, `rightContentHTML` (strings rendered as HTML). |
| `checklist` | Checklist with tickable items. | `title`, `instruction`, `checklistItems` (array of HTML strings). |
| `feedback-columns` | Two feedback columns (e.g. Stars & Wishes). | `title`, `instruction`, `column1Title`, `column2Title`. |
| `definition-list` | Definition cards with term/definition pairs. | `title`, `instruction`, `items` (array of `{ term, definition }`). |
| `three-column-reflection` | Triple reflection prompts. | `title`, `instruction`, `questions` (array of three strings). |
| `star-wish-reflection` | “Two stars and a wish” reflection. | `title`, `instruction`, `star1`, `star2`, `wish` (strings). |
| `task-preparation` | Ordered list of take-home steps. | `title`, `instruction`, `steps` (array). |

> **Tip:** If a layout expects HTML (e.g. `full-text-block`, `two-column-details`), keep the markup minimal and avoid inline scripts or external embeds for security and print consistency.

---

## 3. Field persistence and identifiers

Interactive components—such as textareas, checkboxes, and radio buttons—store learner input by referencing `data-field-key` attributes. The base pattern is `slide-${_slideIndex}-descriptor`. When you introduce a custom input element, follow that pattern so it remains unique within the deck. The state is persisted to `localStorage` under the key `mosaic-state-v1` and restored automatically when the deck reloads.

Annotations operate on highlighted text inside a slide. They are saved per presentation and, thanks to the export enhancements, now appear beneath each slide when you print or export to PDF.

---

## 4. Media usage

### 4.1 Allowed paths and sanitisation

All media paths run through a resolver that accepts:

- Relative paths within the `mosaic/` directory (e.g. `assets/images/city-map.svg`).
- Same-origin absolute URLs.
- Approved remote hosts listed in `MEDIA_HOST_WHITELIST` (currently `images.pexels.com`).
- Data URIs for small inline assets.

If a URL does not pass validation, the slide will fall back to a placeholder image to keep the layout readable.

### 4.2 Automatic Pexels fallbacks

Whenever an image fails to load, the system now queries Pexels for a replacement using the deck title, slide title, subtitle, instruction text, and optional `imageQuery` string from your slide content. You can guide the fallback search by adding `imageQuery` to any slide’s `content`, for example:

```js
{
  layout: 'image-prompt',
  content: {
    title: 'Market inspirations',
    instruction: 'What details make this marketplace unforgettable?',
    image: 'assets/images/tourism-market.svg',
    imageQuery: 'vibrant local market Morocco'
  }
}
```

If the original asset and the fallback both fail, a branded SVG placeholder is displayed so the learner is never left with a broken image icon.

### 4.3 Best practices

- **Supply descriptive alt text**: Template defaults (“Prompt image”, etc.) combine with the fallback query, so consider customising them for richer search hints.
- **Prefer SVG for UI illustrations** when possible to keep exports crisp.
- **Host custom imagery on an approved domain**. If you need to add another domain, update `MEDIA_HOST_WHITELIST` alongside a short comment explaining the rationale.

---

## 5. Export & print behaviour

- The toolbar, navigation chrome, and annotation side panel are hidden in print mode for a clean PDF.
- Annotations per slide are now appended below the slide content in export view (`.print-annotation-summary`), including both the highlighted quote and any accompanying note text.
- Media placeholders preserve spacing, ensuring printouts remain legible even when an online asset is unavailable.

When exporting programmatically, trigger the same flow the UI uses: call `preparePrintArtifacts()` (optional helper) before `window.print()` so annotation summaries are generated.

---

## 6. Creating a new lesson

1. **Duplicate an existing deck** inside `presentations` as a starting point or add a new key.
2. **Set `id` and `deckTitle`** to the values you want displayed in the selector and badge.
3. **Compose the `slides` array**, choosing layouts from the table above. Keep related content grouped (warm-up, input, practice, reflection, next steps) for flow consistency.
4. **Add learner tasks**: where a layout includes textareas or checklists, draft prompts that nudge observable output.
5. **Provide media assets**. Place local files under `mosaic/assets/` or use approved remote URLs. Add `imageQuery` hints when the visual is critical to understanding.
6. **Review accessibility**: confirm headings remain hierarchical, alt text is meaningful, and colour contrast meets expectations (especially if you override template copy).
7. **Test the deck** in the browser: navigate through slides, add sample annotations, and run an export. Ensure the print PDF includes the notes you expect.
8. **Commit your changes** and include a summary describing any new assets or schema tweaks so other designers can follow the pattern.

---

## 7. Troubleshooting checklist

- **Image not loading?** Check the browser console for the whitelist warning. Either move the asset onto an approved host or add an `imageQuery` so the automatic Pexels fallback is more precise.
- **Annotations missing in PDF?** Verify you are on the latest code—printing now generates per-slide summaries by default.
- **Template error slide appears?** This indicates a missing or mistyped layout id. Double-check that the `layout` string exactly matches a template id in `index.html`.
- **Persisted field not restoring?** Ensure each interactive element has a unique `data-field-key`. Collisions mean later values overwrite earlier ones.

With these practices, you can assemble structured, media-rich lessons that remain stable during live facilitation and in exported handouts.
