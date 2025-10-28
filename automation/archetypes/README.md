# Slide Archetype Field Guide

This guide summarises every slide layout currently used across the exemplar deck and the level decks under `A1/`–`C1/`. Each section outlines the visual signature, content requirements, media affordances, accessibility considerations, and how the canvas maps onto the canonical `archetype` enum in `automation/schema/lesson-deck.schema.json`. Thumbnail links point to placeholder assets so design and AI tooling can drop in reference screenshots.

> **Schema parity:** All archetypes documented below are present in the schema enum. No additional layout names surfaced in the HTML crawl, so there are no missing or legacy schema entries to flag at this time.【F:automation/schema/lesson-deck.schema.json†L503-L827】

## hero.overlay (`hero.overlay`)
![hero.overlay thumbnail](thumbnails/hero-overlay.png "Replace with hero overlay capture")
- **Visual signature:** Full-bleed background media with a darkened overlay card that carries the pill, headline, and subtitle.【F:sandbox/exemplar-master.html†L81-L104】 
- **Required content:** Background media asset, hero headline, supporting subhead copy; optional overlay instructions or CTA per schema.【F:automation/schema/lesson-deck.schema.json†L503-L513】
- **Permitted media:** Remote images or video in `.bg-media`; overlay card can include icon pills and stacked lists.【F:sandbox/exemplar-master.html†L95-L125】
- **Accessibility notes:** Always provide descriptive `alt` text for the hero media and ensure overlay contrast remains AA compliant when swapping gradients.【F:sandbox/exemplar-master.html†L85-L93】

## centered.callout (`centered.callout`)
![centered.callout thumbnail](thumbnails/centered-callout.png "Replace with centered callout capture")
- **Visual signature:** Icon-first slide with all content centered in the viewport, typically used to announce tasks or section breaks.【F:B2/1/B2-1-3/B2-1-3-b.html†L2229-L2234】
- **Required content:** Headline plus at least one supporting text block; optional accent pill or illustration according to schema.【F:automation/schema/lesson-deck.schema.json†L515-L528】
- **Permitted media:** Large Font Awesome icon or lightweight illustration; keep layout uncluttered so the centred typography reads clearly.
- **Accessibility notes:** Treat centred paragraphs as short, scannable statements and ensure icons include `aria-hidden="true"` when decorative to avoid double announcing content.

## centered.dialogue (`centered.dialogue`)
![centered.dialogue thumbnail](thumbnails/centered-dialogue.png "Replace with centered dialogue capture")
- **Visual signature:** Centred hero text supported by a highlighted dialogue box that frames the discussion scenario or prompt.【F:B2/1/B2-1-3/B2-1-3-b.html†L2217-L2225】
- **Required content:** Headline plus a dialogue box with sequential lines; optional stage directions for delivery cues.【F:automation/schema/lesson-deck.schema.json†L530-L548】
- **Permitted media:** Light cards or accent icons above the box; avoid full-width images that would compete with the transcript.
- **Accessibility notes:** Preserve speaker names in `<strong>` or `<span class="speaker">` wrappers so screen readers can announce turns clearly.

## pill.card-stack (`pill.card-stack`)
![pill.card-stack thumbnail](thumbnails/pill-card-stack.png "Replace with pill card stack capture")
- **Visual signature:** Lesson-branded shell with a pill header, headline, and vertical stack of numbered cards for sequential guidance.【F:sandbox/exemplar-master.html†L1490-L1545】
- **Required content:** Pill label, section headline, and one or more stack cards; optional footnote for closing cues.【F:automation/schema/lesson-deck.schema.json†L551-L564】
- **Permitted media:** Stack icons, emoji, or small inline illustrations inside each card.
- **Accessibility notes:** Include visually-hidden labels (e.g., `sr-only`) for card positions so assistive tech users understand ordering.【F:sandbox/exemplar-master.html†L1505-L1514】

## pill.simple (`pill.simple`)
![pill.simple thumbnail](thumbnails/pill-simple.png "Replace with pill simple capture")
- **Visual signature:** Neutral card with a context pill, headline, and instructional copy or lists arranged in a flexible grid.【F:sandbox/exemplar-master.html†L208-L257】
- **Required content:** Pill label plus body copy array; schema allows multiple paragraphs, lists, or callouts.【F:automation/schema/lesson-deck.schema.json†L566-L577】
- **Permitted media:** Inline imagery (e.g., `.context-image`) adjacent to the card for richer storytelling.【F:sandbox/exemplar-master.html†L247-L255】
- **Accessibility notes:** Icon bullets should be marked `aria-hidden` and list items need plain-language verbs so screen readers can follow procedural steps.

## card.stack (`card.stack`)
![card.stack thumbnail](thumbnails/card-stack.png "Replace with card stack capture")
- **Visual signature:** Grid-based layout that surfaces multiple equal-weight cards (typically 2×2 or 2×3) for objectives, prompts, or role summaries.【F:A1/1/A1-1-3/A1-1-3-b.html†L203-L222】
- **Required content:** Headline and a stack of card bodies; schema permits optional supporting media inside cards.【F:automation/schema/lesson-deck.schema.json†L579-L591】
- **Permitted media:** Iconography or short descriptions inside each card; avoid long-form paragraphs that break column rhythm.
- **Accessibility notes:** Maintain logical reading order across columns (left-to-right, top-to-bottom) to support keyboard navigation.

## grid.workspace (`grid.workspace`)
![grid.workspace thumbnail](thumbnails/grid-workspace.png "Replace with grid workspace capture")
- **Visual signature:** Workspace canvas with editable note cards or split grids to capture learner input during tasks.【F:A1/Getting to know you/Gettingtoknowyou.html†L130-L156】
- **Required content:** At least one grid slot with title/body; schema supports optional media or ARIA labels for complex zones.【F:automation/schema/lesson-deck.schema.json†L593-L614】
- **Permitted media:** Editable `.note-card` regions, drag targets, or supporting icons.
- **Accessibility notes:** Ensure editable regions expose placeholder text and labels so screen-reader users know what to enter.

## content.wrapper (`content.wrapper`)
![content.wrapper thumbnail](thumbnails/content-wrapper.png "Replace with content wrapper capture")
- **Visual signature:** Standard content card with pill labels and stacked paragraphs or lists; acts as the default instructional canvas.【F:sandbox/exemplar-master.html†L150-L203】
- **Required content:** One or more content blocks (paragraphs, lists, quotes, callouts) per schema.【F:automation/schema/lesson-deck.schema.json†L620-L643】
- **Permitted media:** Inline media blocks, pull quotes, or emphasis callouts within the wrapper.
- **Accessibility notes:** Use semantic lists for objectives and keep heading hierarchy consistent so screen-reader landmarks remain predictable.

## interactive.activity-card (`interactive.activity-card`)
![interactive.activity-card thumbnail](thumbnails/interactive-activity-card.png "Replace with activity card capture")
- **Visual signature:** Pill-labelled activity card with instructions and an action bar housing “Check”/“Reset” controls.【F:sandbox/exemplar-master.html†L598-L728】
- **Required content:** Pill label, ordered instruction array, and an action bar; optional timer hint or accessibility overrides.【F:automation/schema/lesson-deck.schema.json†L646-L667】
- **Permitted media:** Form controls such as dropdowns, audio players, or inline prompts embedded within the card body.【F:sandbox/exemplar-master.html†L610-L707】
- **Accessibility notes:** Tie control labels to inputs (`for`/`id`) and use `aria-live` regions so feedback reads when answers are checked.【F:sandbox/exemplar-master.html†L617-L727】

## interactive.token-board (`interactive.token-board`)
![interactive.token-board thumbnail](thumbnails/interactive-token-board.png "Replace with token board capture")
- **Visual signature:** Token bank above drag-and-drop columns (e.g., categorisation boards) with persistent action buttons and feedback region.【F:sandbox/exemplar-master.html†L732-L809】
- **Required content:** Token bank, one or more drop zones, action bar, and feedback region; optional scoring metadata per schema.【F:automation/schema/lesson-deck.schema.json†L669-L694】
- **Permitted media:** Category headers, instructional copy, and token chips; supports keyboard drop zones when ARIA labels are provided.【F:sandbox/exemplar-master.html†L785-L809】
- **Accessibility notes:** Ensure each drop zone carries a descriptive `aria-label` and tokens respond to both pointer and keyboard events.

## interactive.token-table (`interactive.token-table`)
![interactive.token-table thumbnail](thumbnails/interactive-token-table.png "Replace with token table capture")
- **Visual signature:** Responsive table shell with clickable placeholders; learners tap a token then the matching cell to populate answers.【F:A1/1/A1-1-1/A1-1-b.html†L305-L378】
- **Required content:** Token bank, table shell, and action bar; optional accessibility summary for screen-reader narration.【F:automation/schema/lesson-deck.schema.json†L696-L715】
- **Permitted media:** Table headers, inline hints, or supporting imagery in adjacent columns.
- **Accessibility notes:** Each button-style drop zone should expose an `aria-label` describing the target cell for assistive technology users.【F:A1/1/A1-1-1/A1-1-b.html†L319-L378】

## interactive.token-quiz (`interactive.token-quiz`)
![interactive.token-quiz thumbnail](thumbnails/interactive-token-quiz.png "Replace with token quiz capture")
- **Visual signature:** Hybrid activity where learners drag tokens into sentence slots or prompt lists, then trigger completion feedback.【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1752-L1792】
- **Required content:** Token bank and quiz prompt collection; optional completion copy surfaced after verification.【F:automation/schema/lesson-deck.schema.json†L717-L733】
- **Permitted media:** Ordered prompts, inline hints, or supporting paragraphs that scaffold the quiz logic.【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1754-L1789】
- **Accessibility notes:** Provide clear instructions on the required interaction (tap token → tap slot) and keep the feedback region live so success/error states are announced.

## interactive.quiz-feedback (`interactive.quiz-feedback`)
![interactive.quiz-feedback thumbnail](thumbnails/interactive-quiz-feedback.png "Replace with quiz feedback capture")
- **Visual signature:** Quiz question cards paired with persistent feedback boxes that reveal explanations per item.【F:C1/Getting to know you/Getting-to-know-you.html†L445-L600】
- **Required content:** Array of quiz items and a feedback region, with optional next-step guidance per schema.【F:automation/schema/lesson-deck.schema.json†L735-L757】
- **Permitted media:** Animated quiz containers, multiple-choice grids, and rich feedback copy for each option.【F:C1/Getting to know you/Getting-to-know-you.html†L447-L600】
- **Accessibility notes:** Associate each feedback panel with the corresponding question ID and avoid hiding content in ways that block screen-reader access once revealed.

## interactive.audio-dialogue (`interactive.audio-dialogue`)
![interactive.audio-dialogue thumbnail](thumbnails/interactive-audio-dialogue.png "Replace with audio dialogue capture")
- **Visual signature:** Split layout with an audio player, transcript card, and complementary image or caption for context.【F:B2/1/B2-1-1/B2-1-1-Strategic Planning.html†L750-L768】
- **Required content:** Audio player metadata (source, duration) and a prompt card with instructions; optional supporting points.【F:automation/schema/lesson-deck.schema.json†L759-L791】
- **Permitted media:** Static imagery, captions, or transcript highlights adjacent to the audio component.【F:B2/1/B2-1-1/B2-1-1-Strategic Planning.html†L754-L768】
- **Accessibility notes:** Always include downloadable transcripts/captions and keep audio controls keyboard-focusable.

## dialogue.grid (`dialogue.grid`)
![dialogue.grid thumbnail](thumbnails/dialogue-grid.png "Replace with dialogue grid capture")
- **Visual signature:** Two-column grid pairing instructions with a dialogue box that models target language in context.【F:A1/1/A1-1-4/A1-1-4-b.html†L246-L262】
- **Required content:** Pill label plus multiple prompt cards/dialogue excerpts laid out in a grid.【F:automation/schema/lesson-deck.schema.json†L794-L805】
- **Permitted media:** Highlighted vocabulary, emoji, or inline icons inside the dialogue box to draw attention to target forms.【F:A1/1/A1-1-4/A1-1-4-b.html†L256-L260】
- **Accessibility notes:** Maintain column ordering in markup so screen readers present guidance before the model text.

## dialogue.stack (`dialogue.stack`)
![dialogue.stack thumbnail](thumbnails/dialogue-stack.png "Replace with dialogue stack capture")
- **Visual signature:** Single card that stacks dialogue lines with emphasis phrases, often used for language analysis.【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1502-L1517】
- **Required content:** Dialogue box containing sequential lines; optional CTA or reflection prompt per schema.【F:automation/schema/lesson-deck.schema.json†L807-L824】
- **Permitted media:** Bolded sentence stems, inline emphasis tags, or follow-up discussion questions beneath the transcript.【F:B2/1/B2-1-1/Strategic-Planning-In-The-NGO-Sector.html†L1506-L1522】
- **Accessibility notes:** Use semantic paragraph tags for each utterance and keep emphasis markup inside the dialogue text so screen readers vocalise tone shifts appropriately.

---

**Thumbnail production checklist:** Replace each placeholder image above with a 1280×720 PNG captured from the referenced slide once design sign-off is complete. Store assets in `automation/archetypes/thumbnails/` to keep this guide in sync with visual references.
