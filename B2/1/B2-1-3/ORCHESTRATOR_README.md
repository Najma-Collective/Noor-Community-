# Noor Community · AI Lesson Orchestrator

## Overview

The **AI Lesson Orchestrator** is a web-based system that creates an interactive, AI-guided lesson experience. It connects an AI teacher persona ("Sarah") with one or two human learners, guiding them through an existing HTML slide deck with a constructivist teaching approach.

## Features

### Core Functionality

✅ **Entry & Join System**
- Join code generation for easy session sharing
- Support for 1-2 learners per session
- Clean entry flow with name and code input

✅ **Lobby Experience**
- Waiting room with participant list
- Ready indicators for each learner
- Auto-start when all participants are ready

✅ **Live Lesson Interface**
- Embedded slide deck (16:9 aspect ratio)
- Real-time chat with AI teacher "Sarah"
- Phase tracking and activity timers
- Slide navigation controls

✅ **AI Teacher "Sarah"**
- Constructivist teaching style
- Slide-aware guidance
- Context-sensitive responses
- Supports both Gemini API and simulated mode

✅ **Recipient Targeting**
- Message routing (Everyone/Individual learners)
- Pairwork mode indicators
- Role assignment display

✅ **Activity Orchestration**
- 12 slides mapped to pedagogical phases
- Phase labels: Orientation, Warmer, Controlled Practice, Main Task, Reflection, Closing
- Activity-specific teacher behavior (fluency vs accuracy)
- Error logging for delayed correction

### Lesson Structure

The orchestrator maps the NGO Strategy lesson into these phases:

| Slide | Phase | Activity Type | Focus |
|-------|-------|---------------|-------|
| 1 | Orientation | Title | Initial greeting |
| 2 | Orientation | Goals | Lesson overview |
| 3 | Warmer | Lead-in | Discussion (fluency) |
| 4 | Controlled Practice | Vocabulary | Connections (accuracy) |
| 5 | Controlled Practice | Grammar | Second conditional (accuracy) |
| 6 | Controlled Practice | Grammar | Purpose clauses (accuracy) |
| 7 | Semi-controlled Practice | Scenario | Problem-solving (fluency) |
| 8 | Main Task | Intro | Task framing |
| 9 | Main Task | Roleplay | Strategic planning (fluency) |
| 10 | Main Task | Follow-up | Presentation (fluency) |
| 11 | Reflection | Reflection | Metacognition |
| 12 | Closing | End | Farewell |

## Quick Start

### 1. Open the Orchestrator

Simply open `orchestrator.html` in a modern web browser (Chrome, Firefox, Safari, Edge).

### 2. Configure API Key (Optional)

When the page loads, you'll be prompted to enter a Gemini API key:

- **With API key**: Sarah will use Google's Gemini AI for intelligent responses
- **Without API key**: Sarah will use simulated responses (still functional!)

To get a free Gemini API key:
1. Visit https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Create an API key
4. Copy and paste it when prompted

The key is stored locally in your browser for future sessions.

### 3. Join or Create a Session

**To create a new session:**
1. Enter your name
2. Leave "Join Code" blank
3. Click "Join Lesson"
4. You'll see a 6-character code (e.g., "ABC123")
5. Share this code with a partner (optional)

**To join an existing session:**
1. Enter your name
2. Enter the join code your partner shared
3. Click "Join Lesson"

### 4. Lobby

- Wait for your partner to join (or proceed alone)
- Click "I'm Ready" when prepared
- Lesson starts automatically when all participants are ready

### 5. Lesson Experience

**Slide Navigation:**
- Use the arrow buttons to navigate slides
- Sarah will provide guidance as slides change

**Chat:**
- Type messages in the input area
- Select recipient (Everyone or specific learner)
- Press Enter or click send button

**Sarah's Behavior:**
- She welcomes you and checks visibility
- Guides you through each activity
- Asks questions and waits for responses
- Provides feedback based on activity type
- References specific slide elements

## Technical Architecture

### State Management

The system uses `localStorage` for simple session persistence:

```javascript
{
  sessionId: "session_123456",
  joinCode: "ABC123",
  participants: [
    { id: "user_xyz", name: "Ali", ready: true },
    { id: "user_abc", name: "Mariam", ready: true }
  ],
  currentSlide: 0,
  started: true
}
```

### Session Synchronization

Participants poll the session state every 2 seconds to stay synchronized. This simple approach works well for 2-person sessions without requiring a backend server.

### Slide Control

The orchestrator embeds the existing slide deck in an iframe and controls it via `postMessage`:

```javascript
iframe.contentWindow.postMessage({
  type: 'navigateSlide',
  index: newSlide
}, '*');
```

### AI Integration

**With Gemini API:**
```javascript
// Calls Google Gemini 1.5 Flash
// System prompt includes:
// - Current slide context
// - Activity type
// - Participant info
// - Teaching principles
```

**Simulated Mode:**
- Fallback responses for each slide
- No API calls required
- Useful for testing and demos

## Sarah's Teaching Behavior

### Constructivist Principles

1. **Elicit Before Telling**
   - Asks questions first: "What do you think is the biggest challenge?"
   - Builds on learner knowledge

2. **Scaffolding**
   - Provides stems: "If we had... we would..."
   - Gives examples before asking for production

3. **Wait Time**
   - Doesn't rush to fill silence
   - Uses typing indicator to show patience

4. **Differentiated Feedback**

   **Fluency Activities** (Slides 3, 7, 9, 10):
   - Listens without interrupting
   - Collects errors for delayed correction
   - Focuses on communication

   **Accuracy Activities** (Slides 4, 5, 6):
   - Provides immediate gentle feedback
   - Invites self-correction first
   - Models correct forms

5. **Reflection**
   - Surfaces errors in Slide 11
   - Asks metacognitive questions
   - Encourages learner autonomy

### Per-Slide Guidance

Sarah's behavior adapts to each slide:

**Slide 1-2 (Orientation)**
- Warm greeting
- Check technical setup
- Preview lesson goals

**Slide 3 (Lead-in)**
- Ask discussion questions one by one
- Ensure both learners contribute
- Collect interesting ideas

**Slides 4-6 (Controlled Practice)**
- Provide clear instructions
- Check each response
- Give immediate corrective feedback
- Highlight successful uses

**Slides 7-10 (Main Task)**
- Assign roles explicitly
- Monitor pairwork
- Collect strong examples and errors
- Encourage natural interaction

**Slide 11 (Reflection)**
- Ask reflection questions
- Surface delayed error correction
- Anonymize errors when appropriate
- Provide corrected versions

**Slide 12 (Closing)**
- Specific praise for each learner
- Highlight strengths
- Optional homework suggestion

## Customization

### Modifying Slide Metadata

Edit the `slideMetadata` array in the script to change phases or focus areas:

```javascript
const slideMetadata = [
  { phase: 'Orientation', type: 'title', focus: '' },
  { phase: 'Warmer', type: 'lead-in', focus: 'Discussion' },
  // ... add or modify entries
];
```

### Changing Activity Guidance

Update the `getActivityGuidance()` function to modify Sarah's instructions:

```javascript
function getActivityGuidance(slideIndex) {
  const guidance = {
    0: 'Your custom guidance here...',
    // ...
  };
  return guidance[slideIndex];
}
```

### Styling

All CSS is embedded in the `<style>` section. Modify CSS variables for quick theme changes:

```css
:root {
  --primary-sage: #7a8471;
  --secondary-sage: #9caf88;
  /* ... customize colors */
}
```

### Using a Different Slide Deck

1. Update the iframe `src` attribute:
```html
<iframe id="slideIframe" class="slide-iframe" src="your-deck.html"></iframe>
```

2. Update `state.totalSlides`
3. Update `slideMetadata` array to match your lesson structure

## Features Not Yet Implemented

The following features are designed but not fully implemented in this version:

1. **Error Logging UI**
   - Backend: Error tracking is prepared in state
   - Frontend: Visual display of collected errors pending

2. **Delayed Error Correction Display**
   - Logic ready, needs UI component in Slide 11

3. **Slide Content Highlighting**
   - System can identify elements to highlight
   - Needs visual overlay implementation

4. **Role Assignment UI**
   - Roles stored in state
   - Needs explicit assignment flow for Slides 6, 9

5. **Real-time Multi-device Sync**
   - Current: localStorage polling (works for 2 people on same network)
   - Future: WebSocket or Firebase for true real-time sync

6. **Voice Integration**
   - Text-to-speech for Sarah
   - Speech-to-text for learners

7. **Analytics Export**
   - Session summary
   - Key phrases used
   - Error patterns
   - Participation metrics

## Browser Compatibility

**Tested on:**
- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 120+

**Requirements:**
- Modern browser with ES6+ support
- LocalStorage enabled
- JavaScript enabled

## Troubleshooting

### "Session not found"
- Check the join code for typos
- Ensure the host created the session first
- Try creating a new session

### Sarah not responding
- Check if API key is set (or use simulated mode)
- Check browser console for errors
- Verify internet connection if using Gemini API

### Slides not visible
- Check that `B2-1-3-b.html` exists in the same directory
- Check browser console for iframe errors
- Try refreshing the page

### Multiple tabs/browsers
- Each learner should use a different browser/device
- Same join code on different tabs may cause conflicts

### Chat messages not sending
- Check that message input is not empty
- Verify recipient is selected
- Check browser console for JavaScript errors

## Future Enhancements

Potential additions for future versions:

1. **Backend Integration**
   - Node.js/Express server
   - WebSocket for real-time sync
   - Database for session persistence

2. **Advanced AI Features**
   - Conversation memory
   - Personalized feedback
   - Adaptive difficulty

3. **Teacher Dashboard**
   - Monitor multiple sessions
   - Override AI suggestions
   - Live intervention

4. **Analytics & Reporting**
   - Session recordings
   - Language use metrics
   - Progress tracking

5. **Mobile Optimization**
   - Responsive layouts
   - Touch-friendly controls
   - Portrait mode support

6. **Accessibility**
   - Screen reader support
   - Keyboard navigation
   - High contrast mode

## License & Credits

Created for **Noor Community** educational platform.

**Design System:** Organic Sage theme
**Icons:** Font Awesome 6
**Fonts:** Nunito, Questrial (Google Fonts)
**AI Model:** Google Gemini 1.5 Flash

---

## Quick Reference Card

### Join a Session
1. Enter name
2. Enter code (or leave blank to create)
3. Click "Join Lesson"
4. Click "I'm Ready" in lobby

### During Lesson
- **Navigate:** Arrow buttons (bottom center)
- **Chat:** Type and press Enter
- **Target message:** Select recipient dropdown
- **Check phase:** See toolbar (top center)
- **Check timer:** See below phase label

### Sarah's Cues
- **Typing indicator:** Sarah is thinking
- **Direct address:** Message targeted to you
- **Pairwork banner:** Discuss with partner
- **Phase change:** New activity starting

---

**Need help?** Check the browser console (F12) for detailed error messages.

**Want to contribute?** Extend the `slideMetadata` or add new teaching behaviors!
