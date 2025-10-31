# Sandbox slide layout library

The sandbox slide builder now exposes the layouts that appear across the Noor Community B1, B2, and C1 decks so teachers can configure them without hand-editing HTML. Each layout ships with a curated default in `BUILDER_LAYOUT_DEFAULTS` and inherits the icon helpers and modifiers defined in `slide-templates.js`, meaning backgrounds, alignment, colours, icons, text areas, and media can all be adjusted directly from the builder UI.【F:sandbox/slide-templates.js†L1-L209】【F:sandbox/slide-templates.js†L212-L520】

| Layout key | Typical lesson purpose | Example slides |
| --- | --- | --- |
| `blank-canvas` | Full-bleed hero or custom canvas | B1/1/B1-1-1 slides 1 & 14【F:B1/1/B1-1-1/B1-1-1-b.html†L69-L90】【F:B1/1/B1-1-1/B1-1-1-b.html†L581-L602】 |
| `grounding-activity` | Arrival ritual / breathing | B1/1/B1-1-1 slide 2; B2/1/B2-1-1 slide 2【F:B1/1/B1-1-1/B1-1-1-b.html†L93-L126】【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1300-L1313】 |
| `learning-objectives` | Lesson goals snapshot | B1/1/B1-1-1 slide 3; B2/1/B2-1-1 slide 3【F:B1/1/B1-1-1/B1-1-1-b.html†L132-L160】【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1315-L1328】 |
| `topic-introduction` | Warm-up questions / hooks | B1/1/B1-1-1 slide 4; B2/1/B2-1-1 slide 4【F:B1/1/B1-1-1/B1-1-1-b.html†L162-L195】【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1331-L1344】 |
| `interactive-practice` | Matching, quizzes, token drops | B1/1/B1-1-1 slides 5 & 8; B2/1/B2-1-1 slide 8 and slide 18 practice grid【F:B1/1/B1-1-1/B1-1-1-b.html†L198-L292】【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1433-L1495】【F:B1/1/B1-1-1/B1-1-1-b.html†L696-L764】 |
| `model-dialogue` | Dialogue for analysis | B1/1/B1-1-1 slide 6; B2/1/B2-1-1 slide 9【F:B1/1/B1-1-1/B1-1-1-b.html†L295-L324】【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1501-L1519】 |
| `communicative-task` | Main task instructions + role cards | B1/1/B1-1-1 slides 15–16【F:B1/1/B1-1-1/B1-1-1-b.html†L604-L670】 |
| `pronunciation-focus` | Stress / intonation drills | B1/1/B1-1-1 slide 12; B2/1/B2-1-1 slide 11【F:B1/1/B1-1-1/B1-1-1-b.html†L524-L547】【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1550-L1566】 |
| `creative-practice` | Brainstorming or maker tasks | B2/1/B2-1-1 slide 7【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1400-L1428】 |
| `guided-discovery` & `genre-deconstruction` | Guided noticing of language / structure | B2/1/B2-1-1 slides 5 & 9–10【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1351-L1382】【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1501-L1534】 |
| `task-divider` | Section break before task cycle | B1/1/B1-1-1 slide 14; B2/1/B2-1-1 slide 14【F:B1/1/B1-1-1/B1-1-1-b.html†L581-L602】【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1630-L1638】 |
| `task-reporting` | Debrief or reporting prompts | B1/1/B1-1-1 slide 17【F:B1/1/B1-1-1/B1-1-1-b.html†L674-L692】 |
| `reflection` | Lesson close | B1/1/B1-1-1 slide 19; B2/1/B2-1-1 slide 19【F:B1/1/B1-1-1/B1-1-1-b.html†L800-L815】【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1798-L1808】 |
| `linguistic-feature-hunt`, `text-reconstruction`, `jumbled-text-sequencing`, `scaffolded-joint-construction`, `independent-construction-checklist` | Extended text work and writing scaffolds | B2/1/B2-1-1 slides 5, 9–13, 17–18【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1351-L1382】【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1501-L1624】【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1705-L1788】 |
| `card-stack` & `pill-with-gallery` | Recaps, resource stacks, scenario galleries | B1/1/B1-1-1 slide 18; B2/1/B2-1-1 slide 18 columns【F:B1/1/B1-1-1/B1-1-1-b.html†L696-L770】【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1705-L1768】 |

## Configuration highlights

Each layout inherits the same configuration surface:

- **Background control**: set or replace the `imageUrl`, `overlayColor`, and `overlayOpacity` fields per layout. Use a plain colour overlay (hex) plus an opacity between 0–1 to balance readability. The stage modifiers include top/centre alignment and overlay positioning for full-bleed designs.【F:sandbox/slide-templates.js†L26-L121】【F:sandbox/slide-templates.js†L123-L209】 
- **Content alignment**: toggle between start/centre/end for text-based layouts, or pick overlay alignment (`left`/`center`/`right`) for hero cards using the template modifiers section in the builder.【F:sandbox/slide-templates.js†L123-L209】 
- **Icon presets**: every layout field that expects a Font Awesome icon has a sensible placeholder so teachers can swap icons quickly. For example, `learningGoalIcon`, `taskPreparationIcon`, and `genreFeaturesIcon` are all exposed in the form with defaults that match the published decks.【F:sandbox/slide-templates.js†L26-L121】 
- **Dynamic text areas**: lists such as learning goals, scaffolding bullets, or reflection prompts are represented as arrays in the defaults so teachers can add or remove lines without editing markup.【F:sandbox/slide-templates.js†L212-L520】 
- **Media slots**: layouts like `interactive-practice`, `model-dialogue`, and `pill-with-gallery` surface structured collections (questions, turns, gallery images) that mirror the interactive cards used across the decks.【F:sandbox/slide-templates.js†L212-L520】【F:B1/1/B1-1-1/B1-1-1-b.html†L198-L292】 

## Using the defaults

Selecting any layout in the builder now seeds the form with the exemplar content summarised above, giving teachers an immediate template to adapt. Because these defaults are grounded in the live Noor Community decks, the visual language stays consistent while still allowing full control over:

- Number of text blocks (e.g., add or remove goals, prompts, or scaffolding lines).
- Activity modules (matching, quizzes, token drops) from the interactive practice layout.
- Image swaps via direct URLs or the integrated Pexels search, using the shared API key provided to the sandbox.【F:sandbox/int-mod.js†L9169-L9211】 
- Iconography and colour accents to match class themes.

Refer back to the table above whenever you need the slide number that inspired each template. The builder defaults keep those structures but expose every editable field in a single panel, so you can re-colour, rename, or completely rewrite the content in minutes while keeping the deck’s layout fidelity.
