# Sandbox runtime module reference

This guide inventories the modules that compose the Sandbox activity and deck tooling so authors know where behaviours live and how assets interact at runtime.

## HTML entry point – `sandbox/activity-builder.html`
- Declares the Activity Builder shell, wiring skip links, toolbar controls, live preview iframe, export actions, and status regions for screen readers.【F:sandbox/activity-builder.html†L1-L82】
- Loads Google Fonts, Font Awesome, the Sandbox theme/base CSS bundles, and the Activity Builder script to hydrate the UI when the page loads.【F:sandbox/activity-builder.html†L7-L24】【F:sandbox/activity-builder.html†L74-L77】

## Builder orchestration – `sandbox/activity-builder.js`
- Seeds default JSON blueprints for every supported activity type so newly added modules render with complete demo content in the preview pane.【F:sandbox/activity-builder.js†L1-L118】
- Manages the configuration form, export textarea, preview refresh workflow, and deck hand-off by serialising the in-memory state into HTML the iframe and clipboard actions can consume.【F:sandbox/activity-builder.js†L719-L832】
- Bridges to the deck runtime by opening the module overlay, embedding the builder iframe, and passing configuration payloads back into the canvas insert callbacks exposed by `int-mod.js`.【F:sandbox/activity-builder.js†L1028-L1155】

## Deck runtime – `sandbox/int-mod.js`
- Exposes `setupInteractiveDeck` and a large suite of helpers that initialise the stage viewport, slide counter, save/load utilities, asset search, and inline editing affordances for Sandbox decks.【F:sandbox/int-mod.js†L14250-L14530】
- Lazily loads the slide navigator implementation on demand, memoising the factory so decks hydrate successfully whether `initSlideNavigator` is bundled or supplied globally.【F:sandbox/int-mod.js†L1-L50】
- Provides shared UI primitives such as colour swatch renderers, editable element observers, auto-fit exclusions, and module overlay lifecycle management used by slide layouts and the Activity Builder integration.【F:sandbox/int-mod.js†L52-L145】

## Layout defaults – `sandbox/slide-templates.js`
- Imports archetype definitions, clones template defaults, and exposes `BUILDER_LAYOUT_DEFAULTS` plus helpers (`cloneLayoutDefaults`, `getLayoutFieldIconDefault`, etc.) for merging archetype data into slide briefs.【F:sandbox/slide-templates.js†L1-L80】【F:sandbox/slide-templates.js†L112-L155】
- Normalises icon class assignments for both layout-level and field-level defaults so generated slides display consistent Font Awesome glyphs without requiring explicit overrides in briefs.【F:sandbox/slide-templates.js†L18-L110】

## Slide navigator – `sandbox/slide-nav.js`
- Builds the collapsible navigation tray, renders slide thumbnails, and wires duplicate/delete/move callbacks provided by the deck runtime.【F:sandbox/slide-nav.js†L1-L90】
- Maintains accessibility affordances including toggle ARIA state, live status announcements, focus trapping while open, and keyboard navigation for the slide list.【F:sandbox/slide-nav.js†L16-L75】【F:sandbox/slide-nav.js†L90-L148】

## Sandbox base styles – `sandbox/sandbox-css.css`
- Establishes layout primitives (`.stack`, `.slide-inner`, grid spacing tokens) that layouts reuse to stay aligned with the Sandbox deck design language.【F:sandbox/sandbox-css.css†L1-L68】
- Applies global typography, background, and surface treatments for slides, ensuring generated decks inherit consistent spacing and responsive behaviour across viewports.【F:sandbox/sandbox-css.css†L13-L56】

## Sandbox theme tokens – `sandbox/sandbox-theme.css`
- Defines the theme design tokens (fonts, modular scale, spacing, colour palette, shadows, gradients) referenced by both the base CSS bundle and layout-specific rules.【F:sandbox/sandbox-theme.css†L1-L78】
- Sets shared CSS custom properties for toolbar dimensions, slide padding, and stack gaps so runtime components calculate sizing without duplicating constants in JavaScript.【F:sandbox/sandbox-theme.css†L68-L92】
