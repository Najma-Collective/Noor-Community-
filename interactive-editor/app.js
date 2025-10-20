const canvas = document.getElementById("editor-canvas");
const toolbar = document.querySelector(".toolbar");
const placeholder = canvas.querySelector(".canvas__placeholder");

let blockCount = 0;
let highestZIndex = 1;

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

function createTextBlock() {
  const block = createBlockShell("text");
  const editor = document.createElement("div");
  editor.contentEditable = "true";
  editor.setAttribute("role", "textbox");
  editor.setAttribute("aria-label", "Rich text block");
  editor.setAttribute("aria-multiline", "true");
  editor.innerHTML = "<p>Edit this text...</p>";
  block.append(editor);
  block.style.width = "320px";
  block.style.height = "180px";
  return block;
}

function createImageBlock() {
  const block = createBlockShell("image");
  const url = window.prompt(
    "Paste an image URL to embed (leave empty for a sample image):"
  );
  const sanitizedUrl = url?.trim()
    ? url.trim()
    : "https://images.pexels.com/photos/1103970/pexels-photo-1103970.jpeg?auto=compress&cs=tinysrgb&w=600";
  const image = document.createElement("img");
  image.src = sanitizedUrl;
  image.alt = "User supplied block image";
  image.loading = "lazy";
  block.append(image);
  block.style.width = "320px";
  block.style.height = "220px";
  return block;
}

function createModuleBlock() {
  const block = createBlockShell("module");
  const moduleHeader = document.createElement("header");
  moduleHeader.textContent = "Reusable Module";
  const moduleBody = document.createElement("div");
  moduleBody.className = "module-content";
  moduleBody.innerHTML =
    "<p>Add any custom HTML or embed code here to build a module snippet.</p>";
  block.append(moduleHeader, moduleBody);
  block.style.width = "360px";
  block.style.height = "200px";
  return block;
}

function createBlockShell(type) {
  blockCount += 1;
  const block = document.createElement("article");
  block.className = `block block--${type}`;
  block.dataset.type = type;
  block.tabIndex = 0;
  createResizeHandles(block);
  makeBlockInteractive(block);

  const { x, y } = getInitialPosition();
  block.dataset.x = x;
  block.dataset.y = y;
  block.style.transform = `translate(${x}px, ${y}px)`;
  block.style.zIndex = highestZIndex;

  return block;
}

function addBlockToCanvas(block) {
  canvas.append(block);
  updatePlaceholderVisibility();
  setActiveBlock(block);
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

      target.dataset.x = x;
      target.dataset.y = y;
      target.style.transform = `translate(${x}px, ${y}px)`;
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

      target.dataset.x = x;
      target.dataset.y = y;
      target.style.transform = `translate(${x}px, ${y}px)`;
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
