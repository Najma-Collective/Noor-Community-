import React, { useState } from 'react';
import { getAIService } from '../services/aiService';

export const SettingsPanel: React.FC = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [isConfigured, setIsConfigured] = useState(!!localStorage.getItem('gemini_api_key'));
  const [showSettings, setShowSettings] = useState(!isConfigured);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      getAIService(apiKey.trim());
      setIsConfigured(true);
      setShowSettings(false);
    }
  };

  return (
    <div className="settings-panel">
      <button
        className="settings-toggle"
        onClick={() => setShowSettings(!showSettings)}
        title="Settings"
      >
        <i className={`fa-solid fa-${isConfigured ? 'check-circle' : 'exclamation-triangle'}`}></i>
        <i className="fa-solid fa-gear"></i>
      </button>

      {showSettings && (
        <div className="settings-modal">
          <div className="settings-content">
            <h3>
              <i className="fa-solid fa-robot"></i>
              AI Configuration
            </h3>

            <p className="settings-description">
              Enter your Google Gemini API key to enable Sarah, the AI teacher.
              <br />
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get a free API key →
              </a>
            </p>

            <div className="settings-field">
              <label htmlFor="api-key">Gemini API Key:</label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="settings-input"
              />
            </div>

            <div className="settings-actions">
              <button onClick={handleSaveApiKey} className="save-button">
                <i className="fa-solid fa-save"></i>
                Save & Enable Sarah
              </button>
              {isConfigured && (
                <button onClick={() => setShowSettings(false)} className="cancel-button">
                  Cancel
                </button>
              )}
            </div>

            <p className="settings-note">
              <i className="fa-solid fa-lock"></i>
              Your API key is stored locally in your browser and never sent to any server except Google's Gemini API.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
