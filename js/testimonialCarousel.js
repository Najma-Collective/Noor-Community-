class TestimonialCarousel {
  constructor(root) {
    this.root = root;
    this.viewport = root.querySelector('[data-carousel-viewport]');
    this.slides = Array.from(root.querySelectorAll('[data-carousel-slide]'));
    this.prevButton = root.querySelector('[data-carousel-prev]');
    this.nextButton = root.querySelector('[data-carousel-next]');
    this.status = root.querySelector('[data-carousel-status]');
    this.currentIndex = 0;
    this.touchStartX = null;

    if (!this.viewport || this.slides.length === 0) {
      return;
    }

    this.enhance();
  }

  enhance() {
    this.totalSlides = this.slides.length;

    if (this.totalSlides <= 1) {
      this.prevButton?.setAttribute('hidden', '');
      this.nextButton?.setAttribute('hidden', '');
      return;
    }

    this.root.setAttribute('data-carousel-ready', '');
    this.prevButton?.removeAttribute('hidden');
    this.nextButton?.removeAttribute('hidden');
    this.viewport.setAttribute('role', 'region');
    this.viewport.setAttribute('aria-live', 'polite');
    this.viewport.setAttribute('aria-label', this.root.dataset.carouselLabel || 'Testimonials');

    this.bindEvents();
    this.updateSlides();
  }

  bindEvents() {
    this.prevButton?.addEventListener('click', () => this.moveTo(this.currentIndex - 1));
    this.nextButton?.addEventListener('click', () => this.moveTo(this.currentIndex + 1));

    this.root.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.moveTo(this.currentIndex - 1);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.moveTo(this.currentIndex + 1);
      }
    });

    this.viewport.addEventListener('touchstart', (event) => {
      if (event.changedTouches && event.changedTouches.length) {
        this.touchStartX = event.changedTouches[0].clientX;
      }
    }, { passive: true });

    this.viewport.addEventListener('touchend', (event) => {
      if (this.touchStartX === null || !(event.changedTouches && event.changedTouches.length)) {
        return;
      }

      const deltaX = event.changedTouches[0].clientX - this.touchStartX;
      this.touchStartX = null;

      if (Math.abs(deltaX) < 45) {
        return;
      }

      if (deltaX < 0) {
        this.moveTo(this.currentIndex + 1);
      } else {
        this.moveTo(this.currentIndex - 1);
      }
    }, { passive: true });

    this.viewport.addEventListener('touchcancel', () => {
      this.touchStartX = null;
    });
  }

  moveTo(targetIndex) {
    const nextIndex = (targetIndex + this.totalSlides) % this.totalSlides;
    if (nextIndex === this.currentIndex) {
      return;
    }

    this.currentIndex = nextIndex;
    this.updateSlides();
  }

  updateSlides() {
    this.slides.forEach((slide, index) => {
      const isActive = index === this.currentIndex;
      slide.classList.toggle('is-active', isActive);
      if (isActive) {
        slide.removeAttribute('aria-hidden');
      } else {
        slide.setAttribute('aria-hidden', 'true');
      }
    });

    if (this.status) {
      const activeSlide = this.slides[this.currentIndex];
      const caption = activeSlide?.querySelector('figcaption');
      const captionText = caption ? caption.textContent.replace(/^[\s—-]+/, '').trim() : '';
      const detail = captionText ? ` featuring ${captionText}` : '';
      this.status.textContent = `Showing testimonial ${this.currentIndex + 1} of ${this.totalSlides}${detail}`;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const carousels = document.querySelectorAll('[data-carousel]');
  carousels.forEach((carousel) => new TestimonialCarousel(carousel));
});
