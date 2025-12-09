import React, { useState, useRef, useEffect } from 'react';
import { useSessionStore } from '../stores/sessionStore';

export const InteractionPanel: React.FC = () => {
  const { messages, learners } = useSessionStore();
  const [messageInput, setMessageInput] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('Everyone');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    // For now, just add to local state
    // In full implementation, this would send via socket
    const newMessage = {
      id: Date.now().toString(),
      sender: 'You', // Placeholder - will be learner name
      senderType: 'learner' as const,
      content: messageInput,
      timestamp: Date.now(),
      recipients: [selectedRecipient]
    };

    useSessionStore.getState().addMessage(newMessage);
    setMessageInput('');
  };

  return (
    <div className="interaction-panel">
      <div className="panel-header">
        <h3>Lesson Chat</h3>
        {learners.length > 0 && (
          <div className="participants-count">
            {learners.length} learner{learners.length !== 1 ? 's' : ''}
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
          />
          <button type="submit" className="send-button">
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </form>
    </div>
  );
};
