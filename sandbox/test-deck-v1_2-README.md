# Applying Critical Thinking to Global Development Challenges — Teacher Guide

This deck is an interactive lesson for advanced English learners working on critical thinking and language for evaluating global development projects. Use it as a plug-and-play lesson in Noor Community classes or adapt it for your own context.

## 1. Quick start

1. Download or clone the repository.
2. Open [`sandbox/test-deck-v1_2.html`](./test-deck-v1_2.html) directly in a modern browser (Chrome, Edge, Firefox, or Safari).
3. Allow the browser to load remote assets (Google Fonts, Font Awesome, and Pexels images). A stable connection is recommended for smooth media loading.

> **Tip:** If you host the file on an LMS or classroom site, keep the folder structure (`sandbox/`, `CSS/`, `js/`, and `audio/`) intact so that the deck can find the shared CSS, JavaScript, and optional audio files.

## 2. Lesson arc at a glance (19 slides)

| Phase | Slides | Focus |
| --- | --- | --- |
| Welcome & Grounding | 1–2 | Greeting, mindfulness grounding, lesson aims. |
| Language Input | 3–6 | Distancing language targets via aims, unscramble, and matching tasks. |
| Guided Practice | 7–13 | Speaking prompts, vocabulary categorisation, pronunciation quiz (with audio), and guided analysis questions. |
| Main Task | 14–17 | Project brief introduction, preparation guidance, inter-team briefing structure. |
| Extension & Reflection | 18–19 | Homework quizzes, reflection prompts, and celebration wrap-up. |

## 3. Using the teacher toolbar

The floating toolbar across the top gives you live facilitation tools:

- **Slide navigation:** Use the arrow keys or on-screen controls (loaded from `slide-nav.js`) to move through the deck. The counter updates automatically.
- **Save / Load deck:** Export the current slide state (including checked answers and highlights) to a JSON file you can reload later. Great for pausing and resuming across classes.
- **Highlighting:** Select text on any slide, pick a highlight colour (Sunbeam, Meadow, or Coral), and click **Apply**. Use **Clear** to remove highlights. This works for teacher annotations or to model learner responses.
- **Add blank slide:** Insert an empty slide on the fly for emergent language or custom instructions.
- **Activity Builder:** Launches the embedded builder (see Section 5) that generates new activity slides without leaving the deck.

## 4. Slide-by-slide teaching notes

- **Slides 1–3:** Set the tone. Slide 3’s bullet points are animated by default—pause to unpack each aim.
- **Slides 4–6:** Pre-task language work. Slide 5 (`data-activity="unscramble"`) and Slide 6 (`data-activity="matching"`) are auto-graded. Click **Check Answers** to show feedback; **Reset** clears responses.
- **Slide 7 onward:** Encourage breakout room collaboration. Several slides include drag-and-drop categorisation (`data-activity="categorise"`), clickable vocabulary tokens, and timer prompts. Model one example before learners start.
- **Slide 11 (Pronunciation):** Audio placeholders expect files in `/audio/audio1.mp3` … `/audio/audio6.mp3`. Replace with your own recordings or remove the `<audio>` tags if you do not plan to use them.
- **Slides 14–17:** Main task briefing. Slide 15 outlines preparation steps; Slide 16 presents two project options; Slide 17 scaffolds reporting and active listening.
- **Slides 18–19:** Homework and reflection. You can assign these asynchronously or convert them into in-class review activities.

## 5. Customising with the Activity Builder

Click **Activity Builder** in the toolbar to open a panel on the right-hand side. From there you can:

1. Choose a layout (facilitation guide, rubric, image spotlight, etc.).
2. Fill in prompts, rubrics, and timing fields.
3. Search Pexels for royalty-free imagery (requires the API key defined in `activity-builder.js`). Paste the provided Noor Community key when prompted, or configure your own.
4. Insert the generated slide into the deck instantly—perfect for tailoring tasks to your learners’ interests.

The builder writes slides directly into the DOM; if you want to keep permanent changes, use **Save Deck** after inserting.

## 6. Accessibility & learner support

- Semantic headings, ARIA labels, and keyboard-focusable controls are baked in.
- The **Skip to lesson workspace** link jumps past the toolbar for screen-reader users.
- Ensure alternative text is added for any images you swap in via the builder.
- When using highlights, narrate the purpose so screen-reader users are not left out.

## 7. Suggested flow for synchronous classes

1. **Warm-up (Slides 1–4):** 10 minutes to ground and activate prior knowledge.
2. **Language focus (Slides 5–8):** 15 minutes of controlled to freer practice.
3. **Pronunciation clinic (Slide 11):** 7 minutes. Play audio clips twice and elicit intonation cues.
4. **Critical discussion (Slides 12–13):** 10 minutes in pairs/small groups.
5. **Project evaluation task (Slides 14–17):** 25–30 minutes for preparation and reporting.
6. **Wrap-up & homework (Slides 18–19):** 5 minutes.

Adjust timings based on group size. The deck is optimised for 60–75 minute sessions.

## 8. Offline or low-bandwidth adaptations

- Preload the page once so cached images are available offline.
- Replace background images with solid colours by removing the `<img data-remote-src="…">` elements.
- Download audio files locally if streaming is unstable.

## 9. Attribution & licensing

- Lesson content © Noor Community. Fonts and icons are loaded via Google Fonts and Font Awesome.
- Pexels imagery is covered by the Pexels license; always credit photographers when reusing outside the deck.

## 10. Questions or contributions

If you adapt the deck for new contexts, consider contributing back via a pull request or sharing feedback with the Noor Community team. Happy teaching!
