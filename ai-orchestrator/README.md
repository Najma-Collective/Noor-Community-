# Noor Community · AI Lesson Orchestrator

An AI-powered lesson orchestration system that brings the "Sarah" AI teacher persona to life, guiding learners through interactive English lessons with constructivist pedagogy.

## Overview

This prototype demonstrates how an AI teacher can orchestrate a live lesson experience using:
- **Existing HTML slide decks** (Organic Sage theme)
- **Google Gemini AI** as the teacher persona "Sarah"
- **Constructivist teaching principles**: elicitation, scaffolding, delayed error correction
- **Slide-aware pedagogy**: Different teaching behaviors for different activity types

## Features Implemented

### ✅ Phase 1: Core Experience (Current)

- **Slide Orchestration**: All 12 slides from B2-1-3-b (NGO Strategy lesson) rendered with navigation
- **AI Teacher Integration**: Sarah responds using Gemini API with constructivist teaching style
- **Phase Awareness**: Sarah adapts behavior based on current slide phase (warmer, controlled practice, main task, etc.)
- **Chat Interface**: Real-time chat with recipient targeting
- **Extended Toolbar**: Shows current phase, activity type, timer, and slide counter
- **Settings Panel**: Easy API key configuration with browser storage

### 🚧 Phase 2: Planned Features

- Multi-learner support with WebSocket real-time sync
- Join code system for pairing learners
- Lobby with ready states
- Pairwork mode with role assignment
- Slide content highlighting
- Delayed error correction system
- Disconnection/rejoin handling

## Project Structure

```
ai-orchestrator/
├── client/                    # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── SlideStage.tsx          # Slide renderer with navigation
│   │   │   ├── AIInteractionPanel.tsx  # Chat interface with AI
│   │   │   ├── ExtendedToolbar.tsx     # Phase indicator & timer
│   │   │   └── SettingsPanel.tsx       # API key configuration
│   │   ├── stores/
│   │   │   └── sessionStore.ts         # Zustand state management
│   │   ├── services/
│   │   │   └── aiService.ts            # Gemini AI integration
│   │   ├── config/
│   │   │   └── slideMetadata.ts        # Pedagogical metadata for slides
│   │   ├── data/
│   │   │   └── slides.ts               # Slide content from HTML
│   │   ├── styles.css         # Custom styles + Organic Sage base
│   │   └── App.tsx            # Main app component
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── server/                    # Node.js backend (for Phase 2)
│   └── package.json
│
├── shared/                    # Shared TypeScript types
│   └── types.ts
│
├── ARCHITECTURE.md            # Detailed system architecture
└── README.md                  # This file
```

## Setup Instructions

### Prerequisites

- **Node.js** 18+ and npm
- **Google Gemini API Key** (free tier available)
  - Get one at: https://makersuite.google.com/app/apikey

### Installation

1. **Clone the repository**
   ```bash
   cd ai-orchestrator/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:3000`
   - The app will prompt you for a Gemini API key on first launch

### Configuration

#### Adding Your Gemini API Key

1. Click the **settings icon** (⚙️) in the top-right of the interaction panel
2. Paste your Gemini API key
3. Click "Save & Enable Sarah"
4. Your key is stored locally in browser localStorage (never sent to any server except Google's)

#### Environment Variables (Optional)

For production deployment, you can set:
```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

## Usage

### Basic Lesson Flow

1. **Start**: Open the app, configure your API key
2. **Welcome**: Sarah greets you on Slide 1
3. **Navigate**: Use arrow buttons or click Next/Previous
4. **Interact**: Chat with Sarah using the message input
5. **Learn**: Sarah guides you through activities with:
   - Phase-appropriate prompts
   - Scaffolding and examples
   - Constructivist questioning
   - Gentle error correction (immediate or delayed based on activity)

### Keyboard Shortcuts

- **Arrow Right** / **Arrow Left**: Navigate slides
- **Enter** in message input: Send message

### Understanding Sarah's Behavior

Sarah adapts her teaching based on the current slide:

| Slide | Phase | Sarah's Behavior |
|-------|-------|------------------|
| 1-3 | Warmer | Welcomes, elicits prior knowledge, asks open questions |
| 4-6 | Controlled Practice | Provides immediate error correction, offers stems and examples |
| 7-10 | Semi-controlled / Main Task | Steps back, monitors, collects errors for delayed correction |
| 11 | Reflection | Surfaces delayed error correction, encourages metacognition |
| 12 | Closing | Celebrates progress, offers specific praise |

## Technical Details

### State Management

Uses **Zustand** for lightweight, performant state management:
- Session metadata
- Current slide index and phase
- Messages and conversation history
- Learners and roles
- Error log

### AI Integration

**Google Gemini API** (`gemini-pro` model):
- **Context-aware prompting**: Sarah receives full session context
- **Slide metadata**: Grammar focus, lexis focus, error correction mode
- **Conversation history**: Last 6 messages for coherent dialogue
- **Configurable generation**: Temperature 0.7 for natural variation

### Slide Metadata System

Each slide has pedagogical metadata:
```typescript
{
  phase: 'controlled',
  activityType: 'vocab_practice',
  errorCorrectionMode: 'immediate',
  grammarFocus: ['second conditional'],
  lexisFocus: ['grant proposal', 'donor relations'],
  pairworkEnabled: true,
  estimatedDuration: 7,
  sarahIntro: "Now let's practice..."
}
```

This metadata drives Sarah's behavior and system UX.

### Component Architecture

```
App
├── ExtendedToolbar (phase indicator, timer, slide counter)
├── SlideStage (slide renderer + navigation)
└── Panel Area
    ├── SettingsPanel (API key config)
    └── AIInteractionPanel (chat with Sarah)
```

## Development

### Build for Production

```bash
npm run build
```

Output: `dist/` directory ready for static hosting

### Preview Production Build

```bash
npm run preview
```

### TypeScript Type Checking

```bash
npx tsc --noEmit
```

## Pedagogical Design

### Constructivist Teaching Principles

Sarah follows research-backed constructivist teaching:

1. **Elicitation First**: Ask learners what they know before telling them
2. **Scaffolding**: Provide stems, examples, sentence starters
3. **Wait Time**: Give learners 3-5 seconds to think before prompting
4. **Guided Discovery**: Ask questions that lead learners to answers
5. **Metacognition**: Encourage reflection on learning strategies

### Error Correction Strategy

- **Immediate** (Controlled practice): Gentle correction, invitation to self-correct
- **Delayed** (Fluency activities): Collect errors silently, surface during reflection
- **None** (Social interaction): Focus on communication

### Pairwork Design (Phase 2)

When implemented:
- **Role Assignment**: Sarah assigns roles (e.g., Finance Manager, Project Manager)
- **Monitoring**: Sarah steps back but tracks language use
- **Turn-taking**: Sarah ensures balanced participation
- **Intervention**: Sarah nudges if learners get stuck

## Deployment

### Static Hosting (Vercel, Netlify, GitHub Pages)

```bash
npm run build
# Deploy the dist/ directory
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

## Future Enhancements

### Short-term
- [ ] Voice input/output (Web Speech API)
- [ ] Session export (PDF of lesson + chat log)
- [ ] Custom lesson deck upload
- [ ] Admin dashboard for teachers

### Long-term
- [ ] Multi-modal AI (voice + vision)
- [ ] Learning analytics and insights
- [ ] Adaptive difficulty
- [ ] Integration with LMS platforms

## License

MIT License - see LICENSE file for details

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request with clear description

## Support

For questions or issues:
- Open a GitHub issue
- Contact: noor-community@example.com

---

**Built with** ❤️ **for language learners by the Noor Community team**
