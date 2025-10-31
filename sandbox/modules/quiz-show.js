import { onDocumentReady, markInitialised } from './utils.js';

const initQuizShow = (root) => {
  if (!markInitialised(root)) {
    return;
  }

  const stage = root.querySelector('.quiz-stage');
  if (!stage) {
    return;
  }

  const slides = Array.from(stage.querySelectorAll('.quiz-slide'));
  if (!slides.length) {
    return;
  }

  const defaultTime = Number(stage.dataset.defaultTime) || 0;
  const prevBtn = root.querySelector('#quiz-prev');
  const nextBtn = root.querySelector('#quiz-next');
  const timerDisplay = root.querySelector('#quiz-timer-value');
  const progressDisplay = root.querySelector('#quiz-progress');

  let activeIndex = slides.findIndex((slide) => slide.classList.contains('is-active'));
  if (activeIndex < 0) {
    activeIndex = 0;
  }
  let timerId = null;
  let remaining = 0;

  const getSlideTime = (slide) => {
    const raw = Number(slide?.dataset.time);
    if (Number.isFinite(raw) && raw > 0) {
      return Math.round(raw);
    }
    return defaultTime > 0 ? defaultTime : 60;
  };

  const updateButtons = () => {
    if (prevBtn) {
      prevBtn.disabled = activeIndex === 0;
    }
    if (nextBtn) {
      const label = nextBtn.querySelector('span');
      if (label) {
        label.textContent = activeIndex === slides.length - 1 ? 'Restart' : 'Next';
      }
    }
  };

  const setProgress = () => {
    if (progressDisplay) {
      progressDisplay.textContent = `Question ${activeIndex + 1} of ${slides.length}`;
    }
  };

  const updateTimerLabel = () => {
    const value = `${Math.max(0, Math.ceil(remaining))}s`;
    if (timerDisplay) {
      timerDisplay.textContent = value;
    }
    const currentSlide = slides[activeIndex];
    const slideTimer = currentSlide?.querySelector('[data-slide-timer]');
    if (slideTimer) {
      slideTimer.textContent = value;
    }
  };

  const clearTimer = () => {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  const startTimer = (duration) => {
    clearTimer();
    remaining = duration;
    updateTimerLabel();
    timerId = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        remaining = 0;
        updateTimerLabel();
        clearTimer();
        const current = slides[activeIndex];
        if (current) {
          current.classList.add('time-up');
        }
      } else {
        updateTimerLabel();
      }
    }, 1000);
  };

  const activateSlide = (index) => {
    if (index < 0 || index >= slides.length) {
      return;
    }
    slides.forEach((slide, idx) => {
      slide.classList.toggle('is-active', idx === index);
      if (idx === index) {
        slide.classList.remove('is-revealed', 'time-up');
      }
    });
    activeIndex = index;
    setProgress();
    updateButtons();
    startTimer(getSlideTime(slides[activeIndex]));
  };

  prevBtn?.addEventListener('click', () => {
    if (activeIndex > 0) {
      activateSlide(activeIndex - 1);
    }
  });

  nextBtn?.addEventListener('click', () => {
    if (activeIndex === slides.length - 1) {
      activateSlide(0);
    } else {
      activateSlide(activeIndex + 1);
    }
  });

  stage.addEventListener('click', (event) => {
    const revealBtn = event.target.closest('[data-role="reveal"]');
    if (!revealBtn) {
      return;
    }
    const slide = revealBtn.closest('.quiz-slide');
    if (!slide) {
      return;
    }
    const isRevealed = slide.classList.toggle('is-revealed');
    const labelSpan = revealBtn.querySelector('span');
    if (labelSpan) {
      labelSpan.textContent = isRevealed ? 'Hide answer' : 'Reveal answer';
    }
    const icon = revealBtn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-eye', !isRevealed);
      icon.classList.toggle('fa-eye-slash', isRevealed);
    }
    if (isRevealed) {
      clearTimer();
      remaining = 0;
      updateTimerLabel();
    } else {
      startTimer(getSlideTime(slide));
    }
  });

  const scoreboard = stage.querySelector('.quiz-scoreboard');
  if (scoreboard) {
    scoreboard.addEventListener('click', (event) => {
      const button = event.target.closest('.score-btn');
      if (!button) {
        return;
      }
      const teamCard = button.closest('.team-card');
      if (!teamCard) {
        return;
      }
      const teamName = teamCard.querySelector('.team-name')?.textContent || 'team';
      const scoreEl = teamCard.querySelector('[data-role="score"]');
      let score = Number(teamCard.dataset.score || '0');
      score += 1;
      teamCard.dataset.score = score;
      if (scoreEl) {
        scoreEl.textContent = score;
      }
      teamCard.classList.remove('bursting');
      void teamCard.offsetWidth;
      teamCard.classList.add('bursting');
      button.setAttribute('aria-label', `Add a point to ${teamName} (current: ${score})`);
    });

    scoreboard.addEventListener('animationend', (event) => {
      if (event.target.classList.contains('burst')) {
        event.target.parentElement?.classList.remove('bursting');
      }
    });
  }

  activateSlide(activeIndex);
};

const bootstrap = () => {
  document
    .querySelectorAll('.quiz-show[data-module="quiz-show"]')
    .forEach((root) => initQuizShow(root));
};

onDocumentReady(bootstrap);
