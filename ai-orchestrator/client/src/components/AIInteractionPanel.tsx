import React, { useState, useRef, useEffect } from 'react';
import { useSessionStore } from '../stores/sessionStore';
import { getAIService } from '../services/aiService';
import { slideMetadata } from '../config/slideMetadata';

export const AIInteractionPanel: React.FC = () => {
  const { messages, learners, currentSlideIndex, addMessage } = useSessionStore();
  const [messageInput, setMessageInput] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('Everyone');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isThinking) return;

    const learnerName = 'You'; // In full version, get from session
    const sessionState = useSessionStore.getState();
    const currentMetadata = slideMetadata[currentSlideIndex];

    // Add learner message
    const learnerMessage = {
      id: `${Date.now()}`,
      sender: learnerName,
      senderType: 'learner' as const,
      content: messageInput,
      timestamp: Date.now(),
      recipients: [selectedRecipient]
    };

    addMessage(learnerMessage);
    setMessageInput('');
    setIsThinking(true);

    // Get AI response
    try {
      const aiService = getAIService();
      const response = await aiService.generateResponse(
        messageInput,
        learnerName,
        sessionState,
        currentMetadata
      );

      // Add Sarah's response
      const sarahMessage = {
        id: `sarah-${Date.now()}`,
        sender: 'Sarah',
        senderType: 'teacher' as const,
        content: response,
        timestamp: Date.now(),
        recipients: ['Everyone']
      };

      setTimeout(() => {
        addMessage(sarahMessage);
        setIsThinking(false);
      }, 800); // Slight delay for natural feel
    } catch (error) {
      console.error('Error getting AI response:', error);
      setIsThinking(false);
    }
  };

  return (
    <div className="interaction-panel">
      <div className="panel-header">
        <h3>
          <i className="fa-solid fa-comments"></i>
          Lesson Chat
        </h3>
        {learners.length > 0 && (
          <div className="participants-count">
            {learners.length} learner{learners.length !== 1 ? 's' : ''} + Sarah
          </div>
        )}
      </div>

      {/* Messages Log */}
      <div className="messages-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.senderType === 'teacher' ? 'teacher-message' : 'learner-message'}`}
          >
            <div className="message-header">
              <span className="message-sender">
                {msg.senderType === 'teacher' && <i className="fa-solid fa-user-tie"></i>}
                {msg.senderType === 'learner' && <i className="fa-solid fa-user"></i>}
                {msg.sender}
              </span>
              <span className="message-time">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="message-content">{msg.content}</div>
            {msg.recipients.length > 0 && msg.recipients[0] !== 'Everyone' && (
              <div className="message-recipients">
                To: {msg.recipients.join(', ')}
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="message teacher-message thinking">
            <div className="message-header">
              <span className="message-sender">
                <i className="fa-solid fa-user-tie"></i>
                Sarah
              </span>
            </div>
            <div className="message-content">
              <i className="fa-solid fa-ellipsis"></i>
              <span style={{ marginLeft: '0.5rem' }}>thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form className="message-input-form" onSubmit={handleSendMessage}>
        <div className="recipient-selector">
          <label htmlFor="recipient">To:</label>
          <select
            id="recipient"
            value={selectedRecipient}
            onChange={(e) => setSelectedRecipient(e.target.value)}
            className="recipient-dropdown"
          >
            <option value="Everyone">Everyone</option>
            {learners.map(learner => (
              <option key={learner.id} value={learner.name}>{learner.name}</option>
            ))}
          </select>
        </div>

        <div className="message-input-row">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            className="message-input"
            disabled={isThinking}
          />
          <button type="submit" className="send-button" disabled={isThinking}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </form>
    </div>
  );
};
