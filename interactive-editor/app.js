import { createEditorCore } from "./editorCore.js";

const canvas = document.getElementById("editor-canvas");
const toolbar = document.querySelector(".toolbar");
const placeholder = canvas?.querySelector(".canvas__placeholder") ?? null;

const editor = createEditorCore({
  canvas,
  placeholder,
  storageKey: "interactive-editor-state",
  interactInstance: window.interact,
});

const {
  createTextBlock,
  createImageBlock,
  createModuleBlock,
  addBlockToCanvas,
  scheduleSave,
  showBlockMessage,
  updatePlaceholderVisibility,
  registerBlockInteractions,
  restoreStateFromStorage,
} = editor;

registerBlockInteractions();
restoreStateFromStorage();

toolbar?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  let block;
  switch (button.dataset.action) {
    case "add-text":
      block = createTextBlock();
      break;
    case "add-image":
      block = createImageBlock();
      break;
    case "add-module":
      block = createModuleBlock();
      break;
    default:
      break;
  }

  if (block) {
    addBlockToCanvas(block);
  }
});

canvas?.addEventListener("click", (event) => {
  const actionButton = event.target.closest(".block__action");
  if (!actionButton) return;

  const block = actionButton.closest(".block");
  if (!block) return;

  const action = actionButton.dataset.action;
  if (action === "remove") {
    block.remove();
    updatePlaceholderVisibility();
    scheduleSave();
    return;
  }

  if (action === "rename" && block.dataset.type === "text") {
    const currentName = block.dataset.name || "Text block";
    const response = window.prompt("Rename text block", currentName);
    if (response === null) return;

    const trimmed = response.trim();
    if (!trimmed) {
      showBlockMessage(block, "Name must contain at least one character.", {
        tone: "error",
        duration: 4000,
      });
      return;
    }

    if (trimmed.length > 60) {
      showBlockMessage(block, "Name must be 60 characters or fewer.", {
        tone: "error",
        duration: 4000,
      });
      return;
    }

    block.dataset.name = trimmed;
    const title = block.querySelector(".block__title");
    if (title) {
      title.textContent = trimmed;
    }
    showBlockMessage(block, `Renamed to “${trimmed}”.`);
    scheduleSave();
  }
});

canvas?.addEventListener("dblclick", (event) => {
  if (event.target === canvas) {
    addBlockToCanvas(createTextBlock());
  }
});
