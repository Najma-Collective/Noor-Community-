# Lesson deck schema quick reference

This guide summarises the contract defined by [`lesson-deck.schema.json`](./lesson-deck.schema.json). Use it when crafting deck
 manifests or reviewing JSON exports. Field names mirror the schema and reference the slide archetype catalogue under
 [`sandbox/docs/slide-archetypes.md`](../../sandbox/docs/slide-archetypes.md).

## Top-level object
- **Type:** object
- **Required fields:** `id`, `title`, `language`, `level`, `version`, `assets`, `slides`, `contributors`
- **Notes:** No additional properties beyond those listed below are allowed.

### Identification & catalogue metadata
| Field | Type | Description |
| --- | --- | --- |
| `id` | string (3-40 chars, `A-Z0-9._-`) | Stable deck identifier shared with CMS entries. |
| `slug` | string (kebab-case) | Optional route-safe slug used by sandbox tooling. |
| `title` | string | Display title for the deck cover. |
| `subtitle` | string | Optional supporting headline. |
| `description` | localizedRichText | Marketing summary or blurb. |
| `language` | string (`en`, `en-GB`, etc.) | ISO 639-1 language code. |
| `level` | enum (`A1` … `C1`) | CEFR-aligned proficiency level. |
| `subject` | string | Curriculum category (e.g. *Global Civics*). |
| `theme` | string | Visual or narrative theme cueing media choices. |
| `estimated_duration_minutes` | integer (5-480) | Facilitator run-time estimate. |
| `tags` | array<string> | Keywords surfaced in search/filter UI. |
| `learning_objectives` | array<localizedRichText> | Ordered list of lesson objectives. |
| `notes` | localizedRichText | Optional facilitator prep notes. |

### Contributors & workflow
| Field | Type | Description |
| --- | --- | --- |
| `contributors` | array<object> | At least one author/editor. Each object requires `name` and may include `role`, `organisation`, and `email`. |
| `review_notes` | localizedRichText | Outstanding review issues or QA comments. |
| `release_status` | enum (`draft`, `in_review`, `approved`, `published`) | Workflow stage. |
| `release_date` | string (date) | Planned publication date. |

### Assets
| Field | Type | Description |
| --- | --- | --- |
| `assets.cover_image` | mediaAsset (`type: image`) | Required hero artwork for the cover. |
| `assets.thumbnail` | mediaAsset (`type: image`) | Optional square thumbnail. |
| `assets.hero_video` | mediaAsset (`type: video`/`iframe`) | Optional motion background. |
| `assets.downloads` | array<object> | Optional downloadable files with `label`, `href`, and optional `file_type`. |
| `assets.brand_palette` | object | Optional colour swatches keyed by `primary`, `secondary`, `accent`. |

`mediaAsset` objects specify:
- `type`: enum `image`, `video`, `audio`, `document`, `iframe`, `external`
- `src`: URI or relative asset path
- Optional `alt`, `caption`, `transcript`, `credit`, and `placeholder` marker

### Accessibility & glossary
| Field | Type | Description |
| --- | --- | --- |
| `accessibility.summary` | localizedRichText | Facilitator briefing for inclusive delivery. |
| `accessibility.audio_description` | localizedRichText | Global description of media-heavy slides. |
| `accessibility.pronunciation_glossary` | array<object> | Terms with phonetic support and optional notes. |
| `glossary` | array<object> | Learner vocabulary entries (`term`, `definition`, optional `pronunciation`). |

### Slides array
- **Type:** array of slide objects
- **Each slide requires:** `slug`, `title`, `archetype`, `data`
- **`archetype`:** one of the 16 catalogue IDs exported in `sandbox/docs/slide-archetypes.json`
- **`objective_refs`:** optional array of numeric references that map to `learning_objectives`
- **`duration_hint`:** optional integer (1-45 minutes)

Every slide’s `data` object must match the corresponding archetype contract below.

## Archetype payloads
The requirements below mirror the `required_fields` audit in
[`slide-archetypes.json`](../../sandbox/docs/slide-archetypes.json). Use the linked sections of
[`slide-archetypes.md`](../../sandbox/docs/slide-archetypes.md) for layout previews, tokens, and styling guidance.

### `hero.overlay`
- **Required:** `background_media` (mediaAsset), `headline`, `subhead`
- **Optional:** `overlay_instructions`, `cta`
- **Usage:** Cover and transition slides with hero imagery.

### `centered.callout`
- **Required:** `headline`, `supporting_text` (array of rich text blocks)
- **Optional:** `illustration` mediaAsset, `accent_pill`
- **Usage:** Text-forward callouts anchored in the centre column.

### `centered.dialogue`
- **Required:** `headline`, `dialogue_box.lines` (array of dialogueLine objects)
- **Optional:** `dialogue_box.stage_direction`
- **Usage:** Scripted dialogues arranged around a modal centre stack.

### `pill.card-stack`
- **Required:** `pill_label`, `headline`, `card_body`
- **Optional:** `footnote`
- **Usage:** Hero pill with stacked paragraphs or list content.

### `pill.simple`
- **Required:** `pill_label`, `body_copy`
- **Usage:** Lightweight pill-forward cards for short instructions.

### `card.stack`
- **Required:** `headline`, `card_body`
- **Optional:** `media`
- **Usage:** Standard cards with text-rich content blocks.

### `grid.workspace`
- **Required:** `grid_slots` (array of draggable/note card definitions)
- **Usage:** `.split-grid`, `.note-card`, or `.gallery-grid` interactions from the archetype audit.

### `content.wrapper`
- **Required:** `content_blocks`
- **Usage:** Narrative sequences mixing paragraphs, lists, quotes, and media.

### `interactive.activity-card`
- **Required:** `pill_label`, `instructions` (array), `action_bar`
- **Optional:** `timer_hint`, `accessibility`
- **Usage:** Single-card interactive prompts with CTA buttons.

### `interactive.token-board`
- **Required:** `token_bank`, `dropzones`, `action_bar`, `feedback_region`
- **Optional:** `scoring`
- **Usage:** Drag-and-drop token board described in `slide-archetypes.md` *Token board* section.

### `interactive.token-table`
- **Required:** `token_bank`, `table_shell`, `action_bar`
- **Optional:** `accessibility.summary`
- **Usage:** Token-driven table completion tasks.

### `interactive.token-quiz`
- **Required:** `token_bank`, `quiz_prompts`
- **Optional:** `completion_copy`
- **Usage:** Token-based quizzes with validated answers.

### `interactive.quiz-feedback`
- **Required:** `quiz_items`, `feedback_region`
- **Optional:** `next_steps`
- **Usage:** Post-quiz review slides summarising learner performance.

### `interactive.audio-dialogue`
- **Required:** `audio_player.source`, `audio_player.duration_seconds`, `prompt_card.title`, `prompt_card.instructions`
- **Optional:** `audio_player.transcript`, `prompt_card.supporting_points`
- **Usage:** Listening comprehension experiences anchored by audio modules.

### `dialogue.grid`
- **Required:** `pill_label`, `prompt_cards`
- **Usage:** Multi-card dialogues arranged in a responsive grid.

### `dialogue.stack`
- **Required:** `dialogue_box.lines`
- **Optional:** `dialogue_box.title`, `dialogue_box.cta`
- **Usage:** Vertical stack dialogues with a single `.dialogue-box` shell.

## Supporting definitions
- `localizedText`: object with `text` and optional `locale`
- `localizedRichText`: either a plain string or an object with `format`, `content`, optional `locale`
- `actionBar`: primary CTA plus optional secondary/tertiary buttons and timer hints
- `dialogueLine`: `speaker`, optional `avatar` (mediaAsset), `text`, optional `pronunciation`
- `promptCard`: `title`, `prompt`, optional `support`, optional `media`
- `token`: `id`, `label`, optional `description` and `aria_label`
- `dropzone`: `id`, `title`, `accepts` token IDs, optional `instructions`
- `tableShell`: `columns` (array of headings) and `rows` (`prompt`, `cell_keys` referencing `token_bank`)
- `quizPrompt`: `id`, `question`, optional `stimulus`, `correct_token_ids`, optional `rationale`
- `feedbackRegion`: `positive`, `negative`, optional `neutral`

Refer back to the archetype audit for visual references, allowed modifiers, and legacy slide IDs when mapping legacy HTML to the JSON model.
