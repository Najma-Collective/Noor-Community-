# AI Lesson Orchestrator - System Architecture

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (lightweight, perfect for session state)
- **Real-time Communication**: Socket.io Client
- **Styling**: Existing Organic Sage CSS + Tailwind for new components
- **AI Integration**: Google Gemini API (direct client integration for prototype)

### Backend (Lightweight)
- **Runtime**: Node.js + Express
- **Real-time**: Socket.io Server
- **Session Store**: In-memory (Redis for production)
- **AI**: Google Gemini API

## System Components

### 1. Entry & Join System
```
┌─────────────────────────────────────────┐
│  Landing Page                           │
│  - Name input                           │
│  - Join code input                      │
│  - Auto-fill from URL param             │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Lobby                                  │
│  - Show joined learners                 │
│  - Ready status indicators              │
│  - Sarah's welcome message              │
└─────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│  Main Lesson Experience                 │
└─────────────────────────────────────────┘
```

### 2. Main Lesson Layout
```
┌──────────────────────────────────────────────────────────────┐
│  Extended Toolbar                                            │
│  [Noor] [Lesson Title] | Phase: Lead-in | Timer: 05:23      │
│                                                3/12 slides   │
└──────────────────────────────────────────────────────────────┘
│
├─────────────────────────────────┬─────────────────────────────┤
│                                 │  Interaction Panel          │
│  Slide Stage (16:9)             │  ┌─────────────────────────┐│
│  ┌─────────────────────────┐    │  │ Sarah (AI Teacher)      ││
│  │                         │    │  │ Ali (Learner)           ││
│  │   [Current Slide HTML]  │    │  │ Mariam (Learner)        ││
│  │                         │    │  └─────────────────────────┘│
│  │   With highlighting     │    │                             │
│  │   overlay capability    │    │  Recipient: [Everyone ▼]    │
│  │                         │    │  ┌─────────────────────────┐│
│  └─────────────────────────┘    │  │ Type your message...    ││
│  [< Prev]           [Next >]    │  └─────────────────────────┘│
│                                 │                             │
└─────────────────────────────────┴─────────────────────────────┘
```

### 3. State Management

#### Session State (Zustand Store)
```typescript
interface SessionState {
  sessionId: string;
  joinCode: string;
  lessonId: string;

  // Participants
  learners: Learner[];
  teacher: Teacher;

  // Current slide & phase
  currentSlideIndex: number;
  currentPhase: LessonPhase;
  activityState: ActivityState;

  // Communication
  messages: Message[];

  // Error tracking
  errorLog: ErrorEntry[];

  // Roles (for pairwork)
  roleAssignments: Record<string, string>;

  // Session meta
  sessionStartTime: number;
  phaseStartTime: number;
}
```

#### Slide Metadata
```typescript
interface SlideMetadata {
  index: number;
  phase: 'warmer' | 'controlled' | 'semi-controlled' | 'main-task' | 'reflection' | 'closing';
  activityType: string;
  errorCorrectionMode: 'delayed' | 'immediate' | 'none';
  grammarFocus: string[];
  lexisFocus: string[];
  pairworkEnabled: boolean;
  estimatedDuration: number; // minutes
}

const slideMetadata: SlideMetadata[] = [
  { index: 0, phase: 'warmer', activityType: 'orientation', ... },
  { index: 1, phase: 'warmer', activityType: 'goals_overview', ... },
  { index: 2, phase: 'warmer', activityType: 'lead_in_discussion', errorCorrectionMode: 'delayed', ... },
  // ... all 12 slides
];
```

## Data Flow

### 1. Session Creation & Join
```
Admin/Host → Create Session → Server generates join code
           → Returns session ID + join code
           → Share join link

Learner A → Enters name + code → Socket connection
         → Server adds to session → Broadcasts update
         → Other clients see Learner A joined

Learner B → Same flow → Both in lobby
         → Both click Ready → Session starts
```

### 2. Real-time Message Flow
```
Learner → Types message → Sends to server
       → Server receives → Determines recipient(s)
       → Routes to Sarah AI (if needed)
       → Sarah generates response
       → Server broadcasts to recipient(s)
       → Clients update UI
```

### 3. Slide Navigation Flow
```
Sarah/Learner → Request slide change
             → Server updates session state
             → Broadcast new slide index to all
             → Clients render new slide
             → Sarah context updated with new phase
             → Sarah sends phase-appropriate prompt
```

### 4. AI Teacher (Sarah) Integration

#### Sarah's Context Structure
```typescript
interface SarahContext {
  // Session info
  sessionId: string;
  lessonPlan: LessonPlan;

  // Current state
  currentSlide: SlideMetadata;
  currentPhase: string;
  timeInPhase: number;

  // Learners
  learners: {
    name: string;
    role?: string;
    participationCount: number;
    recentMessages: string[];
  }[];

  // Language tracking
  errorLog: ErrorEntry[];
  targetLanguageUsed: string[];

  // Activity state
  activityProgress: {
    questionsAnswered: number;
    targetStructuresUsed: number;
  };
}
```

#### Sarah's Behavior Triggers
1. **Slide Change**: Send new phase intro
2. **Learner Message**: Process, track language, respond appropriately
3. **Silence (5s+)**: Send gentle nudge
4. **Error Detection**: Log (delayed) or correct (immediate) based on phase
5. **Phase Timer End**: Suggest moving forward
6. **Pairwork Start**: Assign roles, explain task
7. **Reflection Phase**: Surface delayed corrections

## Component Architecture

### React Component Tree
```
<App>
  ├── <Router>
  │   ├── <LandingPage>
  │   │   └── <JoinForm>
  │   │
  │   ├── <LobbyPage>
  │   │   ├── <LearnerList>
  │   │   ├── <ReadyButton>
  │   │   └── <ChatPreview>
  │   │
  │   └── <LessonPage>
  │       ├── <ExtendedToolbar>
  │       │   ├── <BrandInfo>
  │       │   ├── <PhaseIndicator>
  │       │   ├── <PhaseTimer>
  │       │   └── <SlideCounter>
  │       │
  │       ├── <SlideStage>
  │       │   ├── <SlideRenderer> (wraps existing HTML)
  │       │   ├── <HighlightOverlay>
  │       │   └── <NavigationButtons>
  │       │
  │       └── <InteractionPanel>
  │           ├── <ChatLog>
  │           │   └── <Message>
  │           ├── <RecipientSelector>
  │           ├── <MessageInput>
  │           ├── <RoleDisplay>
  │           └── <PairworkBanner>
```

## Implementation Phases

### Phase 1: Foundation (MVP for 1 learner)
- [x] Project setup
- [ ] Slide rendering with existing HTML
- [ ] Basic chat interface
- [ ] Sarah AI integration (simple prompts)
- [ ] Slide navigation
- [ ] Phase awareness

### Phase 2: Multi-learner Support
- [ ] Socket.io server
- [ ] Join code system
- [ ] Lobby functionality
- [ ] Real-time sync
- [ ] Recipient targeting

### Phase 3: Advanced Teaching Features
- [ ] Slide-specific Sarah behaviors
- [ ] Error tracking & delayed correction
- [ ] Pairwork mode
- [ ] Role assignment
- [ ] Highlighting system
- [ ] Timer management

### Phase 4: Polish & Resilience
- [ ] Disconnection handling
- [ ] Rejoin logic
- [ ] Session export
- [ ] Analytics/logging
- [ ] Performance optimization

## Security & Privacy Considerations

1. **Join Codes**: 6-character alphanumeric (ABCDEF123)
2. **Session TTL**: 4 hours, auto-cleanup
3. **Message Sanitization**: XSS protection
4. **AI API Keys**: Server-side only, never exposed to client
5. **Personal Data**: No storage beyond session lifetime

## File Structure
```
ai-orchestrator/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/
│   │   │   ├── lobby/
│   │   │   ├── lesson/
│   │   │   │   ├── SlideStage.tsx
│   │   │   │   ├── InteractionPanel.tsx
│   │   │   │   └── ExtendedToolbar.tsx
│   │   │   └── shared/
│   │   ├── stores/
│   │   │   └── sessionStore.ts
│   │   ├── services/
│   │   │   ├── socket.ts
│   │   │   └── ai.ts
│   │   ├── config/
│   │   │   └── slideMetadata.ts
│   │   └── App.tsx
│   ├── public/
│   │   └── slides/           # Copy of B2-1-3-b.html content
│   └── package.json
│
├── server/                    # Node.js backend
│   ├── src/
│   │   ├── server.ts
│   │   ├── sessionManager.ts
│   │   ├── aiOrchestrator.ts  # Sarah's brain
│   │   └── socketHandlers.ts
│   └── package.json
│
└── shared/                    # Shared TypeScript types
    └── types.ts
```

## Next Steps
1. Initialize project structure
2. Set up Vite + React + TypeScript
3. Create basic slide rendering
4. Implement simple chat with Gemini
5. Add slide navigation
6. Expand from there...
