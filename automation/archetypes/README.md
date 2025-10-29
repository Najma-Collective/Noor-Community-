# Slide Archetype Field Guide

This guide summarises every slide layout currently used across the exemplar deck and the level decks under `A1/`–`C1/`. Each section outlines the visual signature, content requirements, media affordances, accessibility considerations, and how the canvas maps onto the canonical `archetype` enum in `automation/schema/lesson-deck.schema.json`. Thumbnail links point to placeholder assets so design and AI tooling can drop in reference screenshots.

> **Schema parity:** All archetypes documented below are present in the schema enum. No additional layout names surfaced in the HTML crawl, so there are no missing or legacy schema entries to flag at this time.【F:automation/schema/lesson-deck.schema.json†L503-L827】

## hero.overlay (`hero.overlay`)
![hero.overlay thumbnail](thumbnails/hero-overlay.png "Replace with hero overlay capture")
- **Canonical snippet:** [JSON](examples/hero.overlay.json) → [HTML preview](html/hero.overlay.html) → [Screenshot](thumbnails/hero-overlay.png)
- **Usage guidance:** Open a deck with rich storytelling—pair the darkened overlay card with a high-impact background to set tone and context before diving into tasks.
- **Constraints:** Requires `background_media`, `headline`, and `subhead`; ensure hero media includes descriptive `alt` text and CTA labels remain concise for screen-reader clarity.
- **Visual signature:** Full-bleed background media with a darkened overlay card that carries the pill, headline, and subtitle.【F:sandbox/exemplar-master.html†L81-L104】
- **Required content:** Background media asset, hero headline, supporting subhead copy; optional overlay instructions or CTA per schema.【F:automation/schema/lesson-deck.schema.json†L503-L513】
- **Permitted media:** Remote images or video in `.bg-media`; overlay card can include icon pills and stacked lists.【F:sandbox/exemplar-master.html†L95-L125】
- **Accessibility notes:** Always provide descriptive `alt` text for the hero media and ensure overlay contrast remains AA compliant when swapping gradients.【F:sandbox/exemplar-master.html†L85-L93】

## centered.callout (`centered.callout`)
![centered.callout thumbnail](thumbnails/centered-callout.png "Replace with centered callout capture")
- **Canonical snippet:** [JSON](examples/centered.callout.json) → [HTML preview](html/centered.callout.html) → [Screenshot](thumbnails/centered-callout.png)
- **Usage guidance:** Surface a single inspirational quote or announcement—keep all elements centred so the call-to-action lands cleanly before a section break.
- **Constraints:** Provide `headline` text plus at least one `supporting_text` entry; optional illustration assets should carry accurate `alt` descriptions when informative.
- **Visual signature:** Icon-first slide with all content centered in the viewport, typically used to announce tasks or section breaks.【F:B2/1/B2-1-3/B2-1-3-b.html†L2229-L2234】
- **Required content:** Headline plus at least one supporting text block; optional accent pill or illustration according to schema.【F:automation/schema/lesson-deck.schema.json†L515-L528】
- **Permitted media:** Large Font Awesome icon or lightweight illustration; keep layout uncluttered so the centred typography reads clearly.
- **Accessibility notes:** Treat centred paragraphs as short, scannable statements and ensure icons include `aria-hidden="true"` when decorative to avoid double announcing content.

## centered.dialogue (`centered.dialogue`)
![centered.dialogue thumbnail](thumbnails/centered-dialogue.png "Replace with centered dialogue capture")
- **Canonical snippet:** [JSON](examples/centered.dialogue.json) → [HTML preview](html/centered.dialogue.html) → [Screenshot](thumbnails/centered-dialogue.png)
- **Usage guidance:** Stage a model conversation or prompt—anchor the headline above the dialogue box and use stage directions to brief the facilitator.
- **Constraints:** Must include `headline` copy and a `dialogue_box.lines` array with speaker-labelled turns; keep direction text concise to avoid overwhelming the layout.
- **Visual signature:** Centred hero text supported by a highlighted dialogue box that frames the discussion scenario or prompt.【F:B2/1/B2-1-3/B2-1-3-b.html†L2217-L2225】
- **Required content:** Headline plus a dialogue box with sequential lines; optional stage directions for delivery cues.【F:automation/schema/lesson-deck.schema.json†L530-L548】
- **Permitted media:** Light cards or accent icons above the box; avoid full-width images that would compete with the transcript.
- **Accessibility notes:** Preserve speaker names in `<strong>` or `<span class="speaker">` wrappers so screen readers can announce turns clearly.

## pill.card-stack (`pill.card-stack`)
![pill.card-stack thumbnail](thumbnails/pill-card-stack.png "Replace with pill card stack capture")
- **Canonical snippet:** [JSON](examples/pill.card-stack.json) → [HTML preview](html/pill.card-stack.html) → [Screenshot](thumbnails/pill-card-stack.png)
- **Usage guidance:** Sequence objectives or process steps—each stacked card should tell a short story that learners can scan quickly.
- **Constraints:** Requires `pill_label`, `headline`, and at least one `card_body` entry; reserve the optional `footnote` for facilitator cues rather than new tasks.
- **Visual signature:** Lesson-branded shell with a pill header, headline, and vertical stack of numbered cards for sequential guidance.【F:sandbox/exemplar-master.html†L1490-L1545】
- **Required content:** Pill label, section headline, and one or more stack cards; optional footnote for closing cues.【F:automation/schema/lesson-deck.schema.json†L551-L564】
- **Permitted media:** Stack icons, emoji, or small inline illustrations inside each card.
- **Accessibility notes:** Include visually-hidden labels (e.g., `sr-only`) for card positions so assistive tech users understand ordering.【F:sandbox/exemplar-master.html†L1505-L1514】

## pill.simple (`pill.simple`)
![pill.simple thumbnail](thumbnails/pill-simple.png "Replace with pill simple capture")
- **Canonical snippet:** [JSON](examples/pill.simple.json) → [HTML preview](html/pill.simple.html) → [Screenshot](thumbnails/pill-simple.png)
- **Usage guidance:** Deliver focused context or instructions—lean on short paragraphs or lists so the single card remains legible at a glance.
- **Constraints:** Include `pill_label` plus a `body_copy` array (markdown or plain strings); avoid overloading the layout with nested media blocks.
- **Visual signature:** Neutral card with a context pill, headline, and instructional copy or lists arranged in a flexible grid.【F:sandbox/exemplar-master.html†L208-L257】
- **Required content:** Pill label plus body copy array; schema allows multiple paragraphs, lists, or callouts.【F:automation/schema/lesson-deck.schema.json†L566-L577】
- **Permitted media:** Inline imagery (e.g., `.context-image`) adjacent to the card for richer storytelling.【F:sandbox/exemplar-master.html†L247-L255】
- **Accessibility notes:** Icon bullets should be marked `aria-hidden` and list items need plain-language verbs so screen readers can follow procedural steps.

## card.stack (`card.stack`)
![card.stack thumbnail](thumbnails/card-stack.png "Replace with card stack capture")
- **Canonical snippet:** [JSON](examples/card.stack.json) → [HTML preview](html/card.stack.html) → [Screenshot](thumbnails/card-stack.png)
- **Usage guidance:** Surface multiple equal-weight ideas—use balanced card copy so each column reads with the same emphasis.
- **Constraints:** Populate a `headline` plus at least one `card_body` entry; optional media should complement rather than dominate the grid.
- **Visual signature:** Grid-based layout that surfaces multiple equal-weight cards (typically 2×2 or 2×3) for objectives, prompts, or role summaries.【F:A1/1/A1-1-3/A1-1-3-b.html†L203-L222】
- **Required content:** Headline and a stack of card bodies; schema permits optional supporting media inside cards.【F:automation/schema/lesson-deck.schema.json†L579-L591】
- **Permitted media:** Iconography or short descriptions inside each card; avoid long-form paragraphs that break column rhythm.
- **Accessibility notes:** Maintain logical reading order across columns (left-to-right, top-to-bottom) to support keyboard navigation.

## grid.workspace (`grid.workspace`)
![grid.workspace thumbnail](thumbnails/grid-workspace.png "Replace with grid workspace capture")
- **Canonical snippet:** [JSON](examples/grid.workspace.json) → [HTML preview](html/grid.workspace.html) → [Screenshot](thumbnails/grid-workspace.png)
- **Usage guidance:** Capture collective input—set up clear slot titles so teams know where to log strengths, tensions, and commitments.
- **Constraints:** Provide at least one `grid_slots` item with `id`, `title`, and `body`; include `aria_label` text when the slot instructions are not descriptive on their own.
- **Visual signature:** Workspace canvas with editable note cards or split grids to capture learner input during tasks.【F:A1/Getting to know you/Gettingtoknowyou.html†L130-L156】
- **Required content:** At least one grid slot with title/body; schema supports optional media or ARIA labels for complex zones.【F:automation/schema/lesson-deck.schema.json†L593-L614】
- **Permitted media:** Editable `.note-card` regions, drag targets, or supporting icons.
- **Accessibility notes:** Ensure editable regions expose placeholder text and labels so screen-reader users know what to enter.

## content.wrapper (`content.wrapper`)
![content.wrapper thumbnail](thumbnails/content-wrapper.png "Replace with content wrapper capture")
- **Canonical snippet:** [JSON](examples/content.wrapper.json) → [HTML preview](html/content.wrapper.html) → [Screenshot](thumbnails/content-wrapper.png)
- **Usage guidance:** Default instructional canvas—mix paragraphs, lists, and callouts to scaffold facilitator narration.
- **Constraints:** Populate the `content_blocks` array with semantic block types; every block needs a `type` plus supporting `text` or `items` payload that matches the schema.
- **Visual signature:** Standard content card with pill labels and stacked paragraphs or lists; acts as the default instructional canvas.【F:sandbox/exemplar-master.html†L150-L203】
- **Required content:** One or more content blocks (paragraphs, lists, quotes, callouts) per schema.【F:automation/schema/lesson-deck.schema.json†L620-L643】
- **Permitted media:** Inline media blocks, pull quotes, or emphasis callouts within the wrapper.
- **Accessibility notes:** Use semantic lists for objectives and keep heading hierarchy consistent so screen-reader landmarks remain predictable.

## interactive.activity-card (`interactive.activity-card`)
![interactive.activity-card thumbnail](thumbnails/interactive-activity-card.png "Replace with activity card capture")
- **Canonical snippet:** [JSON](examples/interactive.activity-card.json) → [HTML preview](html/interactive.activity-card.html) → [Screenshot](thumbnails/interactive-activity-card.png)
- **Usage guidance:** Give a short, guided task—list sequenced instructions and leverage the action bar for check/reset affordances.
- **Constraints:** Provide `pill_label`, at least one `instructions` entry, and an `action_bar.primary` button; attach accessibility guidance when extra context is needed for assistive tech.
- **Visual signature:** Pill-labelled activity card with instructions and an action bar housing “Check”/“Reset” controls.【F:sandbox/exemplar-master.html†L598-L728】
- **Required content:** Pill label, ordered instruction array, and an action bar; optional timer hint or accessibility overrides.【F:automation/schema/lesson-deck.schema.json†L646-L667】
- **Permitted media:** Form controls such as dropdowns, audio players, or inline prompts embedded within the card body.【F:sandbox/exemplar-master.html†L610-L707】
- **Accessibility notes:** Tie control labels to inputs (`for`/`id`) and use `aria-live` regions so feedback reads when answers are checked.【F:sandbox/exemplar-master.html†L617-L727】

## interactive.token-board (`interactive.token-board`)
![interactive.token-board thumbnail](thumbnails/interactive-token-board.png "Replace with token board capture")
- **Canonical snippet:** [JSON](examples/interactive.token-board.json) → [HTML preview](html/interactive.token-board.html) → [Screenshot](thumbnails/interactive-token-board.png)
- **Usage guidance:** Run categorisation or prioritisation games—define clear drop zones and action buttons so learners can self-check.
- **Constraints:** Supply at least two `token_bank` entries, one or more `dropzones` with accepted IDs, an `action_bar`, and a `feedback_region`; describe drop targets with `aria-label` text when titles are ambiguous.
- **Visual signature:** Token bank above drag-and-drop columns (e.g., categorisation boards) with persistent action buttons and feedback region.【F:sandbox/exemplar-master.html†L732-L809】
- **Required content:** Token bank, one or more drop zones, action bar, and feedback region; optional scoring metadata per schema.【F:automation/schema/lesson-deck.schema.json†L669-L694】
- **Permitted media:** Category headers, instructional copy, and token chips; supports keyboard drop zones when ARIA labels are provided.【F:sandbox/exemplar-master.html†L785-L809】
- **Accessibility notes:** Ensure each drop zone carries a descriptive `aria-label` and tokens respond to both pointer and keyboard events.

## interactive.token-table (`interactive.token-table`)
![interactive.token-table thumbnail](thumbnails/interactive-token-table.png "Replace with token table capture")
- **Canonical snippet:** [JSON](examples/interactive.token-table.json) → [HTML preview](html/interactive.token-table.html) → [Screenshot](thumbnails/interactive-token-table.png)
- **Usage guidance:** Pair tokens with table cells for matching exercises—use concise prompts per row and keep the bank small enough for quick scanning.
- **Constraints:** Provide a `token_bank`, `table_shell` with columns/rows, and an `action_bar`; include `accessibility.summary` copy to describe the tap/tap interaction for screen readers.
- **Visual signature:** Responsive table shell with clickable placeholders; learners tap a token then the matching cell to populate answers.【F:A1/1/A1-1-1/A1-1-b.html†L305-L378】
- **Required content:** Token bank, table shell, and action bar; optional accessibility summary for screen-reader narration.【F:automation/schema/lesson-deck.schema.json†L696-L715】
- **Permitted media:** Table headers, inline hints, or supporting imagery in adjacent columns.
- **Accessibility notes:** Each button-style drop zone should expose an `aria-label` describing the target cell for assistive technology users.【F:A1/1/A1-1-1/A1-1-b.html†L319-L378】

## interactive.token-quiz (`interactive.token-quiz`)
![interactive.token-quiz thumbnail](thumbnails/interactive-token-quiz.png "Replace with token quiz capture")
- **Canonical snippet:** [JSON](examples/interactive.token-quiz.json) → [HTML preview](html/interactive.token-quiz.html) → [Screenshot](thumbnails/interactive-token-quiz.png)
- **Usage guidance:** Combine token sorting with formative checks—mix short prompts and rationales so learners understand why their sequence matters.
- **Constraints:** Requires `token_bank` data plus at least one `quiz_prompts` entry; use `completion_copy` to deliver accessible success/error messaging after validation.
- **Visual signature:** Hybrid activity where learners drag tokens into sentence slots or prompt lists, then trigger completion feedback.【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1752-L1792】
- **Required content:** Token bank and quiz prompt collection; optional completion copy surfaced after verification.【F:automation/schema/lesson-deck.schema.json†L717-L733】
- **Permitted media:** Ordered prompts, inline hints, or supporting paragraphs that scaffold the quiz logic.【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1754-L1789】
- **Accessibility notes:** Provide clear instructions on the required interaction (tap token → tap slot) and keep the feedback region live so success/error states are announced.

## interactive.quiz-feedback (`interactive.quiz-feedback`)
![interactive.quiz-feedback thumbnail](thumbnails/interactive-quiz-feedback.png "Replace with quiz feedback capture")
- **Canonical snippet:** [JSON](examples/interactive.quiz-feedback.json) → [HTML preview](html/interactive.quiz-feedback.html) → [Screenshot](thumbnails/interactive-quiz-feedback.png)
- **Usage guidance:** Pair multiple-choice or constructed responses with detailed rationales—use the persistent feedback box to reinforce learning goals.
- **Constraints:** Include at least one `quiz_items` entry with `prompt` and `learner_response`, plus a `feedback_region`; optional `next_steps` copy should stay concise.
- **Visual signature:** Quiz question cards paired with persistent feedback boxes that reveal explanations per item.【F:C1/Getting to know you/Getting-to-know-you.html†L445-L600】
- **Required content:** Array of quiz items and a feedback region, with optional next-step guidance per schema.【F:automation/schema/lesson-deck.schema.json†L735-L757】
- **Permitted media:** Animated quiz containers, multiple-choice grids, and rich feedback copy for each option.【F:C1/Getting to know you/Getting-to-know-you.html†L447-L600】
- **Accessibility notes:** Associate each feedback panel with the corresponding question ID and avoid hiding content in ways that block screen-reader access once revealed.

## interactive.audio-dialogue (`interactive.audio-dialogue`)
![interactive.audio-dialogue thumbnail](thumbnails/interactive-audio-dialogue.png "Replace with audio dialogue capture")
- **Canonical snippet:** [JSON](examples/interactive.audio-dialogue.json) → [HTML preview](html/interactive.audio-dialogue.html) → [Screenshot](thumbnails/interactive-audio-dialogue.png)
- **Usage guidance:** Showcase listening practice—anchor the audio player beside prompts that focus attention on coaching moves or transcript highlights.
- **Constraints:** Provide an `audio_player` with `source` and `duration_seconds`, plus a `prompt_card` containing `title` and at least one `instructions` entry; always surface transcripts or captions for accessibility.
- **Visual signature:** Split layout with an audio player, transcript card, and complementary image or caption for context.【F:B2/1/B2-1-1/B2-1-1-Strategic Planning.html†L750-L768】
- **Required content:** Audio player metadata (source, duration) and a prompt card with instructions; optional supporting points.【F:automation/schema/lesson-deck.schema.json†L759-L791】
- **Permitted media:** Static imagery, captions, or transcript highlights adjacent to the audio component.【F:B2/1/B2-1-1/B2-1-1-Strategic Planning.html†L754-L768】
- **Accessibility notes:** Always include downloadable transcripts/captions and keep audio controls keyboard-focusable.

## dialogue.grid (`dialogue.grid`)
![dialogue.grid thumbnail](thumbnails/dialogue-grid.png "Replace with dialogue grid capture")
- **Canonical snippet:** [JSON](examples/dialogue.grid.json) → [HTML preview](html/dialogue.grid.html) → [Screenshot](thumbnails/dialogue-grid.png)
- **Usage guidance:** Present contrasting dialogue moves—use the grid to pair prompts, supports, and optional media for each turn.
- **Constraints:** Requires a `pill_label` and at least two `prompt_cards`; each card needs a `title` and `prompt`, with optional `support` or media for emphasis.
- **Visual signature:** Two-column grid pairing instructions with a dialogue box that models target language in context.【F:A1/1/A1-1-4/A1-1-4-b.html†L246-L262】
- **Required content:** Pill label plus multiple prompt cards/dialogue excerpts laid out in a grid.【F:automation/schema/lesson-deck.schema.json†L794-L805】
- **Permitted media:** Highlighted vocabulary, emoji, or inline icons inside the dialogue box to draw attention to target forms.【F:A1/1/A1-1-4/A1-1-4-b.html†L256-L260】
- **Accessibility notes:** Maintain column ordering in markup so screen readers present guidance before the model text.

## dialogue.stack (`dialogue.stack`)
![dialogue.stack thumbnail](thumbnails/dialogue-stack.png "Replace with dialogue stack capture")
- **Canonical snippet:** [JSON](examples/dialogue.stack.json) → [HTML preview](html/dialogue.stack.html) → [Screenshot](thumbnails/dialogue-stack.png)
- **Usage guidance:** Break down a transcript line-by-line—highlight speaker turns and add a CTA for follow-up reflection.
- **Constraints:** Provide a `dialogue_box.lines` array with speaker-tagged text; optional `title` and `cta` elements should stay within the dialogue container.
- **Visual signature:** Single card that stacks dialogue lines with emphasis phrases, often used for language analysis.【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1502-L1517】
- **Required content:** Dialogue box containing sequential lines; optional CTA or reflection prompt per schema.【F:automation/schema/lesson-deck.schema.json†L807-L824】
- **Permitted media:** Bolded sentence stems, inline emphasis tags, or follow-up discussion questions beneath the transcript.【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1506-L1522】
- **Accessibility notes:** Use semantic paragraph tags for each utterance and keep emphasis markup inside the dialogue text so screen readers vocalise tone shifts appropriately.

---

**Thumbnail production checklist:** Replace each placeholder image above with a 1280×720 PNG captured from the referenced slide once design sign-off is complete. Store assets in `automation/archetypes/thumbnails/` to keep this guide in sync with visual references.
