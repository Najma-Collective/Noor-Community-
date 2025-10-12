# Organic Sage Slide Deck Guide

This guide explains how to author interactive lesson decks that follow the "Organic Sage" aesthetic used in **B2-1-1 Strategic Planning**. It covers the design language, reusable components, and a structured schema for lesson plans so designers can brief developers or generate decks automatically.

## 1. Design Language Overview

### 1.1 Visual Identity
- **Palette**: Sage greens (`--primary-sage`, `--secondary-sage`, `--tertiary-sage`), warm neutrals (`--warm-cream`, `--soft-white`), and deep forest accents (`--forest-shadow`, `--deep-forest`).
- **Typography**: `Questrial` for headings and UI chrome; `Nunito` for body text.
- **Shadows & radii**: Rounded corners (`16–20px`) and layered drop-shadows (`--shadow-1`, `--shadow-2`, `--shadow-glow`) for soft depth.
- **Texture**: Light gradients and radial highlights in the workspace background to keep the deck grounded without being distracting.

### 1.2 Layout System
- **Viewport**: Slides live inside a 16:9 stage with generous padding (`--stage-pad`). The stage scrolls vertically (`overflow-y: auto`) so dense activities never clip.
- **Grid**: A 12-column CSS grid (`.grid-container`) powers responsive layouts. Use utility classes such as `.col-span-6`, `.col-span-12`, `.align-self-center`, etc.
- **Cards**: Content blocks with background blends and subtle borders. Reusable modifiers include `.card-full-height` (stretch), `.dialogue-box` (transcripts), `.matching-option` or `.mc-card` (interactive inputs).

### 1.3 Iconography & Imagery
- Icons: Font Awesome 6 icons paired with `pill` badges for section labels.
- Photography: Source bright, high-resolution imagery from [Pexels](https://www.pexels.com/). Use the shared API key (`ntFmvz0n4RpCRtHtRVV7HhAcbb4VQLwyEenPsqfIGdvpVvkgagK2dQEd`) during prototyping. Store the selected URL and alt text in the lesson schema.

## 2. Lesson Plan Schema

Designers can supply lesson data as JSON (or YAML with equivalent keys). The generator consumes the schema and renders HTML/CSS components.

```json
{
  "meta": {
    "id": "b2-1-1",
    "title": "Strategic Planning in the NGO Sector",
    "level": "B2",
    "durationMinutes": 90,
    "theme": "Organic Sage"
  },
  "assets": {
    "heroImage": {
      "pexelsId": 3184418,
      "url": "https://images.pexels.com/...",
      "alt": "Team collaborating on a project"
    },
    "audio": [
      {
        "id": "ngo-recycling-discussion",
        "label": "Fatima & Yousef Discuss Recycling",
        "src": "assets/audio/ngo-recycling-discussion.mp3"
      }
    ]
  },
  "slides": [
    {
      "type": "title",
      "headline": "NGO Strategy: From Planning to Partnership",
      "subtitle": "B2 English Lesson",
      "objectives": ["Discuss strategic planning", "Negotiate partnerships"],
      "heroImage": "heroImage"
    },
    {
      "type": "objectives",
      "title": "Today's Goals",
      "items": [
        "Define key NGO vocabulary",
        "Use past tenses for project backstories",
        "Apply sentence stress to data",
        "Collaborate on a strategic recommendation"
      ]
    },
    {
      "type": "matching",
      "id": "vocab-1",
      "layout": "two-column",
      "prompt": "Match each NGO term to its definition (terms 1–5).",
      "terms": [
        {"id": 1, "label": "SWOT Analysis"},
        {"id": 2, "label": "Logframe"},
        {"id": 3, "label": "Baseline Data"},
        {"id": 4, "label": "Advocacy"},
        {"id": 5, "label": "Capacity Building"}
      ],
      "definitions": [
        {"match": 1, "text": "Study of strengths, weaknesses, opportunities, threats."},
        {"match": 2, "text": "Matrix connecting goals, activities, outcomes."},
        {"match": 3, "text": "Data gathered at project launch."},
        {"match": 4, "text": "Building public support for a policy."},
        {"match": 5, "text": "Strengthening an organisation's skills."}
      ]
    },
    {
      "type": "matching",
      "id": "vocab-2",
      "layout": "two-column",
      "prompt": "Match each NGO term to its definition (terms 6–10).",
      "terms": [
        {"id": 6, "label": "Conservation"},
        {"id": 7, "label": "Carbon Footprint"},
        {"id": 8, "label": "Watershed"},
        {"id": 9, "label": "Grassroots"},
        {"id": 10, "label": "Monitoring & Evaluation"}
      ],
      "definitions": [
        {"match": 6, "text": "Protecting natural resources."},
        {"match": 7, "text": "Total greenhouse gas output."},
        {"match": 8, "text": "Land area dividing water flow."},
        {"match": 9, "text": "Community-led movement."},
        {"match": 10, "text": "Tracking progress and outcomes."}
      ]
    },
    {
      "type": "stress-matching",
      "id": "stress-1",
      "prompt": "Match sentences 1–5 with their implied meaning.",
      "sentences": [
        {"id": 1, "text": "We need to fund the school project.", "stress": "We"},
        {"id": 2, "text": "We need to fund the school project.", "stress": "fund"},
        {"id": 3, "text": "We need to fund the school project.", "stress": "school"},
        {"id": 4, "text": "Only ten families participated.", "stress": "Only ten"},
        {"id": 5, "text": "Only ten families participated.", "stress": "participated"}
      ],
      "meanings": [
        {"match": 1, "text": "Not another group, but us."},
        {"match": 2, "text": "Provide money, not just words."},
        {"match": 3, "text": "Fund this specific project."},
        {"match": 4, "text": "Participation was disappointingly low."},
        {"match": 5, "text": "Attendance was high, engagement was low."}
      ]
    }
    // ... additional slide objects ...
  ]
}
```

### Required Keys
- `meta`: Identifies the lesson and sets deck-level options (title, level, theme, etc.).
- `assets.heroImage`: Reference imagery for the opening slide. Provide both `pexelsId` and a fallback `url`.
- `slides`: Ordered array of slide descriptors. Each descriptor must include `type` plus layout-specific fields. Use consistent IDs (e.g., `vocab-1`) for cross-referencing.

### Supported `type` Values
| Type              | Purpose                                         | Required Fields |
|-------------------|-------------------------------------------------|-----------------|
| `title`           | Hero slide with image and summary               | `headline`, `subtitle`, optional `objectives`, `heroImage` |
| `objectives`      | Bullet or checklist aims                        | `title`, `items[]` |
| `prompt`          | Single reflection or question                   | `title`, `body` |
| `discussion`      | Multi-card prompts                              | `title`, `cards[]` (each with `heading`, `body`) |
| `matching`        | Vocabulary or concept matching                  | `prompt`, `terms[]`, `definitions[]` |
| `stress-matching` | Sentence stress matching activity               | `prompt`, `sentences[]`, `meanings[]` |
| `listening`       | Audio with transcript/imagery                   | `title`, `task`, `audioRef`, optional `transcript[]`, `imageRef` |
| `mc-grammar`      | Multiple-choice grammar checks                  | `prompt`, `items[]` (`stem`, `options[]`, `answer`) |
| `reporting`       | Data storytelling or briefing cards             | `title`, `notes[]`, optional `imageRef` |
| `task-board`      | Multi-column task instructions                  | `title`, `columns[]` |
| `review`          | Exit checklist or celebration                   | `items[]` |

> **Overflow rule:** When a data set would overflow the stage, split it across sequential slides (e.g., `matching` → `matching`). The scrollable stage prevents clipping, but smaller chunks improve legibility.

## 3. Authoring Workflow

1. **Outline the narrative**: Introduce, input, controlled practice, freer practice, main task, reflection.
2. **Populate the schema**: Define `meta`/`assets`, then enumerate slides. For interactive slides provide answer keys (`match`, `answer`). Reference media by ID.
3. **Validate**: Ensure IDs are unique, counts align (e.g., same number of terms and definitions), and strings avoid inline HTML.
4. **Generate**: Run the deck builder (e.g., `npm run build:deck lesson.json`). The tool maps `type` → HTML partials and injects tokens.
5. **QA**: Open the HTML, confirm long slides scroll, audio plays, and interactivity resets properly.

## 4. Accessibility & Interaction Notes
- Keyboard navigation uses arrow keys/spacebar; keep focus order logical.
- `.feedback-msg` elements use `aria-live="polite"`. Populate success/error copy in the schema (`successMessage`, `retryMessage`) for clarity.
- Maintain colour contrast (≥4.5:1) and concise copy blocks (<70 characters per line where possible).
- Reserve nested scroll containers for transcripts (e.g., `.dialogue-box`); the stage already scrolls.

## 5. Asset Sourcing Guidelines
- **Images**: Use the Pexels API, then cache the final URL and alt text in `assets.heroImage` or slide-level `imageRef` entries.
- **Audio**: Store lesson audio under `assets/audio/`. Reference by `audioRef`.
- **Icons**: Document which Font Awesome icons are used per slide in the schema to simplify audits.

## 6. Version Control & Iteration
- Commit the source schema alongside the rendered HTML for traceability.
- Update this README when introducing new slide `type` values or global design tokens.
- Keep class names stable (`.matching-wrapper`, `.mc-card`, `.activity-actions`) so shared JavaScript continues to function.

---

Following this guide keeps Organic Sage decks consistent, accessible, and easy to generate from structured lesson plans.
