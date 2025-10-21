# Authoring Deck Proof of Concept

This folder contains an isolated proof-of-concept deck that mirrors the structure of Noor Community slide experiences while keeping every asset local to the `poc/authoring-deck/` directory.

## What is included?

- **`index.html`** – A standalone HTML entry point that reproduces the deck toolbar, stage viewport, and three example slides.
- **`deck-tokens.css`** – A local copy of the shared `CSS-slides.css` design tokens so the deck stays self-contained.
- **`authoring.css`** – Imports the local design tokens and extends them with authoring-specific layout styles.
- **`slideNavigator.js`** – A local copy of the shared navigator helper scoped to this proof of concept.
- **`authoring.js`** – Wires up slide navigation and keeps all logic scoped to this folder.

## How to preview

1. Open this folder in your editor of choice.
2. Double-click `index.html` (or run a lightweight local server) to open the deck in your browser.
3. Use the toolbar buttons or the slide navigator to move between the sample slides.

Because every asset is referenced relatively, you can copy this folder to another machine or share it with stakeholders without impacting the production decks.
