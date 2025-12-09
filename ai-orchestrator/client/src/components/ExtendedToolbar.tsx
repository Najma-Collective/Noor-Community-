import React, { useEffect, useState } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { slideMetadata } from '../config/slideMetadata';

export const ExtendedToolbar: React.FC = () => {
  const { currentSlideIndex, currentPhase, phaseStartTime } = useSessionStore();
  const [elapsedTime, setElapsedTime] = useState(0);
  const currentMetadata = slideMetadata[currentSlideIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - phaseStartTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [phaseStartTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      'warmer': 'Warmer',
      'controlled': 'Controlled Practice',
      'semi-controlled': 'Semi-Controlled Practice',
      'main-task': 'Main Task',
      'reflection': 'Reflection',
      'closing': 'Closing'
    };
    return labels[phase] || phase;
  };

  return (
    <header className="deck-toolbar extended-toolbar">
      <div className="toolbar-brand">
        <i className="fa-solid fa-seedling" style={{ color: 'var(--primary-sage)' }}></i>
        <span>Noor Community · AI Orchestrator</span>
      </div>

      <div className="toolbar-center">
        <div className="phase-indicator">
          <span className="phase-label">{getPhaseLabel(currentPhase)}</span>
          <span className="activity-type">{currentMetadata.activityType.replace(/_/g, ' ')}</span>
        </div>
        <div className="phase-timer">
          <i className="fa-solid fa-clock"></i>
          <span>{formatTime(elapsedTime)}</span>
          <span className="estimated">/ ~{currentMetadata.estimatedDuration}m</span>
        </div>
      </div>

      <div className="slide-counter">
        {currentSlideIndex + 1} / {slideMetadata.length}
      </div>
    </header>
  );
};
