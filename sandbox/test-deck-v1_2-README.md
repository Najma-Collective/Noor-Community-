# Teacher Guide: Applying Critical Thinking to Global Development Challenges Deck

This guide shows you how to run and customise the interactive lesson deck in `sandbox/test-deck-v1_2.html`. It focuses on the classroom tools built into the sandbox toolbar, blank slide canvas, Activity Builder, and module integrations so you can adapt the materials for your learners.

## Getting started

1. Open `sandbox/test-deck-v1_2.html` in your browser. The top toolbar gives you quick access to saving/loading, the Activity Builder, text highlighting, and blank slide creation while displaying the current slide count for easy navigation cues. 【F:sandbox/test-deck-v1_2.html†L20-L80】
2. Use the left/right chevrons that appear beneath the slides to move through the deck during class. 【F:sandbox/test-deck-v1_2.html†L1422-L1427】
3. Save your customised sequence at any time with **Save Deck** (downloads a JSON state file) and reload it later with **Load Deck** (choose the saved JSON). Each action confirms success or errors through on-screen toasts. 【F:sandbox/test-deck-v1_2.html†L35-L48】【F:sandbox/int-mod.js†L1800-L1950】

## Highlighting key language

* Select text on any slide, pick a colour from the highlight menu, and click **Apply** to emphasise vocabulary or instructions. Highlights must stay within a single slide and only activate when text is selected. 【F:sandbox/test-deck-v1_2.html†L57-L75】【F:sandbox/int-mod.js†L1964-L2013】
* To remove a highlight, place your cursor inside the coloured text and click **Clear**. The deck unwraps the text and tidies spacing automatically. 【F:sandbox/test-deck-v1_2.html†L68-L74】【F:sandbox/int-mod.js†L2022-L2058】

## Adding and using blank slides

Click **Add Blank Slide** to append a workspace with its own controls for teacher-designed activities. 【F:sandbox/test-deck-v1_2.html†L76-L79】【F:sandbox/int-mod.js†L600-L616】 The blank slide toolbar lets you:

* **Add Textbox** – insert movable, editable text areas. Double-click the body to start typing, drag them into place, and toggle colour tags to organise ideas. Textboxes can be removed with the close icon and support keyboard focus/escape to exit editing. 【F:sandbox/int-mod.js†L673-L707】【F:sandbox/int-mod.js†L820-L901】
* **Add Mind Map** – drop a structured mind map canvas (details below). If one already exists, the deck scrolls you to it instead of adding duplicates. 【F:sandbox/int-mod.js†L680-L692】
* **Add Module** – open the interactive module library so you can embed ready-made activity widgets (details below). 【F:sandbox/int-mod.js†L694-L702】

Learners can also paste images straight onto the canvas (for example, screenshots of breakout-room work). The deck captures clipboard images, places them with sensible default sizing, and keeps the workspace hint text up to date as you mix text, visuals, mind maps, or modules. 【F:sandbox/int-mod.js†L724-L779】【F:sandbox/int-mod.js†L629-L670】

## Building textbox mind maps

Mind maps offer a rapid way to capture brainstorming during class:

* Adding a mind map creates a central idea field, live branch counter, and toolbar with **Sort A–Z** and **Copy summary** actions. 【F:sandbox/int-mod.js†L1213-L1253】
* Use the form at the bottom to add new branches. Each branch provides a label input, colour swatches, editable notes area, and remove button. Labels default to themed presets (Idea, Opportunity, Challenge, Evidence, Question) that recycle automatically as you add branches. 【F:sandbox/int-mod.js†L1336-L1448】【F:sandbox/int-mod.js†L1549-L1559】
* The status banner confirms updates such as branch additions, label or colour changes, and central idea edits. It also guides you when you try to sort without enough content. 【F:sandbox/int-mod.js†L1299-L1416】【F:sandbox/int-mod.js†L1465-L1491】
* **Sort A–Z** alphabetises populated branches so learners can surface themes quickly, while **Copy summary** exports a text digest of the central idea and each completed branch to your clipboard (with a manual fallback if the Clipboard API is unavailable). 【F:sandbox/int-mod.js†L1465-L1536】

## Embedding interactive modules

When you press **Add Module** on a blank slide, the module overlay opens an embedded builder that streams configured activities back into your slide. 【F:sandbox/test-deck-v1_2.html†L1700-L1738】【F:sandbox/int-mod.js†L3450-L3520】

* The overlay remembers the button that opened it, focuses the module builder iframe for accessibility, and closes with Escape, backdrop clicks, or the close button. 【F:sandbox/int-mod.js†L3450-L3496】
* When you finish configuring a module in the iframe, the deck receives the generated HTML, wraps it with a header showing the activity type, and embeds it inside your blank slide canvas. Removing the module later restores the workspace hint. 【F:sandbox/int-mod.js†L3497-L3545】【F:sandbox/int-mod.js†L694-L702】

## Generating templated activity slides

The **Activity Builder** button launches a full-screen slide library where you can design facilitation slides and drop them directly into the deck. 【F:sandbox/test-deck-v1_2.html†L49-L56】【F:sandbox/test-deck-v1_2.html†L1432-L1696】

1. **Choose a layout.** Options include Blank canvas, Workshop facilitation, and rubric-focused templates such as Discussion columns or Strategy cards. 【F:sandbox/test-deck-v1_2.html†L1453-L1497】
2. **Complete the fields shown for your layout.** Enter stage labels, activity titles, durations, facilitation steps, rubric descriptions, discussion column prompts, card content, or image spotlight text as required. An optional Pexels search helps you pull imagery directly into Spotlight layouts. 【F:sandbox/test-deck-v1_2.html†L1498-L1633】
3. **Add rubric prompts.** Use **Add criterion** to build success measures, review the live JSON preview, and refresh the slide preview if needed. 【F:sandbox/test-deck-v1_2.html†L1636-L1678】
4. **Insert the slide.** Submitting the form validates required fields. Blank canvas inserts a plain workspace; structured layouts build full facilitation slides with headings, steps, rubric tables, cards, or images. The deck focuses the new slide and shows a confirmation message when ready. 【F:sandbox/test-deck-v1_2.html†L1684-L1693】【F:sandbox/int-mod.js†L4500-L4668】

When you generate an activity, use **Copy to Clipboard** to paste the HTML into another tool, or click **Download HTML** to save a standalone file that you can attach to emails or store in your lesson resources. Each action refreshes the output before exporting and confirms success through on-screen alerts.

## Tips for facilitating with custom slides

* The blank slide hint text updates as you mix textboxes, pasted images, mind maps, and modules—use it as a quick reminder of available interactions to prompt learners. 【F:sandbox/int-mod.js†L629-L670】
* Drag textboxes, pasted images, and modules to arrange collaborative workspaces; resizing handles keep content within the canvas boundaries. 【F:sandbox/int-mod.js†L724-L779】【F:sandbox/int-mod.js†L1180-L1209】
* Revisit saved deck states before class to preload your customised sequence, including any blank slide layouts or embedded modules you built previously. 【F:sandbox/int-mod.js†L1800-L1950】

With these tools, you can adapt the sandbox deck into a dynamic lesson hub—capturing student thinking live, differentiating activities, and archiving the session for future cohorts.
