import { create } from 'zustand';
import type { SessionState, Learner, Message, ErrorEntry } from '../../../shared/types';

interface SessionStore extends SessionState {
  // Actions
  setSessionState: (state: Partial<SessionState>) => void;
  addMessage: (message: Message) => void;
  addLearner: (learner: Learner) => void;
  updateLearner: (id: string, updates: Partial<Learner>) => void;
  setCurrentSlide: (index: number) => void;
  addError: (error: ErrorEntry) => void;
  setRoleAssignment: (learnerId: string, role: string) => void;
  reset: () => void;
}

const initialState: SessionState = {
  sessionId: '',
  joinCode: '',
  lessonId: 'b2-1-3-ngo-strategy',
  lessonTitle: 'NGO Strategy: Consolidation & Planning',
  learners: [],
  teacher: {
    id: 'sarah',
    name: 'Sarah',
    persona: 'Sarah'
  },
  currentSlideIndex: 0,
  currentPhase: 'warmer',
  activityState: {
    questionsAnswered: 0,
    targetStructuresUsed: [],
    participationByLearner: {}
  },
  messages: [],
  errorLog: [],
  roleAssignments: {},
  sessionStartTime: null,
  phaseStartTime: Date.now(),
  isInLobby: true
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setSessionState: (newState) => set((state) => ({ ...state, ...newState })),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),

  addLearner: (learner) => set((state) => ({
    learners: [...state.learners, learner]
  })),

  updateLearner: (id, updates) => set((state) => ({
    learners: state.learners.map(l => l.id === id ? { ...l, ...updates } : l)
  })),

  setCurrentSlide: (index) => set(() => ({
    currentSlideIndex: index,
    phaseStartTime: Date.now()
  })),

  addError: (error) => set((state) => ({
    errorLog: [...state.errorLog, error]
  })),

  setRoleAssignment: (learnerId, role) => set((state) => ({
    roleAssignments: { ...state.roleAssignments, [learnerId]: role }
  })),

  reset: () => set(initialState)
}));
