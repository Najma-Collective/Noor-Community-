# Deck brief JSON schema

This reference defines the JSON structure consumed by `sandbox/scripts/create-deck.mjs` when generating Noor Community lesson decks. Use it when preparing briefs manually or prompting a model so every slide renders without post-processing.

## Top-level object

| Key | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | No | Populates the HTML `<title>` tag and toolbar title. Defaults to `"Noor Community Deck"` when omitted. |
| `lang` | string | No | BCP-47 language tag applied to the document root (defaults to `"en"`). |
| `brand` | object | No | Toolbar branding. Supports `{"label": "Noor Community"}`; additional keys are ignored by the generator. |
| `pexelsKey` | string | No | Optional per-brief override for the Pexels API key. Falls back to the CLI flag or `PEXELS_API_KEY`. |
| `slides` | array | **Yes** | Ordered list of slide definitions. Slides render in array order; the first slide is auto-unhidden. |

Only the keys above are read by the generator at build time. Downstream tooling may attach metadata (e.g. author notes), but you must not rely on it for rendering.

## Slide definition

Each entry in `slides` is an object with the following shape:

| Key | Type | Required | Description |
| --- | --- | --- | --- |
| `layout` | string | **Yes** | One of the archetype IDs listed below. Invalid IDs throw an error. |
| `data` | object | **Yes** | Fields specific to the chosen layout. Values are merged on top of `BUILDER_LAYOUT_DEFAULTS[layout]`. |

`layout` controls the rendering function. `data` overrides the defaults defined in [`sandbox/config/archetypes.json`](../config/archetypes.json). Empty objects are allowed when you want to keep every default.

### Shared field conventions

Most layouts accept the same enrichment keys:

* `title`: Human-readable heading for the slide stage.
* `imageUrl`: Optional background image URL applied by `createBaseLessonSlide`.
* `overlayColor`: CSS colour token (hex, rgb[a], hsl[a], or CSS variable) used with the overlay.
* `overlayOpacity`: Integer between `0` and `100`. Values above `0` trigger the overlay class; use `0` for transparent slides.
* `layoutIcon`: Font Awesome class string (e.g. `"fa-solid fa-person-chalkboard"`) rendered in the stage badge. When omitted the generator falls back to the archetype default where defined.
* Icon fields (e.g. `goalIcon`, `instructionsIcon`): Font Awesome classes shown inline with their respective content blocks. Use `fa-solid` tokens for reliable coverage.

Trim whitespace from all string values and avoid empty strings. Arrays should contain meaningful content only—remove placeholder items when you do not need them.

### Image placeholders

Any field that normally expects a URL may instead accept an object describing a Pexels search. The resolver recognises the following structure:

```jsonc
{
  "pexelsQuery": "students collaborating at laptops", // required
  "orientation": "landscape",           // optional API parameters
  "size": "large",
  "locale": "en-US",
  "alt": "Students working in a computer lab", // overrides automatic alt text
  "fallback": "https://example.com/fallback.jpg", // used if the API returns no results
  "includeCredit": true,
  "creditPrefix": "Photo",
  "credit": "Photo: Noor Community",
  "creditUrl": "https://noor.community/"
}
```

During deck generation `resolveMediaPlaceholders` swaps this object for a resolved asset URL, fills `alt` text when missing, and appends credit metadata unless `includeCredit` is `false`.

## Archetype catalogue

Each archetype exposes a dedicated subset of fields under `data`. Unless stated otherwise all text fields are strings and arrays preserve author-supplied ordering.

### `blank-canvas`

*No required fields.* Provide an empty `data` object or omit `data` entirely to use the untouched workspace.

### `learning-objectives`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | Slide heading.
| `goals` | array of strings | Yes | Up to three learning objectives. Remove unused slots.
| `communicativeGoal` | string | No | “So you can…” communicative target.
| `imageUrl`, `overlayColor`, `overlayOpacity` | see shared fields | No | Background styling.
| `goalIcon` | string | No | Bullet icon class.
| `communicativeGoalIcon` | string | No | Icon for the communicative goal line.
| `layoutIcon` | string | No | Stage badge icon.

### `model-dialogue`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | Dialogue title.
| `instructions` | string | No | Student directions shown under the title.
| `turns` | array of `{ speaker, line }` objects | Yes | Ordered dialogue pairs.
| `audioUrl` | string | No | Optional media player source.
| `imageUrl`, `overlayColor`, `overlayOpacity` | shared | No | Background styling.
| `instructionsIcon` | string | No | Inline icon for the instructions block.
| `layoutIcon` | string | No | Stage badge icon.

### `interactive-practice`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | Practice heading.
| `activityType` | string | Yes | Badge label that appears beside the title.
| `instructions` | string | Yes | Prompt or task description.
| `questions` | array of question objects | Yes | Each object supports `prompt` (string). Optional `options` (array of strings) and `answer` (string) for keyed items.
| `instructionsIcon`, `activityTypeIcon` | string | No | Icons for the respective headers.
| `layoutIcon` | string | No | Stage badge icon.

### `communicative-task`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | Task headline.
| `preparation`, `performance`, `scaffolding` | arrays of strings | Yes | Ordered task steps for each section.
| `imageUrl`, `overlayColor`, `overlayOpacity` | shared | No | Background styling.
| `preparationIcon`, `performanceIcon`, `scaffoldingIcon` | string | No | Icons for each column.
| `layoutIcon` | string | No | Stage badge icon.

### `pronunciation-focus`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | Slide heading.
| `target` | string | Yes | Pronunciation focus description.
| `words`, `sentences`, `practice` | arrays of strings | Yes | Word list, sample sentences, and practice moves.
| `imageUrl`, `overlayColor`, `overlayOpacity` | shared | No | Background styling.
| `targetIcon`, `wordsIcon`, `sentencesIcon`, `practiceIcon` | string | No | Icons for each subsection.
| `layoutIcon` | string | No | Stage badge icon.

### `reflection`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | Reflection heading.
| `prompts` | array of strings | Yes | Reflection questions or stems.
| `imageUrl`, `overlayColor`, `overlayOpacity`, `promptsIcon`, `layoutIcon` | shared/icon | No | Styling and icon hooks.

### `grounding-activity`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | Activity heading.
| `subtitle` | string | No | Supporting context line.
| `steps` | array of strings | Yes | Ordered activity steps.
| `imageUrl`, `overlayColor`, `overlayOpacity`, `stepsIcon`, `layoutIcon` | shared/icon | No | Styling and icon hooks.

### `topic-introduction`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | Topic heading.
| `hook`, `context`, `essentialQuestion` | strings | Yes | Lead-in sections.
| `keyVocabulary` | array of strings | No | Highlighted vocabulary list.
| `imageUrl`, `overlayColor`, `overlayOpacity`, icon fields (`hookIcon`, `contextIcon`, etc.), `layoutIcon` | shared/icon | No | Styling and icon hooks.

### `guided-discovery`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes |
| `context` | string | No |
| `discoveryPrompts`, `noticingQuestions` | arrays of strings | Yes |
| `sampleLanguage` | array of strings | No |
| `imageUrl`, `overlayColor`, `overlayOpacity`, icon fields, `layoutIcon` | shared/icon | No |

### `creative-practice`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes |
| `brief` | string | Yes | Creative challenge summary.
| `materials`, `makingSteps`, `sharingOptions` | arrays of strings | Yes | Subsection bullet lists.
| `imageUrl`, `overlayColor`, `overlayOpacity`, icon fields, `layoutIcon` | shared/icon | No |

### `task-divider`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | Divider headline.
| `subtitle` | string | No | Optional context line.
| `timing`, `focus`, `actions` | arrays of strings | Yes | Breakdown lists for the divider columns.
| `imageUrl`, `overlayColor`, `overlayOpacity`, icon fields, `layoutIcon` | shared/icon | No |

### `task-reporting`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes |
| `goal` | string | Yes | Reporting objective.
| `prompts` | array of strings | Yes | Discussion prompts.
| `roles` | array of `{ label, value }` | Yes | Role assignments with display label and description.
| `evidence` | array of strings | No | Evidence checklist.
| `imageUrl`, `overlayColor`, `overlayOpacity`, icon fields, `layoutIcon` | shared/icon | No |

### `genre-deconstruction`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes |
| `genre`, `purpose` | strings | Yes |
| `features` | array of strings | Yes |
| `mentorText` | string | No | Description or link to model text.
| `imageUrl`, `overlayColor`, `overlayOpacity`, icon fields, `layoutIcon` | shared/icon | No |

### `linguistic-feature-hunt`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes |
| `sourceText` | string | No | Optional excerpt.
| `features` | array of strings | Yes | Items to hunt for in the text.
| `reflection` | array of strings | No | Follow-up prompts.
| `imageUrl`, `overlayColor`, `overlayOpacity`, icon fields, `layoutIcon` | shared/icon | No |

### `text-reconstruction`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes |
| `context` | string | No |
| `steps` | array of strings | Yes | Reconstruction process.
| `segments` | array of strings | Yes | Scrambled text pieces.
| `imageUrl`, `overlayColor`, `overlayOpacity`, icon fields, `layoutIcon` | shared/icon | No |

### `jumbled-text-sequencing`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes |
| `instructions` | string | No |
| `segments` | array of strings | Yes |
| `supportTips` | array of strings | No |
| `imageUrl`, `overlayColor`, `overlayOpacity`, icon fields, `layoutIcon` | shared/icon | No |

### `scaffolded-joint-construction`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes |
| `mentorFocus`, `sharedOutcome` | strings | No | Displayed in the header when provided.
| `teacherMoves`, `learnerMoves` | arrays of strings | Yes | Parallel bullet lists.
| `imageUrl`, `overlayColor`, `overlayOpacity`, icon fields, `layoutIcon` | shared/icon | No |

### `independent-construction-checklist`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes |
| `reminder` | string | No | Supporting statement.
| `checklist` | array of strings | Yes | Main checklist items.
| `stretchGoals` | array of strings | No | Optional extensions.
| `imageUrl`, `overlayColor`, `overlayOpacity`, icon fields, `layoutIcon` | shared/icon | No |

### `card-stack`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `pill` | string | Yes | Scenario or badge pill text.
| `pillIcon` | string | No | Icon shown inside the pill tag.
| `title` | string | Yes |
| `description` | string | No | Lead paragraph.
| `cards` | array of `{ title, description }` | Yes | Ordered stack of cards. Keep between three and five for best layout balance.
| `cardIcon` | string | No | Icon placed beside each card title.
| `layoutIcon` | string | No | Stage badge icon.

### `pill-with-gallery`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `pill` | string | Yes | Scenario or badge label.
| `pillIcon` | string | No | Icon inside the pill.
| `title` | string | Yes |
| `description` | string | No | Lead paragraph.
| `gallery` | array of gallery objects | Yes | Each object supports `image` (URL or placeholder), `alt`, `caption`, plus optional `credit`/`creditUrl`.
| `itemIcon` | string | No | Optional icon prepended to gallery captions.
| `layoutIcon` | string | No | Stage badge icon.

## Validation checklist

Before running the generator or shipping a model-produced brief:

1. Confirm every slide defines a supported `layout` string.
2. Ensure `overlayOpacity` values are integers in `[0, 100]` (round as needed).
3. Remove empty strings and placeholder bullets from arrays.
4. When using image placeholders, include a `pexelsQuery` and supply a Pexels API key at render time.
5. Verify icon tokens use valid Font Awesome classes (`fa-solid` family recommended).
6. For narrative-to-JSON conversions, read back the brief to confirm the slide order matches the intended lesson flow.

Keeping briefs within these constraints guarantees `create-deck.mjs` can render the lesson without manual intervention.
