# Mosaic Lesson Designer Guide

Welcome to Noor Community's Mosaic presentation system. This guide explains how lesson designers can plan, build, and maintain lesson decks that run inside the Mosaic web app.

## 1. How Mosaic Loads Lessons

Mosaic is a static web application (`mosaic/index.html`) that renders slide decks described in JavaScript. Each deck lives in its own file inside `mosaic/presentations/`. When the page loads it executes every presentation file, each of which registers itself on the global `window.MOSAIC_PRESENTATIONS` object. The core runtime (`mosaic/app.js`) reads that registry, populates the presentation picker, and renders slides using Handlebars templates embedded in `index.html`.

Key points:

* Every deck file must attach a presentation object to `window.MOSAIC_PRESENTATIONS` using its unique `id` as the key.
* `app.js` copies the registered presentations when the page initialises. Register decks before `app.js` runs by ensuring their `<script>` tags appear before `app.js` in `index.html` (already configured in this repository).
* Designers never edit `app.js` to add new lessons—only add or update files in `mosaic/presentations/`.

## 2. Project Layout

```
mosaic/
├── assets/                 # Local media (audio, icons, etc.) referenced by slides
├── presentations/          # One JavaScript file per presentation deck
├── index.html              # HTML shell and Handlebars templates
├── app.js                  # Presentation runtime (navigation, annotations, storage)
├── overflow-monitor.js     # Optional overflow helper for long text
├── pexelsService.js        # Utility for fetching royalty-free imagery
├── style.css / print.css   # Visual styling for on-screen + print exports
└── LESSON_DESIGNER_GUIDE.md # This guide
```

Keep decks organised by keeping **exactly one presentation per file** in the `presentations` directory. Use clear filenames such as `introductionToDebate.js` to make version history easy to follow.

## 3. Anatomy of a Presentation File

Every deck file follows the same structure: wrap the presentation definition in an immediately invoked function expression (IIFE) and register it on the global registry.

```js
(() => {
  const presentation = {
    id: 'introductionToDebate',      // Unique identifier (used in URLs, storage, etc.)
    deckTitle: 'Introduction to Debate',
    slides: [
      {
        layout: 'hero-title',       // Must match a template id without the `-template` suffix
        content: {
          title: 'Introduction to Debate',
          backgroundImageQuery: 'students debating on stage',
          backgroundImageAlt: 'Two students presenting opposing arguments on a small stage'
        }
      },
      // …additional slide objects…
    ]
  };

  window.MOSAIC_PRESENTATIONS = window.MOSAIC_PRESENTATIONS || {};
  window.MOSAIC_PRESENTATIONS[presentation.id] = presentation;
})();
```

### Slide Objects

Each slide object contains two keys:

* `layout` – the name of the template to render (listed in section 5).
* `content` – data injected into the template. `resolveSlideMedia` in `app.js` automatically enhances `content` with imagery when you provide a query (see Section 4).

You can mix layouts in any order. Slides are rendered sequentially and persisted locally—learners can annotate and resume where they left off.

## 4. Working with Media

Mosaic integrates with the [Pexels](https://www.pexels.com/) API to fetch royalty-free imagery at runtime (`mosaic/pexelsService.js`). Designers can provide a search query instead of a fixed image URL, and the runtime fetches the first matching photo.

Supported properties in `content`:

| Property | Purpose | Notes |
| --- | --- | --- |
| `backgroundImageQuery` | Search term to populate `backgroundImage` for background layouts. | Supply `backgroundImageAlt` for accessibility; the runtime also saves photographer credit internally.
| `imageQuery` | Fetches a single illustrative image and maps it to `image`. | Applies to layouts such as `image-prompt`, `image-response`, `reporting-prompt`, and `audio-comprehension`.
| `imageQueries` | Array of search terms; results map to `images`, `imageAltTexts`, and `imageCredits`. | Used by gallery layouts (`image-matching-horizontal`, `storyboard-creator`, `storyboard-display`). Provide matching `imageAltTexts` when you need custom descriptions.
| `image` / `backgroundImage` | Direct URL to an image when you do not want Mosaic to fetch media. | Useful for bespoke artwork hosted locally.
| `audioFile` | Path to an audio asset stored under `mosaic/assets/`. | Keep filenames descriptive; store companion transcripts in the `text` field.

If no API key is configured Mosaic will log a warning and fall back to rendering slides without imagery. The app reads the key from the `<meta name="pexels-api-key">` tag in `index.html`, an environment variable, or the global `PEXELS_API_KEY` constant.

## 5. Slide Layout Library

Use the table below to select layouts and understand the fields each expects. All layout names match the `layout` property of a slide object.

| Layout | Key fields | Interaction & notes |
| --- | --- | --- |
| `hero-title` | `title`, optional `backgroundImage` or `backgroundImageQuery`, `backgroundImageAlt` | Full-bleed cover slide showing deck badge and title. |
| `simple-centered-text` | `title`, optional `subtitle` | Minimal centred heading slide. |
| `framed-list` | `title`, `introText`, `listItems` (array of strings) | Single-column list with intro sentence. |
| `full-text-block` | `htmlContent` (HTML string) | Rich text card; accepts inline HTML for custom formatting. |
| `blank-slide` | *(no required fields)* | Empty canvas useful for ad-hoc discussions or embedded content via HTML. |
| `discussion-table` | `title`, `subtitle`, `questions` (array) | Generates a table with note-taking textareas per prompt. |
| `analysis-table` | `title`, `instruction`, `questions` (array) | Similar to `discussion-table` but labelled “Analysis”. |
| `matching-task-vertical` | `title`, `instruction`, `stimulusHTML`, `options` (array) | Two-column layout with a prompt block and clickable option buttons. |
| `image-matching-horizontal` | `title`, `instruction`, `imageQueries` or `images`, optional `imageAltTexts`, `sentences` (array) | Displays row of images above numbered sentences for matching activities. |
| `storyboard-creator` | `title`, `instruction`, `imageQueries` or `images`, optional `imageAltTexts` | Learners annotate each frame with textareas beneath fetched images. |
| `image-prompt` | `title`, `instruction`, `imageQuery` or `image`, optional `imageAlt` | Split layout pairing explanatory text with an image. |
| `image-response` | `title`, `instruction`, `imageQuery` or `image`, optional `imageAlt` | Presents an image alongside two response textareas. |
| `storyboard-display` | `title`, `instruction`, `imageQueries` or `images`, optional `imageAltTexts` | Showcases a sequence of images with alphabetical captions (no inputs). |
| `reporting-prompt` | `title`, `instruction`, `imageQuery` or `image`, optional `imageAlt` | Balanced layout for oral reporting prompts. |
| `worksheet` | `sections` (array of `{ title, contentHTML }`) | Two-column grid of worksheet cards. Provide HTML for bullet points or tables. |
| `gap-fill-exercise` | `title`, `instruction`, `wordBox` (array), `sentence` | Word box plus textarea for completed sentence. |
| `multiple-choice-question` | `title`, `instruction`, `question`, `options` (array) | Renders radio buttons; selection is stored per learner. |
| `sentence-scramble` | `title`, `instruction`, `scrambledSentences` (array) | Ordered list of scrambled sentences with response areas. |
| `stacked-labels` | `backgroundImage` or `backgroundImageQuery`, optional `backgroundImageAlt`, `labels` (array of `{ value, text }`) | Layered label cards displayed over a background image. |
| `audio-comprehension` | `title`, `instruction`, `imageQuery` or `image`, optional `imageAlt`, `text`, `audioFile` | Audio prompt with supporting description and image. |
| `intonation-practice` | `title`, `instruction`, `sentences` (array) | Checklist of sentences for choral practice. |
| `two-column-details` | `title`, optional `subtitle`, `leftContentHTML`, `rightContentHTML` | Two rich-text columns for comparing concepts. |
| `checklist` | `title`, `instruction`, `checklistItems` (array; HTML allowed) | Simple checklist for peer reviews or task monitoring. |
| `feedback-columns` | `title`, `instruction`, `column1Title`, `column2Title` | Two feedback columns with paired textareas (four inputs total). |
| `definition-list` | `title`, `instruction`, `items` (array of `{ term, definition }`) | Glossary-style presentation. |
| `three-column-reflection` | `title`, `instruction`, `questions` (array of strings) | Three prompt cards with response textareas. |
| `star-wish-reflection` | `title`, `instruction`, `star1`, `star2`, `wish` | Star-and-wish reflection framework with inputs. |
| `task-preparation` | `title`, `instruction`, `steps` (array) | Numbered action steps to close the lesson. |

When in doubt, open `mosaic/index.html` and inspect the template with id `<layout-name>-template` to see exactly how data is used.

## 6. Lesson Design Best Practices

1. **Start with learner outcomes.** Align the deck title, opening slide, and closing actions with the skill learners should practise.
2. **Mix modalities.** Combine discussion, analysis, and production layouts to balance input, practice, and reflection.
3. **Keep slides focused.** Each slide should target a single activity. If you need multiple prompts, create additional slides rather than overloading one layout.
4. **Write actionable instructions.** Use concise verbs and clarify expected output, especially when a layout exposes textareas or checklists.
5. **Provide accessible media.** Always supply `imageAlt` text for meaningful imagery. Offer transcripts in the `text` field for audio prompts.
6. **Localise content.** Adjust cultural references, names, and idioms so they resonate with your learners.
7. **Test with the runtime.** Open `mosaic/index.html` in a local server (for example `npx http-server mosaic`) to review navigation, annotation behaviour, and print exports.

## 7. Adding a New Deck – Step-by-Step

1. **Duplicate a starter file.** Copy one of the existing files in `mosaic/presentations/` and rename it to match your lesson theme.
2. **Update metadata.** Change the `id` (use camelCase, no spaces) and `deckTitle`.
3. **Draft slides.** Replace the `slides` array with your own sequence. Mix layouts as needed and provide media queries or direct URLs.
4. **Check alt text and transcripts.** Ensure every media element includes descriptive text for accessibility.
5. **Verify registration.** Confirm your `<script>` tag is referenced in `index.html`. New files should follow the established pattern.
6. **Preview locally.** Load the Mosaic app, select your new deck from the dropdown, and verify instructions, interactions, and data persistence.
7. **Iterate with educators.** Share the deck for feedback; update slide copy or sequencing as needed.

## 8. Maintenance Tips

* **Version control:** Keep commits focused on a single deck to simplify reviews. Because presentations are stand-alone files, diffs stay readable.
* **Asset management:** Store supporting media in `mosaic/assets/` and reference them with relative paths.
* **Annotation awareness:** Learners can highlight slide text to create annotations. Avoid wrapping core copy in interactive elements that block text selection.
* **Overflow monitoring:** Long text is automatically checked by `overflow-monitor.js`. If you add unusually long content, preview at typical display widths to ensure readability.
* **Print mode:** `print.css` optimises decks for PDF exports. Use the browser’s print preview to verify page breaks and spacing for handouts.

By following this guide you can craft engaging Mosaic lessons that remain easy to maintain over time. Happy designing!
