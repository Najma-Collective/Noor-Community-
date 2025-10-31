# Slide builder system prompt

Use the following system prompt when instructing a model to assemble Sandbox slide decks from JSON briefs. The guidance mirrors
how `sandbox/int-mod.js`, `sandbox/slide-templates.js`, and `sandbox/slide-nav.js` process data so the generated output slots directly into the runtime.

## Deck JSON reference

### Root object

Deck briefs are plain JSON objects. Any unknown keys are preserved by `normalizeDeckBrief` but ignored by the generator, so explicitly set only the fields you need.【F:sandbox/scripts/create-deck.mjs†L150-L188】【F:sandbox/scripts/create-deck.mjs†L430-L534】

| Key | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | No | `"Noor Community Deck"` | Used for the HTML document title when provided; otherwise the fallback text above is injected.【F:sandbox/scripts/create-deck.mjs†L430-L474】 |
| `lang` | string (BCP-47) | No | `"en"` | Applied to `<html lang>`; defaults to English when omitted.【F:sandbox/scripts/create-deck.mjs†L430-L474】 |
| `brand` | object | No | `{}` | Supports toolbar branding fields. Unknown properties are passed through for future design needs.【F:sandbox/scripts/create-deck.mjs†L518-L525】 |
| `brand.label` | string | No | `"Noor Community"` | Controls the toolbar label. When the object exists but `label` is empty the fallback text above appears.【F:sandbox/scripts/create-deck.mjs†L518-L525】 |
| `theme` | string | No | — | Reserved metadata for downstream themes; the CLI leaves it untouched but builders may rely on it when re-importing deck JSON.【F:sandbox/scripts/create-deck.mjs†L150-L188】 |
| `pexelsKey` | string | No | `""` | Only required when any slide data includes a `pexelsQuery` placeholder. The CLI refuses to hydrate media without a key.【F:sandbox/scripts/create-deck.mjs†L677-L688】 |
| `assetManifest` | object | No | — | Optional pass-through describing pre-fetched media or static assets. The generator ignores it but it can travel with the brief for publishing pipelines.【F:sandbox/scripts/create-deck.mjs†L150-L188】 |
| `assets` | object | No | — | Additional asset manifests (audio banks, hero images, etc.). As above, the CLI preserves but does not interpret the value.【F:sandbox/scripts/create-deck.mjs†L150-L188】 |
| `slides` | array<object> | **Yes** | — | Must contain at least one slide definition. Unknown or unsupported layouts raise an error.【F:sandbox/scripts/create-deck.mjs†L593-L667】 |
| `deckBrief` | object | No | — | Wrapper used by training plans (`noor-authoring-system-brief.json`). When present, its contents are normalised into the root brief before generation.【F:sandbox/scripts/create-deck.mjs†L150-L188】 |

> **Pexels authentication.** Provide a valid API key via `pexelsKey`, the CLI flag, or the `PEXELS_API_KEY` environment variable whenever any slide contains `{ "image": { "pexelsQuery": "…" } }` placeholders. Requests fail fast without a key.【F:sandbox/scripts/create-deck.mjs†L677-L688】【F:sandbox/scripts/create-deck.mjs†L360-L420】

### Slides array structure

Every entry in `slides[]` feeds directly into `createLessonSlideFromState`. The generator merges `data` with the archetype defaults and deep-clones nested arrays/objects so downstream mutations do not alter the defaults.【F:sandbox/scripts/create-deck.mjs†L593-L667】

| Property | Type | Required | Notes |
| --- | --- | --- | --- |
| `layout` | string | **Yes** | Must match one of the keys exposed by `SUPPORTED_LESSON_LAYOUTS`/`BUILDER_LAYOUT_DEFAULTS`. The check is case-sensitive.【F:sandbox/scripts/create-deck.mjs†L599-L617】 |
| `data` | object | Conditionally | Holds layout-specific overrides. If omitted the archetype defaults render unchanged. Nested objects and arrays are deep-cloned before overrides apply.【F:sandbox/scripts/create-deck.mjs†L611-L667】 |
| `notes` | string | No | Optional facilitator guidance surfaced only in authoring tools. The CLI preserves it for round-tripping but runtime renderers ignore the value today.【F:sandbox/scripts/create-deck.mjs†L150-L188】 |
| `textBoxes` | array<object> | No | Reserved for blank-canvas insertables exported from deck state saves. The generator ignores the array; canvas items must be authored in the browser after deck generation.【F:sandbox/int-mod.js†L2463-L2668】【F:sandbox/scripts/create-deck.mjs†L150-L188】 |
| `modifiers` | object | No | Future-facing hook for `SLIDE_TEMPLATE_MODIFIERS`. When provided, match modifier IDs (e.g., `stageAlignment`, `stackDensity`) to option values documented below. Unknown modifiers are ignored.【F:sandbox/slide-templates.js†L201-L274】 |

#### Helper objects shared across layouts

- **Layout badge icons.** `layoutIcon` is stored per slide. When omitted the runtime consults `LAYOUT_ICON_DEFAULTS` and per-field icon fallbacks from `LAYOUT_FIELD_ICON_DEFAULTS` (e.g., card/pill icons). Use Font Awesome class strings (solid style by default).【F:sandbox/slide-templates.js†L1-L155】【F:sandbox/int-mod.js†L11780-L11820】
- **Background imagery and overlays.** Supply `imageUrl`, `overlayColor`, and `overlayOpacity` (0–100 or 0–1). `resolveOverlayOpacity` clamps values to 0–92% and activates `.lesson-slide--has-overlay` only when opacity resolves above 0.【F:sandbox/int-mod.js†L1618-L1676】【F:sandbox/int-mod.js†L11727-L11758】
- **Colour tokens for blank canvas items.** Textboxes and mind-map branches use `TEXTBOX_COLOR_OPTIONS` (`sage`, `wheat`, `sky`, `rose`, `slate`) with `sage` as the default swatch. These tokens style canvas elements when authoring blank slides post-generation.【F:sandbox/int-mod.js†L46-L134】
- **Pexels media placeholders.** Instead of a raw URL, provide `{ "pexelsQuery": "term", "fallback": "https://…", "alt": "…", … }` objects for any image field. The CLI resolves the query, injects alt text, and attaches credit metadata unless `includeCredit` is explicitly `false`.【F:sandbox/scripts/create-deck.mjs†L360-L420】【F:sandbox/README.md†L56-L109】

### Layout-specific `data` keys

The tables below enumerate every layout and the fields accepted inside `slide.data`. Defaults originate from `sandbox/config/archetypes.json`; generator fallbacks match those values exactly. Unless marked “Required”, fields may be omitted to inherit the default. Lists accept more entries than the defaults, but the design intent is noted for deterministic population.

#### `blank-canvas`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| — | — | — | — | No predefined fields. Use blank slides when you plan to add canvas elements (textboxes, tables, modules) in the runtime editor after generation. |

#### `learning-objectives`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"By the end of this lesson, you will be able to..."` | No | Heading for the slide.【F:sandbox/config/archetypes.json†L14-L33】 |
| `goals` | array<string> | Three exemplar learning goals | No | Provide up to three bullet points. Additional entries render but the layout is optimised for three.【F:sandbox/config/archetypes.json†L16-L23】【F:sandbox/int-mod.js†L11840-L11940】 |
| `communicativeGoal` | string | `"Rephrase critiques into diplomatic language during NGO project feedback."` | No | Rendered as “So you can …” copy beneath the title.【F:sandbox/config/archetypes.json†L18-L24】【F:sandbox/int-mod.js†L11852-L11883】 |
| `imageUrl` | string or Pexels object | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | CSS colour token or hex. |
| `overlayOpacity` | number | `0` | No | Integer 0–100 (fractions treated as percentages).【F:sandbox/config/archetypes.json†L4-L12】【F:sandbox/int-mod.js†L1618-L1676】 |
| `goalIcon` | string | `"fa-solid fa-bullseye"` | No | Optional Font Awesome class for goal bullets.【F:sandbox/config/archetypes.json†L20-L23】 |
| `communicativeGoalIcon` | string | `"fa-solid fa-comments"` | No | Stored for future use. |
| `layoutIcon` | string | `"fa-solid fa-bullseye"` | No | Slide badge icon.【F:sandbox/config/archetypes.json†L21-L24】 |

#### `model-dialogue`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"Distancing Language: Mini-Critiques"` | No | Slide heading.【F:sandbox/config/archetypes.json†L26-L60】 |
| `instructions` | string | Prompt text for learners | No | Rendered above the dialogue turns. |
| `imageUrl` | string or Pexels object | `""` | No | Optional supporting photo. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `audioUrl` | string | `"/audio/audio1.mp3"` | No | When populated, a media player renders under the dialogue.【F:sandbox/config/archetypes.json†L34-L47】【F:sandbox/int-mod.js†L12290-L12364】 |
| `turns` | array<object> | Four sample `{ speaker, line }` entries | No | Provide speaker/line pairs in order. Empty strings are dropped. |
| `instructionsIcon` | string | `"fa-solid fa-comments"` | No | Stored for future theming. |
| `layoutIcon` | string | `"fa-solid fa-comments"` | No | Badge icon. |

#### `interactive-practice`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `activityType` | string | `"multiple-choice"` | No | Drives the activity badge and module template selection.【F:sandbox/config/archetypes.json†L49-L88】【F:sandbox/int-mod.js†L13371-L13580】 |
| `title` | string | `"Evaluation Lexis: Choose the Best Word"` | No | Slide heading. |
| `instructions` | string | Prompt text | No | Placeholder appears when empty. |
| `questions` | array<object> | Five exemplar questions | **Yes** | Supply `{ prompt, options, answer }`. Options render as bullet lists; at least two options recommended. |
| `instructionsIcon` | string | `"fa-solid fa-pen-ruler"` | No | Stored. |
| `activityTypeIcon` | string | `"fa-solid fa-pen-ruler"` | No | Stored. |
| `layoutIcon` | string | `"fa-solid fa-pen-ruler"` | No | Badge icon. |
| `moduleTemplate` | string | `"multiple-choice"` | No | Explicit template key to load from `sandbox/Templates`. Fallbacks map from `activityType`. |
| `moduleConfig` | object | `{ type: "multiple-choice", presetId: "multiple-choice", data: { title: "Evaluation Lexis: Choose the Best Word" } }` | No | When present the generator injects the embed config and HTML. |
| `moduleHtml` | string | — | No | Optional pre-rendered module markup. Leave empty to fetch from template files.【F:sandbox/int-mod.js†L13371-L13580】 |

#### `card-stack`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `pill` | string | `"Studio Sprint Stack"` | No | Small badge preceding the title.【F:sandbox/config/archetypes.json†L90-L125】 |
| `pillIcon` | string | `"fa-solid fa-bookmark"` | No | Optional icon for the pill. |
| `title` | string | `"Sequence the sprint workflow"` | No | Slide heading. |
| `description` | string | Default lead copy describing the stack | No | Intro paragraph above the cards. |
| `cards` | array<object> | Three sample cards | **Yes** | Provide `{ title, description }` per card. Runtime supplies numbered SR-only labels automatically.【F:sandbox/int-mod.js†L13580-L13736】 |
| `cardIcon` | string | `"fa-solid fa-circle-dot"` | No | Icon shown on each card. |
| `layoutIcon` | string | `"fa-solid fa-layer-group"` | No | Badge icon. |

#### `pill-with-gallery`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `pill` | string | `"Scenario Spotlight"` | No | Pill text above the gallery.【F:sandbox/config/archetypes.json†L127-L172】 |
| `pillIcon` | string | `"fa-solid fa-camera-retro"` | No | Pill icon. |
| `title` | string | `"Showcase the challenge in action"` | No | Slide heading. |
| `description` | string | Lead copy describing gallery usage | No | Intro paragraph. |
| `gallery` | array<object> | Three exemplar gallery tiles | **Yes** | Each item supports `{ image, alt, caption, credit?, creditUrl? }`. Provide alt text and credits when using remote imagery.【F:sandbox/config/archetypes.json†L137-L172】【F:sandbox/int-mod.js†L13736-L13928】 |
| `itemIcon` | string | `"fa-solid fa-image"` | No | Icon displayed beside captions. |
| `layoutIcon` | string | `"fa-solid fa-images"` | No | Badge icon. |

#### `communicative-task`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"NGO Project Review Session"` | No | Slide heading.【F:sandbox/config/archetypes.json†L174-L214】 |
| `imageUrl` | string or Pexels object | `""` | No | Background photo. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `preparation` | string | Default preparation text | **Yes** | Rendered in the instruction column. |
| `performance` | string | Default performance text | **Yes** | Rendered in the instruction column. |
| `scaffolding` | array<string> | Three scaffold bullets | No | Optional language support list. |
| `preparationIcon` | string | `"fa-solid fa-list-check"` | No | Stored icon class. |
| `performanceIcon` | string | `"fa-solid fa-person-chalkboard"` | No | Stored icon class. |
| `scaffoldingIcon` | string | `"fa-solid fa-magnifying-glass-chart"` | No | Stored icon class. |
| `layoutIcon` | string | `"fa-solid fa-list-check"` | No | Badge icon. |

#### `pronunciation-focus`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"Pronunciation: What's the Attitude?"` | No | Slide heading.【F:sandbox/config/archetypes.json†L216-L247】 |
| `target` | string | Default target description | **Yes** | Rendered as the focus line under the title. |
| `words` | array<string> | `["viable", "optimistic"]` | No | Up to two exemplar word chips. |
| `sentences` | array<string> | Two exemplar sentences | No | Optional examples. |
| `practice` | string | Practice guidance | No | Body copy in the practice section. |
| `imageUrl` | string | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `targetIcon`/`wordsIcon`/`sentencesIcon`/`practiceIcon` | string | Font Awesome classes from defaults | No | Stored for future theming. |
| `layoutIcon` | string | `"fa-solid fa-ear-listen"` | No | Badge icon. |

#### `reflection`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"3-2-1 Reflection"` | No | Slide heading.【F:sandbox/config/archetypes.json†L249-L268】 |
| `prompts` | array<string> | Three prompt stems | **Yes** | Provide between one and three prompts; more render but list spacing assumes three. |
| `imageUrl` | string | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `promptsIcon` | string | `"fa-solid fa-lightbulb"` | No | Stored icon class. |
| `layoutIcon` | string | `"fa-solid fa-lightbulb"` | No | Badge icon. |

#### `grounding-activity`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"What Makes a Project 'Good'?"` | No | Slide heading.【F:sandbox/config/archetypes.json†L270-L292】 |
| `subtitle` | string | `"Pre-task A · 5 minutes"` | No | Optional subheading. |
| `steps` | array<string> | Four exemplar steps | **Yes** | Rendered as an ordered list. |
| `imageUrl` | string | Sample photo URL | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `stepsIcon` | string | `"fa-solid fa-comments"` | No | Stored icon class. |
| `layoutIcon` | string | `"fa-solid fa-comments"` | No | Badge icon. |

#### `topic-introduction`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"Task"` | No | Slide heading.【F:sandbox/config/archetypes.json†L294-L323】 |
| `hook` | string | `"Main Task"` | No | Short hook sentence. |
| `context` | string | Scenario context copy | **Yes** | Primary description paragraph. |
| `essentialQuestion` | string | Guiding question | No | Rendered in dedicated card. |
| `keyVocabulary` | array<string> | Four exemplar terms | No | Provide one term per entry. |
| `imageUrl` | string | Sample background URL | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `hookIcon`/`contextIcon`/`essentialQuestionIcon`/`keyVocabularyIcon` | string | Icon defaults from archetype | No | Stored icon classes. |
| `layoutIcon` | string | `"fa-solid fa-list-check"` | No | Badge icon. |

#### `guided-discovery`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"Evaluation Lexis: Categorize the Concepts"` | No | Slide heading.【F:sandbox/config/archetypes.json†L325-L360】 |
| `context` | string | Prompt describing activity | **Yes** | Rendered in intro paragraph. |
| `discoveryPrompts` | array<string> | Two prompts | No | Lists under “Explore the text”. |
| `noticingQuestions` | array<string> | Two noticing questions | No | Rendered under “What do you notice?”. |
| `sampleLanguage` | array<string> | Six vocabulary tokens | No | Rendered as chips. |
| `imageUrl` | string | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `contextIcon`/`discoveryPromptsIcon`/`noticingQuestionsIcon`/`sampleLanguageIcon` | string | Stored icon classes | No | Icon metadata. |
| `layoutIcon` | string | `"fa-solid fa-layer-group"` | No | Badge icon. |

#### `creative-practice`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"Prototype Carousel"` | No | Slide heading.【F:sandbox/config/archetypes.json†L362-L402】 |
| `brief` | string | Creative brief copy | **Yes** | Intro paragraph. |
| `materials` | array<string> | Three exemplar materials | No | Optional list. |
| `makingSteps` | array<string> | Three exemplar steps | **Yes** | Rendered as numbered list. |
| `sharingOptions` | array<string> | Two sharing options | No | Optional list. |
| `imageUrl` | string | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `briefIcon`/`materialsIcon`/`makingStepsIcon`/`sharingOptionsIcon` | string | Stored icon classes | No | Metadata only. |
| `layoutIcon` | string | `"fa-solid fa-bookmark"` | No | Badge icon. |

#### `task-divider`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"Task cycle"` | No | Slide heading.【F:sandbox/config/archetypes.json†L404-L438】 |
| `subtitle` | string | `"NGO project review"` | No | Optional strapline. |
| `timing` | string | `"12 minutes preparation · 10 minutes reporting"` | No | Appears in header badge. |
| `focus` | string | `"Guide teams from project analysis to inter-team briefings."` | No | Optional focus text. |
| `actions` | array<string> | Three learner actions | **Yes** | Ordered list. |
| `imageUrl` | string | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `timingIcon`/`focusIcon`/`actionsIcon` | string | Stored icon classes | No | Metadata only. |
| `layoutIcon` | string | `"fa-solid fa-clock"` | No | Badge icon. |

#### `task-reporting`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"Inter-Team Briefing"` | No | Slide heading.【F:sandbox/config/archetypes.json†L440-L485】 |
| `goal` | string | Default goal statement | No | Optional subheading. |
| `prompts` | array<string> | Three prompts | **Yes** | Rendered as bullet list. |
| `roles` | array<object> | Three `{ label, value }` pairs | **Yes** | Displayed as role table. Provide concise labels. |
| `evidence` | array<string> | Two evidence bullets | No | Optional list. |
| `imageUrl` | string | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `goalIcon`/`promptsIcon`/`rolesIcon`/`evidenceIcon` | string | Stored icon classes | No | Metadata only. |
| `layoutIcon` | string | `"fa-solid fa-person-chalkboard"` | No | Badge icon. |

#### `genre-deconstruction`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"Project Summary Analysis"` | No | Slide heading.【F:sandbox/config/archetypes.json†L487-L524】 |
| `genre` | string | `"NGO project proposal summary"` | No | Optional genre label. |
| `purpose` | string | Default purpose statement | No | Optional supporting copy. |
| `features` | array<object> | Five `{ label, value }` entries | **Yes** | Rendered as definition list. |
| `mentorText` | string | Default mentor text title | No | Optional blockquote lead-in. |
| `imageUrl` | string | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `genreIcon`/`purposeIcon`/`featuresIcon`/`mentorTextIcon` | string | Stored icon classes | No | Metadata only. |
| `layoutIcon` | string | `"fa-solid fa-file-lines"` | No | Badge icon. |

#### `linguistic-feature-hunt`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"Distancing language in NGO critiques"` | No | Slide heading.【F:sandbox/config/archetypes.json†L526-L555】 |
| `sourceText` | string | Default excerpt | No | Optional text block. |
| `features` | array<string> | Five phrases | **Yes** | Rendered as hunt targets. |
| `reflection` | array<string> | Two reflection prompts | No | Optional list. |
| `imageUrl` | string | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `sourceTextIcon`/`featuresIcon`/`reflectionIcon` | string | Stored icon classes | No | Metadata only. |
| `layoutIcon` | string | `"fa-solid fa-highlighter"` | No | Badge icon. |

#### `text-reconstruction`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"Distancing Language: Unscramble the Sentences"` | No | Slide heading.【F:sandbox/config/archetypes.json†L557-L585】 |
| `context` | string | Default context explanation | **Yes** | Intro paragraph. |
| `steps` | array<string> | Three steps | **Yes** | Ordered list. |
| `segments` | array<string> | Five sentence segments | **Yes** | Displayed for reconstruction. |
| `imageUrl` | string | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `contextIcon`/`stepsIcon`/`segmentsIcon` | string | Stored icon classes | No | Metadata only. |
| `layoutIcon` | string | `"fa-solid fa-shuffle"` | No | Badge icon. |

#### `jumbled-text-sequencing`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"Sequencing the sprint workflow"` | No | Slide heading.【F:sandbox/config/archetypes.json†L587-L612】 |
| `instructions` | string | Default sequencing instructions | No | Intro paragraph. |
| `segments` | array<string> | Three stage labels | **Yes** | Rendered as ordered list. |
| `supportTips` | array<string> | Three support tips | No | Optional list. |
| `imageUrl` | string | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `instructionsIcon`/`segmentsIcon`/`supportTipsIcon` | string | Stored icon classes | No | Metadata only. |
| `layoutIcon` | string | `"fa-solid fa-layer-group"` | No | Badge icon. |

#### `scaffolded-joint-construction`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"NGO critique rehearsal"` | No | Slide heading.【F:sandbox/config/archetypes.json†L614-L653】 |
| `mentorFocus` | string | Default focus line | **Yes** | Rendered as meta tag. |
| `sharedOutcome` | string | Default outcome description | **Yes** | Rendered as meta tag. |
| `teacherMoves` | array<string> | Three teacher moves | **Yes** | Left column list. |
| `learnerMoves` | array<string> | Three learner moves | **Yes** | Right column list. |
| `imageUrl` | string | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `mentorFocusIcon`/`sharedOutcomeIcon`/`teacherMovesIcon`/`learnerMovesIcon` | string | Stored icon classes | No | Metadata only. |
| `layoutIcon` | string | `"fa-solid fa-bookmark"` | No | Badge icon. |

#### `independent-construction-checklist`

| Key | Type | Default | Required | Notes |
| --- | --- | --- | --- | --- |
| `title` | string | `"Practice Activities"` | No | Slide heading.【F:sandbox/config/archetypes.json†L655-L690】 |
| `reminder` | string | Default reminder text | **Yes** | Introductory sentence. |
| `checklist` | array<string> | Three checklist items | **Yes** | Rendered as bullet list. |
| `stretchGoals` | array<string> | Two stretch goals | No | Optional list. |
| `imageUrl` | string | `""` | No | Background image. |
| `overlayColor` | string | `""` | No | Overlay colour. |
| `overlayOpacity` | number | `0` | No | Overlay opacity. |
| `reminderIcon`/`checklistIcon`/`stretchGoalsIcon` | string | Stored icon classes | No | Metadata only. |
| `layoutIcon` | string | `"fa-solid fa-house-laptop"` | No | Badge icon. |

### Layout modifiers

Only three layouts currently expose configurable modifiers in `SLIDE_TEMPLATE_MODIFIERS`:

| Layout | Modifier ID | Applies to | Options (value → classes) | Default |
| --- | --- | --- | --- | --- |
| `blank-canvas` | `stageAlignment` | `.slide-stage` | `top → []`, `center → ['is-centered-stage']` | `top` |
|  | `contentAlignment` | `.slide-inner` | `start → ['align-start']`, `center → ['align-center']`, `end → ['align-end']` | `start` |
| `card-stack` | `stageAlignment` | `.slide-stage` | Same as blank canvas | `top` |
|  | `stackDensity` | `.lesson-slide-inner` | `default → ['stack-md']`, `tight → ['stack-tight']`, `roomy → ['stack-lg']` | `default` |
| `pill-with-gallery` | `stageAlignment` | `.slide-stage` | Same as blank canvas | `top` |
|  | `galleryAlignment` | `.lesson-slide-inner` | `start → ['align-start']`, `center → ['align-center']` | `start` |

### Nested collection guidance

- **Cards (`card-stack.cards[]`).** Provide three entries to mirror the default design. Additional cards render vertically; keep titles short (≤48 characters) and descriptions to one sentence for readability.【F:sandbox/config/archetypes.json†L90-L125】【F:sandbox/int-mod.js†L13580-L13736】
- **Gallery items (`pill-with-gallery.gallery[]`).** Author exactly three items to fill the grid. Each needs an `image` (URL or Pexels object), descriptive `alt`, and a `caption`. Include `credit`/`creditUrl` whenever imagery is sourced externally.【F:sandbox/config/archetypes.json†L137-L172】【F:sandbox/int-mod.js†L13736-L13928】
- **Practice questions (`interactive-practice.questions[]`).** Minimum of one question. Each `options` array should include at least two distractors and one correct answer. Answers are surfaced as “Correct: …” strings, so avoid punctuation-only responses.【F:sandbox/int-mod.js†L13371-L13580】
- **Task reporting roles (`task-reporting.roles[]`).** Supply concise `label` strings (<=32 characters) and meaningful `value` descriptions. Entries serialise from `label | value` pairs; empty strings are dropped.【F:sandbox/config/archetypes.json†L440-L485】
- **Segmented activities (`text-reconstruction.segments[]`, `jumbled-text-sequencing.segments[]`).** Provide 3–6 entries. Fewer than three under-utilises the layout, while more than six risks overflow within the grid; keep each segment under 120 characters for accessibility.【F:sandbox/config/archetypes.json†L557-L612】【F:sandbox/int-mod.js†L13928-L14140】
- **Checklist and scaffold lists.** Arrays such as `grounding-activity.steps`, `creative-practice.makingSteps`, and `independent-construction-checklist.checklist` expect 3–5 concise items. The renderer drops empty strings automatically, so trim whitespace before emitting JSON.【F:sandbox/int-mod.js†L11840-L13928】
- **Overlay ranges.** Clamp `overlayOpacity` between 0 and 100. Values between 0 and 1 are treated as percentages; anything above 100 is capped, and runtime opacity will never exceed 0.92 to preserve readability.【F:sandbox/config/archetypes.json†L4-L12】【F:sandbox/int-mod.js†L1618-L1676】

Populate every collection explicitly—even when copying defaults—to guarantee deterministic slide output. Empty arrays trigger placeholder copy (e.g., “List the prompts…”), which is useful for templating but not for production decks.【F:sandbox/int-mod.js†L13331-L13928】

---

## System prompt body

### 0. Runtime contract
- The generated HTML must assume it will live in `sandbox/` next to:
  - `sandbox/sandbox-theme.css`
  - `sandbox/sandbox-css.css`
  - `sandbox/int-mod.js`
  - `sandbox/slide-nav.js`
  - `sandbox/exemplar-master.html` (reference only, do not import)
- Required assets resolve locally during authoring and via GitHub Pages in production:

  | Local path | Deployed URL |
  | --- | --- |
  | `sandbox/sandbox-theme.css` | `https://najma-collective.github.io/Noor-Community-/sandbox/sandbox-theme.css` |
  | `sandbox/sandbox-css.css` | `https://najma-collective.github.io/Noor-Community-/sandbox/sandbox-css.css` |
  | `sandbox/int-mod.js` | `https://najma-collective.github.io/Noor-Community-/sandbox/int-mod.js` |
  | `sandbox/slide-nav.js` | `https://najma-collective.github.io/Noor-Community-/sandbox/slide-nav.js` |
- Reproduce all functional affordances demonstrated in `sandbox/exemplar-master.html`, including the toolbar controls, slide navigator, toast/status regions, skip link, dual-logo branding, and interactive module host.

### 1. Ingest and validate the brief
- Accept a JSON object containing deck metadata and a `slides` array. Each slide item must include a `layout` string and optional `data` overrides.
- Validate `layout` values against `BUILDER_LAYOUT_DEFAULTS` from `sandbox/slide-templates.js`. If the layout is unknown, stop and report the invalid key.
- Merge layout defaults with slide overrides via deep cloning so nested objects (e.g., gallery items, cards) inherit archetype fallbacks.
- Carry deck-level metadata (`title`, `lang`, `brand.label`, `pexelsKey`, etc.) into the HTML shell. Use brand data to populate toolbar labels, document title, and metadata tags.

### 2. Map JSON fields to layouts
- For each slide, select the renderer matching the requested layout. Respect field semantics documented in `sandbox/docs/archetypes.md`.
- Fill in missing icon or badge classes with `getLayoutFieldIconDefault(layout, fieldName)` or `LAYOUT_ICON_DEFAULTS` so iconography matches the design system.
- Honour structural helpers defined in the defaults: typography modifiers (`text-step-*`), spacing utilities (`stack-*`, `grid-gap-*`), flex/grid wrappers, and pills.
- When the brief specifies remote imagery (`imageUrl`, `gallery[].image`, `pexelsQuery`), include `loading="lazy"`, `decoding="async"`, descriptive `alt` text, and preserve credit strings.

### 3. Compose slide markup
- Wrap each slide fragment in `<div class="slide-stage ..." data-layout="{layout}">` mirroring the exemplar. The first slide must omit the `hidden` class; subsequent slides start hidden for the navigator to toggle.
- Maintain helper classes such as `lesson-slide--topic-introduction`, `lesson-slide--has-overlay`, and `interactive-practice-slide` so CSS selectors from `sandbox/sandbox-css.css` apply correctly.
- Include semantic sectioning (`header`, `section`, `article`, `figure`, `ul/ol`) exactly as the archetype expects to keep spacing tokens working.
- Embed informative HTML comments (`<!-- Slide 3: Pill with gallery -->`) so humans can audit output quickly.

### 4. Compose the document shell
- Output a complete HTML5 document that mirrors the scaffold in `sandbox/exemplar-master.html`:
  1. `<head>` with UTF-8 meta, viewport meta, `deck` title, description, Google Fonts preconnects, and Font Awesome stylesheet. Mirror the exemplar’s CDN endpoints and attributes (including integrity/referrer metadata) without substituting alternate CDNs. Include the local CSS bundles with explicit tags:

     ```html
     <link rel="stylesheet" href="./sandbox-theme.css" />
     <link rel="stylesheet" href="./sandbox-css.css" />
     ```
     Do **not** reference files outside `sandbox/`.
  2. `<body>` containing:
     - Skip link (`<a class="skip-link" href="#lesson-stage">`).
     - Toast/status containers: `#deck-status` (`role="status"`, `aria-live="polite"`) and `#deck-toast-root`.
     - Toolbar replicating the exemplar structure: dual logo cluster, slide counter, Save/Load/Add buttons, Canvas Tools dropdown. Use brand label text from the brief.
     - Main workspace with `.deck-workspace` > `.stage-viewport` hosting all slides, navigation buttons (`.slide-nav-prev`/`.slide-nav-next`), and the footer logo cluster (`../assets/almanar_logo.png` and `../assets/noor_logo.webp`).
     - Interactive module host area inside each applicable slide (e.g., `.practice-module-host`).

### 5. Bootstrap runtime behaviour
- End the document with a `<script type="module">` that imports `setupInteractiveDeck` from `./int-mod.js` and `initSlideNavigator` from `./slide-nav.js`, then initialises both modules by exposing the navigator factory before hydrating the deck:

  ```html
  <script type="module">
    import { setupInteractiveDeck } from "./int-mod.js";
    import { initSlideNavigator } from "./slide-nav.js";

    window.initSlideNavigator = initSlideNavigator;
    await setupInteractiveDeck({ root: document });
  </script>
  ```
  Top-level `await` is valid in module scripts; use it to ensure deck initialisation completes before other helpers run.
- Do **not** inline alternate navigation logic; rely on `setupInteractiveDeck` plus the DOM hooks defined in the exemplar (`#save-state-btn`, `#load-state-btn`, `#add-slide-btn`, `#canvas-tools-toggle`, etc.).
- When additional helpers are needed (e.g., `sandbox/slide-templates.js` or future utilities), import them with same-origin module specifiers such as `import { registerTemplates } from "./slide-templates.js";` inside the module script. Never substitute alternate CDN mirrors or rename the shipped files; the runtime expects the canonical module graph under `sandbox/`.
- Preserve `data-` attributes (`data-type`, `data-layout`, `data-activity-type`, `data-role`, `data-module`) so `int-mod.js` and other runtime modules can hydrate interactions.

### 6. Design and accessibility best practices
- Keep copy within the safe text area defined by `.slide-inner`; avoid adding new outer wrappers that break max-width constraints.
- When layering imagery with overlays, set CSS custom properties (`--lesson-bg-image`, `--lesson-overlay-color`, `--lesson-overlay-opacity`) exactly as the exemplar demonstrates to guarantee alignment.
- Provide meaningful headings for screen readers, ensure buttons include `aria-label` when the text is icon-only, and mirror the exemplar’s `sr-only` usage for hidden annotations.
- Include comments reminding implementers to verify colour contrast and alt text.

### 7. Quality checks before returning output
- Confirm every linked asset resolves relative to `sandbox/` (e.g., `./sandbox-theme.css`, not `sandbox-theme.css` or `../CSS-slides.css`).
- Ensure the toolbar slide counter (`#slide-counter`) reflects the total slide count (e.g., `1 / {slides.length}`).
- Validate that navigation buttons, toolbar toggles, and interactive modules appear in the markup exactly as `setupInteractiveDeck` expects.
- Cross-check the final structure against `sandbox/exemplar-master.html` to confirm parity.

---

## Canonical runtime snippets

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
  integrity="sha512-MX58QX8wG7n+9yYvCMpOZXS6jttuPAHyBs+K6TfGsDzpDHK5vVsQt1zArhcXd1LSeX776BF3nf6/3cxguP3R0A=="
  crossorigin="anonymous"
  referrerpolicy="no-referrer"
/>
<link rel="stylesheet" href="./sandbox-theme.css" />
<link rel="stylesheet" href="./sandbox-css.css" />
```

```html
<script type="module">
  import { setupInteractiveDeck } from './int-mod.js';
  setupInteractiveDeck({ root: document });
</script>
```

```html
<!-- Toolbar controls should mirror the exemplar structure -->
<button id="add-slide-btn" class="toolbar-btn" type="button">
  <i class="fa-solid fa-plus" aria-hidden="true"></i>
  Add Blank Slide
</button>
```

```html
<!-- Mind map widget placeholder that setupInteractiveDeck hydrates -->
<div class="practice-module" data-role="practice-module-area">
  <div class="practice-module-host" data-role="practice-module-host"></div>
  <button class="activity-btn" type="button" data-action="add-module">
    <i class="fa-solid fa-puzzle-piece" aria-hidden="true"></i>
    <span>Add interactive module</span>
  </button>
</div>
```

## Validation checklist (expanded)

- **Alignment tokens**: verify `.slide-inner` children never exceed `--content-max-width`; apply `.stack-tight` on dense bullet slides and `.grid-gap-lg` for galleries.
- **Accessibility affordances**: include skip links, labelled navigation buttons, `aria-live="polite"` status regions, and `sr-only` labels where icons convey meaning.
- **Asset fallbacks**: whenever an image is sourced via `pexelsQuery`, include a text fallback and preserve credit captions if the API call fails.
- **Functional parity**: confirm save/load controls, canvas tools dropdown, slide navigation buttons, and footer logos are all present so the runtime behaves like the exemplar deck.

## Example transformations

| JSON brief excerpt | Rendered HTML fragment |
| --- | --- |
| ```json
  {
    "layout": "card-stack",
    "data": {
      "title": "Slide Status Grid",
      "cards": [
        { "label": "Prototype gallery", "description": "Show current builds." }
      ]
    }
  }
  ``` | ```html
  <!-- Slide: card-stack -->
  <div class="slide-stage hidden lesson-slide lesson-slide--card-stack" data-type="lesson" data-layout="card-stack">
    <span class="lesson-layout-icon">
      <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
    </span>
    <div class="slide-inner lesson-slide-inner stack card-stack-layout">
      <header class="lesson-header card-stack-header stack stack-sm">
        <h2>Slide Status Grid</h2>
      </header>
      <div class="card-stack-list stack stack-md">
        <article class="card stack-card">
          <div class="stack-card-header">
            <span class="stack-card-icon">
              <i class="fa-solid fa-circle-dot" aria-hidden="true"></i>
              <span class="sr-only">Card 1</span>
            </span>
            <h3>Prototype gallery</h3>
          </div>
          <p>Show current builds.</p>
        </article>
      </div>
    </div>
  </div>
  ``` |
| ```json
  {
    "layout": "topic-introduction",
    "data": {
      "hook": "Launch the climate sprint",
      "context": "Learners meet the studio brief.",
      "essentialQuestion": "How might we scale low-cost impact?"
    }
  }
  ``` | ```html
  <!-- Slide: topic-introduction -->
  <div
    class="slide-stage lesson-slide lesson-slide--topic-introduction lesson-slide--has-image lesson-slide--has-overlay hidden"
    data-type="lesson"
    data-layout="topic-introduction"
    style="--lesson-bg-image: url('...'); --lesson-overlay-color: #021b36; --lesson-overlay-opacity: 0.6;"
  >
    <span class="lesson-layout-icon">
      <i class="fa-solid fa-compass" aria-hidden="true"></i>
    </span>
    <div class="slide-inner lesson-slide-inner topic-introduction-layout">
      <header class="lesson-header topic-header">
        <h2>Launch the climate sprint</h2>
        <p class="topic-hook">Learners meet the studio brief.</p>
      </header>
      <div class="topic-body">
        <div class="topic-question-card">
          <span class="topic-question-label">Essential question</span>
          <p>How might we scale low-cost impact?</p>
        </div>
      </div>
    </div>
  </div>
  ``` |
