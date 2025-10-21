import { initSlideNavigator } from "../../js/slideNavigator.js";

const stageViewport = document.getElementById("stage-viewport");
const slides = Array.from(stageViewport?.querySelectorAll(".slide-stage") ?? []);
const counter = document.querySelector("[data-slide-counter]");
const nextBtn = document.querySelector('[data-action="next"]');
const prevBtn = document.querySelector('[data-action="prev"]');
let slideNavigator = null;

let activeIndex = Math.max(
  0,
  slides.findIndex((slide) => !slide.classList.contains("hidden")),
);
if (!Number.isFinite(activeIndex) || activeIndex < 0) {
  activeIndex = 0;
}

if (!slides.length) {
  if (counter) {
    counter.textContent = "No slides available";
  }
  if (prevBtn) {
    prevBtn.disabled = true;
    prevBtn.setAttribute("aria-disabled", "true");
  }
  if (nextBtn) {
    nextBtn.disabled = true;
    nextBtn.setAttribute("aria-disabled", "true");
  }
}

function getSlideTitle(slide, index) {
  if (!(slide instanceof HTMLElement)) {
    return `Slide ${index + 1}`;
  }

  if (slide.dataset.stageTitle) {
    return slide.dataset.stageTitle;
  }

  const heading = slide.querySelector("h1, h2");
  if (heading) {
    return heading.textContent?.trim() || `Slide ${index + 1}`;
  }

  return `Slide ${index + 1}`;
}

function setSlideVisibility(slide, isActive) {
  slide.classList.toggle("hidden", !isActive);
  slide.setAttribute("aria-hidden", isActive ? "false" : "true");
  if (isActive) {
    const inner = slide.querySelector(".slide-inner");
    if (inner instanceof HTMLElement) {
      inner.scrollTop = 0;
    }
  }
}

function updateCounter() {
  if (counter) {
    counter.textContent = `Slide ${activeIndex + 1} of ${slides.length}`;
  }
}

function updateButtons() {
  const atStart = activeIndex <= 0;
  const atEnd = activeIndex >= slides.length - 1;

  if (prevBtn) {
    prevBtn.disabled = atStart;
    prevBtn.setAttribute("aria-disabled", atStart ? "true" : "false");
  }

  if (nextBtn) {
    nextBtn.disabled = atEnd;
    nextBtn.setAttribute("aria-disabled", atEnd ? "true" : "false");
  }
}

function showSlide(index) {
  const target = Number(index);
  if (!Number.isInteger(target) || target < 0 || target >= slides.length) {
    return;
  }

  if (target === activeIndex) {
    return;
  }

  slides.forEach((slide, slideIndex) => {
    setSlideVisibility(slide, slideIndex === target);
  });

  activeIndex = target;
  updateCounter();
  updateButtons();
  slideNavigator?.setActive(activeIndex);
}

if (slides.length) {
  slides.forEach((slide, index) => {
    setSlideVisibility(slide, index === activeIndex);
  });
  updateCounter();
  updateButtons();

  const slideNavigator = initSlideNavigator({
    stageViewport,
    onSelectSlide: (index) => {
      showSlide(index);
    },
  });

  slideNavigator?.updateSlides(
    slides.map((slide, index) => ({
      stage: `${index + 1}`,
      title: getSlideTitle(slide, index),
    })),
  );
  slideNavigator?.setActive(activeIndex);

  prevBtn?.addEventListener("click", () => {
    if (activeIndex > 0) {
      showSlide(activeIndex - 1);
    }
  });

  nextBtn?.addEventListener("click", () => {
    if (activeIndex < slides.length - 1) {
      showSlide(activeIndex + 1);
    }
  });
}
