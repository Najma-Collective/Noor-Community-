import { useEffect } from 'react';
import { ExtendedToolbar } from './components/ExtendedToolbar';
import { SlideStage } from './components/SlideStage';
import { AIInteractionPanel } from './components/AIInteractionPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { useSessionStore } from './stores/sessionStore';
import { slideMetadata } from './config/slideMetadata';
import './styles.css';

function App() {
  const { currentSlideIndex, setSessionState, addMessage } = useSessionStore();

  useEffect(() => {
    // Update phase based on current slide
    const metadata = slideMetadata[currentSlideIndex];
    setSessionState({
      currentPhase: metadata.phase,
      phaseStartTime: Date.now()
    });

    // Sarah sends intro message for the new slide
    const sarahMessage = {
      id: `sarah-${currentSlideIndex}-${Date.now()}`,
      sender: 'Sarah',
      senderType: 'teacher' as const,
      content: metadata.sarahIntro,
      timestamp: Date.now(),
      recipients: ['Everyone']
    };

    // Delay Sarah's message slightly for natural feel
    setTimeout(() => {
      addMessage(sarahMessage);
    }, 500);
  }, [currentSlideIndex]);

  useEffect(() => {
    // Initial welcome message from Sarah
    const welcomeMessage = {
      id: 'sarah-welcome',
      sender: 'Sarah',
      senderType: 'teacher' as const,
      content: "Hello! Welcome to today's lesson on NGO project planning. Can you see the slide clearly? Let me know you're ready by saying hello!",
      timestamp: Date.now(),
      recipients: ['Everyone']
    };
    addMessage(welcomeMessage);
  }, []);

  return (
    <div className="deck-app">
      <ExtendedToolbar />

      <main className="deck-workspace-with-panel">
        <div className="slide-area">
          <SlideStage />
        </div>

        <div className="panel-area">
          <SettingsPanel />
          <AIInteractionPanel />
        </div>
      </main>
    </div>
  );
}

export default App;
