const canvas = document.getElementById("editor-canvas");
const toolbar = document.querySelector(".toolbar");
const placeholder = canvas.querySelector(".canvas__placeholder");

const STORAGE_KEY = "interactive-editor-state";
const MAX_TEXT_LENGTH = 2000;
const SAVE_DEBOUNCE_MS = 300;

let blockCount = 0;
let highestZIndex = 1;
let saveTimeoutId;
const messageTimeouts = new WeakMap();

function sanitizeHTML(html) {
  const markup = typeof html === "string" ? html : String(html ?? "");
  const template = document.createElement("template");
  template.innerHTML = markup;

  const allowedTags = new Set([
    "P",
    "BR",
    "STRONG",
    "EM",
    "B",
    "I",
    "U",
    "UL",
    "OL",
    "LI",
    "A",
    "SPAN",
    "DIV",
  ]);

  const allowedAttributes = {
    A: ["href", "target", "rel"],
  };

  const elements = template.content.querySelectorAll("*");
  elements.forEach((element) => {
    const tagName = element.tagName;
    if (!allowedTags.has(tagName)) {
      const fragment = document.createDocumentFragment();
      while (element.firstChild) {
        fragment.appendChild(element.firstChild);
      }
      element.replaceWith(fragment);
      return;
    }

    [...element.attributes].forEach((attribute) => {
      const attrName = attribute.name.toLowerCase();
      const allowed = allowedAttributes[tagName]?.includes(attrName);
      if (!allowed) {
        element.removeAttribute(attribute.name);
      }
    });

    if (tagName === "A") {
      const href = element.getAttribute("href") || "";
      const normalizedHref = href.trim();
      if (!normalizedHref || normalizedHref.startsWith("javascript:")) {
        element.removeAttribute("href");
        element.removeAttribute("target");
        element.removeAttribute("rel");
      } else {
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
      }
    }
  });

  return template.innerHTML;
}

function updatePlaceholderVisibility() {
  if (!placeholder) return;
  const hasBlocks = canvas.querySelectorAll(".block").length > 0;
  placeholder.hidden = hasBlocks;
}

function createResizeHandles(block) {
  const directions = [
    { name: "top-left", edges: { top: true, left: true } },
    { name: "top-right", edges: { top: true, right: true } },
    { name: "bottom-left", edges: { bottom: true, left: true } },
    { name: "bottom-right", edges: { bottom: true, right: true } },
  ];

  directions.forEach((direction) => {
    const handle = document.createElement("span");
    handle.className = "resize-handle";
    handle.dataset.direction = direction.name;
    handle.dataset.edges = JSON.stringify(direction.edges);
    handle.tabIndex = -1;
    block.append(handle);
  });
}

function makeBlockInteractive(block) {
  block.addEventListener("pointerdown", () => setActiveBlock(block));
  block.addEventListener("focusin", () => setActiveBlock(block));
  block.addEventListener("focusout", () => block.classList.remove("is-active"));
}

function setActiveBlock(block) {
  canvas.querySelectorAll(".block").forEach((node) => {
    node.classList.remove("is-active");
  });
  block.classList.add("is-active");
  highestZIndex += 1;
  block.style.zIndex = highestZIndex;
}

function getInitialPosition() {
  const offset = 48 + (blockCount % 5) * 32;
  return { x: offset, y: offset };
}

function defaultBlockName(type) {
  switch (type) {
    case "text":
      return `Text block ${blockCount}`;
    case "image":
      return `Image block ${blockCount}`;
    case "module":
      return `Module block ${blockCount}`;
    default:
      return "Block";
  }
}

function createBlockShell(type, data = {}) {
  blockCount += 1;
  const block = document.createElement("article");
  block.className = `block block--${type}`;
  block.dataset.type = type;
  block.tabIndex = 0;

  const blockId =
    data.id || window.crypto?.randomUUID?.() || `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  block.dataset.id = blockId;

  const header = document.createElement("div");
  header.className = "block__header";

  const title = document.createElement("span");
  title.className = "block__title";
  const resolvedName = data.name || defaultBlockName(type);
  title.textContent = resolvedName;
  block.dataset.name = resolvedName;

  const actions = document.createElement("div");
  actions.className = "block__actions";

  if (type === "text") {
    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.className = "block__action";
    renameButton.dataset.action = "rename";
    renameButton.textContent = "Rename";
    actions.append(renameButton);
  }

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "block__action block__action--remove";
  removeButton.dataset.action = "remove";
  removeButton.textContent = "Remove";
  actions.append(removeButton);

  header.append(title, actions);

  const body = document.createElement("div");
  body.className = "block__body";

  const message = document.createElement("p");
  message.className = "block__message";
  message.setAttribute("role", "status");
  message.hidden = true;

  block.append(header, body, message);

  createResizeHandles(block);
  makeBlockInteractive(block);

  const position =
    typeof data.x === "number" && typeof data.y === "number"
      ? { x: data.x, y: data.y }
      : getInitialPosition();
  setBlockPosition(block, position.x, position.y);

  const zIndex = typeof data.zIndex === "number" ? data.zIndex : highestZIndex;
  block.style.zIndex = zIndex;
  highestZIndex = Math.max(highestZIndex, zIndex);

  return block;
}

function getBlockBody(block) {
  return block.querySelector(".block__body");
}

function setBlockPosition(block, x, y) {
  block.dataset.x = x;
  block.dataset.y = y;
  block.style.transform = `translate(${x}px, ${y}px)`;
}

function moveCaretToEnd(element) {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function showBlockMessage(block, text, { tone = "info", duration = 3000 } = {}) {
  const messageElement = block.querySelector(".block__message");
  if (!messageElement) return;

  if (messageTimeouts.has(block)) {
    window.clearTimeout(messageTimeouts.get(block));
    messageTimeouts.delete(block);
  }

  if (!text) {
    messageElement.hidden = true;
    messageElement.textContent = "";
    messageElement.removeAttribute("data-tone");
    return;
  }

  messageElement.dataset.tone = tone;
  messageElement.textContent = text;
  messageElement.hidden = false;

  if (duration > 0) {
    const timeoutId = window.setTimeout(() => {
      messageElement.hidden = true;
      messageElement.textContent = "";
      messageElement.removeAttribute("data-tone");
      messageTimeouts.delete(block);
    }, duration);
    messageTimeouts.set(block, timeoutId);
  }
}

function scheduleSave() {
  window.clearTimeout(saveTimeoutId);
  saveTimeoutId = window.setTimeout(saveState, SAVE_DEBOUNCE_MS);
}

function resolveImageUrl(candidate) {
  const fallback =
    "https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=600";
  if (!candidate) return fallback;
  try {
    const url = new URL(candidate, window.location.href);
    if (["http:", "https:"].includes(url.protocol)) {
      return url.href;
    }
    return fallback;
  } catch (error) {
    return fallback;
  }
}

function attachTextEditor(block, editor) {
  let lastKnownHTML = sanitizeHTML(editor.innerHTML) || "<p></p>";
  editor.innerHTML = lastKnownHTML;

  editor.addEventListener("input", () => {
    const plainTextLength = editor.textContent?.length || 0;
    if (plainTextLength > MAX_TEXT_LENGTH) {
      showBlockMessage(block, `Text limit of ${MAX_TEXT_LENGTH} characters reached.`, {
        tone: "error",
        duration: 4000,
      });
      editor.innerHTML = lastKnownHTML;
      moveCaretToEnd(editor);
      return;
    }

    const sanitized = sanitizeHTML(editor.innerHTML);
    if (sanitized !== editor.innerHTML) {
      editor.innerHTML = sanitized;
      moveCaretToEnd(editor);
      showBlockMessage(block, "Some formatting was adjusted for safety.");
    }

    lastKnownHTML = sanitized || "<p></p>";
    scheduleSave();
  });

  editor.addEventListener("blur", () => {
    editor.innerHTML = lastKnownHTML;
    scheduleSave();
  });

  editor.addEventListener("paste", (event) => {
    event.preventDefault();
    const text = (event.clipboardData || window.clipboardData)?.getData("text") || "";
    document.execCommand("insertText", false, text);
  });
}

function createTextBlock(data = {}) {
  const block = createBlockShell("text", data);
  const body = getBlockBody(block);

  const editor = document.createElement("div");
  editor.contentEditable = "true";
  editor.setAttribute("role", "textbox");
  editor.setAttribute("aria-label", "Rich text block");
  editor.setAttribute("aria-multiline", "true");
  editor.innerHTML = sanitizeHTML(data.content || "<p>Edit this text...</p>");

  body.append(editor);
  block.style.width = `${typeof data.width === "number" ? data.width : 320}px`;
  block.style.height = `${typeof data.height === "number" ? data.height : 180}px`;

  attachTextEditor(block, editor);
  return block;
}

function createImageBlock(data = {}) {
  const block = createBlockShell("image", data);
  const body = getBlockBody(block);

  let providedUrl = data.src;
  if (!providedUrl) {
    const response = window.prompt("Paste an image URL to embed (leave empty for a sample image):");
    providedUrl = response?.trim();
  }

  const image = document.createElement("img");
  image.src = resolveImageUrl(providedUrl);
  image.alt = "User supplied block image";
  image.loading = "lazy";

  body.append(image);
  block.style.width = `${typeof data.width === "number" ? data.width : 320}px`;
  block.style.height = `${typeof data.height === "number" ? data.height : 220}px`;

  return block;
}

function createModuleBlock(data = {}) {
  const block = createBlockShell("module", data);
  const body = getBlockBody(block);

  const moduleHeader = document.createElement("header");
  moduleHeader.textContent = data.header || "Reusable Module";

  const moduleBody = document.createElement("div");
  moduleBody.className = "module-content";
  moduleBody.innerHTML = sanitizeHTML(
    data.html || "<p>Add any custom HTML or embed code here to build a module snippet.</p>"
  );

  body.append(moduleHeader, moduleBody);
  block.style.width = `${typeof data.width === "number" ? data.width : 360}px`;
  block.style.height = `${typeof data.height === "number" ? data.height : 200}px`;

  return block;
}

function addBlockToCanvas(block, { skipActivation = false, persist = true } = {}) {
  canvas.append(block);
  updatePlaceholderVisibility();
  if (!skipActivation) {
    setActiveBlock(block);
  }
  if (persist) {
    scheduleSave();
  }
}

toolbar.addEventListener("click", (event) => {
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

canvas.addEventListener("click", (event) => {
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

function saveState() {
  if (!window.localStorage) return;
  try {
    const blocks = Array.from(canvas.querySelectorAll(".block")).map((block) => {
      const type = block.dataset.type;
      const base = {
        id: block.dataset.id,
        type,
        x: parseFloat(block.dataset.x) || 0,
        y: parseFloat(block.dataset.y) || 0,
        width: parseFloat(block.style.width) || block.offsetWidth,
        height: parseFloat(block.style.height) || block.offsetHeight,
        zIndex: parseInt(block.style.zIndex || "1", 10),
        name: block.dataset.name,
      };

      if (type === "text") {
        const editor = block.querySelector("[contenteditable]");
        base.content = sanitizeHTML(editor?.innerHTML || "");
      } else if (type === "image") {
        const image = block.querySelector("img");
        base.src = image?.src || "";
      } else if (type === "module") {
        const body = getBlockBody(block);
        const header = body?.querySelector("header");
        const moduleContent = body?.querySelector(".module-content");
        base.html = moduleContent?.innerHTML || "";
        if (header) {
          base.header = header.textContent;
        }
      }

      return base;
    });

    const payload = JSON.stringify({ blocks });
    window.localStorage.setItem(STORAGE_KEY, payload);
  } catch (error) {
    console.error("Unable to save editor state", error);
  }
}

function restoreState() {
  if (!window.localStorage) return;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      updatePlaceholderVisibility();
      return;
    }

    const state = JSON.parse(stored);
    if (!state?.blocks?.length) {
      updatePlaceholderVisibility();
      return;
    }

    state.blocks.forEach((data) => {
      let block;
      switch (data.type) {
        case "text":
          block = createTextBlock(data);
          break;
        case "image":
          block = createImageBlock(data);
          break;
        case "module":
          block = createModuleBlock(data);
          break;
        default:
          break;
      }

      if (!block) return;

      block.dataset.id = data.id || block.dataset.id;

      if (typeof data.x === "number" && typeof data.y === "number") {
        setBlockPosition(block, data.x, data.y);
      }

      if (typeof data.width === "number") {
        block.style.width = `${data.width}px`;
      }

      if (typeof data.height === "number") {
        block.style.height = `${data.height}px`;
      }

      if (typeof data.zIndex === "number") {
        block.style.zIndex = data.zIndex;
        highestZIndex = Math.max(highestZIndex, data.zIndex);
      }

      if (data.name) {
        block.dataset.name = data.name;
        const title = block.querySelector(".block__title");
        if (title) {
          title.textContent = data.name;
        }
      }

      addBlockToCanvas(block, { skipActivation: true, persist: false });
    });

    updatePlaceholderVisibility();
    saveState();
  } catch (error) {
    console.error("Unable to restore editor state", error);
  }
}

updatePlaceholderVisibility();

interact(".block").draggable({
  listeners: {
    start(event) {
      setActiveBlock(event.target);
    },
    move(event) {
      const target = event.target;
      const x = (parseFloat(target.dataset.x) || 0) + event.dx;
      const y = (parseFloat(target.dataset.y) || 0) + event.dy;

      setBlockPosition(target, x, y);
    },
    end() {
      scheduleSave();
    },
  },
  inertia: true,
  modifiers: [
    interact.modifiers.restrictRect({
      restriction: "parent",
      endOnly: true,
    }),
  ],
  allowFrom: ".block, .resize-handle",
});

interact(".block").resizable({
  edges: { left: true, right: true, bottom: true, top: true },
  listeners: {
    start(event) {
      setActiveBlock(event.target);
    },
    move(event) {
      const target = event.target;
      let x = parseFloat(target.dataset.x) || 0;
      let y = parseFloat(target.dataset.y) || 0;

      target.style.width = `${event.rect.width}px`;
      target.style.height = `${event.rect.height}px`;

      x += event.deltaRect.left;
      y += event.deltaRect.top;

      setBlockPosition(target, x, y);
    },
    end() {
      scheduleSave();
    },
  },
  modifiers: [
    interact.modifiers.restrictEdges({
      outer: "parent",
    }),
    interact.modifiers.restrictSize({
      min: { width: 180, height: 120 },
    }),
  ],
});

canvas.addEventListener("dblclick", (event) => {
  if (event.target === canvas) {
    addBlockToCanvas(createTextBlock());
  }
});

restoreState();
