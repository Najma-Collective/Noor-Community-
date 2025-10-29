import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SANDBOX_ROOT = join(__dirname, '..', '..');

const CSS_RELATIVE_PATHS = ['sandbox-css.css', 'sandbox-theme.css', 'activity-builder.css'];

const FONT_AWESOME_FAMILIES = new Set([
  'fa',
  'fas',
  'far',
  'fal',
  'fad',
  'fab',
  'fa-solid',
  'fa-regular',
  'fa-light',
  'fa-thin',
  'fa-duotone',
]);

const EXTRA_ALLOWED_CLASSES = new Set([
  'hidden',
  'gap',
  'content-wrapper',
  'content-header',
  'content-body',
  'content-footer',
  'category-columns',
]);

const ADDITIONAL_ALLOWED_PATTERNS = [
  /^lesson-slide--/,
  /-layout$/,
  /-header$/,
  /^lesson-/,
  /^learning-/,
  /^model-/,
  /^interactive-/,
  /^communicative-/,
  /^pronunciation-/,
  /^reflection-/, 
  /^grounding-/, 
  /^topic-/, 
  /^guided-/, 
  /^discovery-/, 
  /^creative-/, 
  /^task-/, 
  /^genre-/, 
  /^linguistic-/, 
  /^text-/, 
  /^jumbled-/, 
  /^scaffolded-/, 
  /^independent-/, 
  /^card-/, 
  /^pill-/, 
  /^stack-/, 
  /^gallery-/, 
  /^mosaic-/, 
  /^board-/, 
  /^token-/, 
  /^activity-/, 
  /^action-/, 
  /^mc-/, 
  /^gapfill/, 
  /^linking-/, 
  /^dropdown-/, 
  /^grid-/, 
  /^ranking-/, 
  /^table-/, 
  /^quiz-/, 
  /^team-/, 
  /^practice-/, 
  /^module-/, 
  /^feedback-/, 
  /^reporting-/, 
  /^feature-/, 
  /^reconstruction-/, 
  /^sequencing-/, 
  /^joint-/, 
  /^checklist-/, 
  /^pill-gallery-/, 
  /^stack-card/, 
  /^pill-gallery/, 
  /^deck-/, 
  /^slide-/, 
  /^blank-/, 
  /^builder-/, 
  /^canvas-/, 
  /^split-/, 
  /^image-/, 
  /^mindmap/, 
  /^audio-/, 
  /^toast-/, 
  /^rubric-/,
  /^status-/,
  /^hint$/,
  /^note$/,
  /^title$/,
];

const CLASS_PATTERN = /\.([_a-zA-Z][_a-zA-Z0-9-]*)/g;

export function extractClassesFromCss(css = '') {
  const classes = new Set();
  let match;
  while ((match = CLASS_PATTERN.exec(css)) !== null) {
    const [, className] = match;
    if (!className) {
      continue;
    }
    classes.add(className);
  }
  return classes;
}

export async function loadSandboxClassAllowlist({ rootDir = SANDBOX_ROOT } = {}) {
  const allowed = new Set();
  for (const relativePath of CSS_RELATIVE_PATHS) {
    const absolutePath = join(rootDir, relativePath);
    try {
      const css = await readFile(absolutePath, 'utf8');
      extractClassesFromCss(css).forEach((className) => allowed.add(className));
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        continue;
      }
      throw error;
    }
  }
  EXTRA_ALLOWED_CLASSES.forEach((className) => allowed.add(className));
  return {
    allowed,
    isAllowed(className = '') {
      if (!className) {
        return true;
      }
      if (allowed.has(className)) {
        return true;
      }
      if (className.startsWith('fa-')) {
        return true;
      }
      if (FONT_AWESOME_FAMILIES.has(className)) {
        return true;
      }
      if (ADDITIONAL_ALLOWED_PATTERNS.some((pattern) => pattern.test(className))) {
        return true;
      }
      return false;
    },
  };
}

export function collectUnknownClasses(root, isAllowed) {
  const violations = new Map();
  if (!root || typeof root.querySelectorAll !== 'function') {
    return violations;
  }
  const nodes = new Set([root]);
  root.querySelectorAll('*').forEach((node) => nodes.add(node));
  nodes.forEach((node) => {
    const defaultView = node?.ownerDocument?.defaultView ?? root?.ownerDocument?.defaultView ?? globalThis;
    const ElementCtor = defaultView?.Element ?? globalThis.Element;
    if (typeof ElementCtor !== 'function' || !(node instanceof ElementCtor)) {
      return;
    }
    node.classList.forEach((className) => {
      if (!isAllowed(className)) {
        const list = violations.get(className) ?? [];
        list.push(node);
        violations.set(className, list);
      }
    });
  });
  return violations;
}
