import React from 'react';
import { slides } from '../data/slides';
import { useSessionStore } from '../stores/sessionStore';

export const SlideStage: React.FC = () => {
  const { currentSlideIndex, setCurrentSlide } = useSessionStore();
  const totalSlides = slides.length;

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlide(currentSlideIndex - 1);
    }
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlide(currentSlideIndex + 1);
    }
  };

  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="stage-viewport">
      <div
        className={`slide-stage ${currentSlide.className}`}
        dangerouslySetInnerHTML={{ __html: currentSlide.html }}
      />

      {/* Navigation Buttons */}
      <button
        className="slide-nav slide-nav-prev"
        aria-label="Previous Slide"
        onClick={handlePrevSlide}
        disabled={currentSlideIndex === 0}
        style={{ opacity: currentSlideIndex === 0 ? 0.3 : 1 }}
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <button
        className="slide-nav slide-nav-next"
        aria-label="Next Slide"
        onClick={handleNextSlide}
        disabled={currentSlideIndex === totalSlides - 1}
        style={{ opacity: currentSlideIndex === totalSlides - 1 ? 0.3 : 1 }}
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  );
};
