/**
 * Shared TypeScript types for Noor AI Lesson Orchestrator
 */

export type LessonPhase =
  | 'warmer'
  | 'controlled'
  | 'semi-controlled'
  | 'main-task'
  | 'reflection'
  | 'closing';

export type ErrorCorrectionMode = 'delayed' | 'immediate' | 'none';

export type ActivityType =
  | 'orientation'
  | 'goals_overview'
  | 'lead_in_discussion'
  | 'vocab_practice'
  | 'grammar_practice'
  | 'roleplay'
  | 'problem_solving'
  | 'main_task_intro'
  | 'main_task'
  | 'follow_up'
  | 'reflection'
  | 'closing';

export interface SlideMetadata {
  index: number;
  phase: LessonPhase;
  activityType: ActivityType;
  errorCorrectionMode: ErrorCorrectionMode;
  grammarFocus: string[];
  lexisFocus: string[];
  pairworkEnabled: boolean;
  estimatedDuration: number; // minutes
  sarahIntro: string; // What Sarah says when entering this slide
}

export interface Learner {
  id: string;
  name: string;
  socketId?: string;
  role?: string; // For role-plays
  isReady: boolean;
  joinedAt: number;
}

export interface Teacher {
  id: string;
  name: string;
  persona: 'Sarah';
}

export interface Message {
  id: string;
  sender: string; // 'Sarah' or learner name
  senderType: 'teacher' | 'learner';
  content: string;
  timestamp: number;
  recipients: string[]; // ['Everyone'] or specific learner names
}

export interface ErrorEntry {
  id: string;
  learnerId: string;
  originalSentence: string;
  correctedSentence: string;
  grammarTag: string;
  slideIndex: number;
  timestamp: number;
}

export interface ActivityState {
  questionsAnswered: number;
  targetStructuresUsed: string[];
  participationByLearner: Record<string, number>;
}

export interface SessionState {
  sessionId: string;
  joinCode: string;
  lessonId: string;
  lessonTitle: string;

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
  sessionStartTime: number | null;
  phaseStartTime: number;
  isInLobby: boolean;
}

// Socket event types
export interface ClientToServerEvents {
  'join_session': (data: { name: string; joinCode: string }) => void;
  'set_ready': (isReady: boolean) => void;
  'send_message': (data: { content: string; recipients: string[] }) => void;
  'change_slide': (slideIndex: number) => void;
  'start_session': () => void;
}

export interface ServerToClientEvents {
  'session_joined': (data: { learnerId: string; sessionState: SessionState }) => void;
  'session_updated': (sessionState: SessionState) => void;
  'new_message': (message: Message) => void;
  'slide_changed': (slideIndex: number) => void;
  'error': (error: { message: string }) => void;
  'session_started': () => void;
}
