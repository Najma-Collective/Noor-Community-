import type { SlideMetadata } from '../../../shared/types';

/**
 * Metadata for each slide in the B2-1-3-b NGO Strategy lesson
 * Defines pedagogy, timing, and Sarah's behavior for each slide
 */
export const slideMetadata: SlideMetadata[] = [
  // Slide 1: Title / Orientation
  {
    index: 0,
    phase: 'warmer',
    activityType: 'orientation',
    errorCorrectionMode: 'none',
    grammarFocus: [],
    lexisFocus: [],
    pairworkEnabled: false,
    estimatedDuration: 2,
    sarahIntro: "Hello! Welcome to today's lesson on NGO project planning. Can you see the slide clearly? Let me know you're ready by saying hello!"
  },

  // Slide 2: Today's Goals
  {
    index: 1,
    phase: 'warmer',
    activityType: 'goals_overview',
    errorCorrectionMode: 'none',
    grammarFocus: [],
    lexisFocus: ['fundraising', 'project proposals'],
    pairworkEnabled: false,
    estimatedDuration: 3,
    sarahIntro: "Let's look at our goals for today. We have four main objectives. Take a moment to read them. Which goal sounds most interesting to you?"
  },

  // Slide 3: Lead-in Discussion
  {
    index: 2,
    phase: 'warmer',
    activityType: 'lead_in_discussion',
    errorCorrectionMode: 'delayed',
    grammarFocus: [],
    lexisFocus: ['challenge', 'donor', 'objectives', 'rationale'],
    pairworkEnabled: true,
    estimatedDuration: 8,
    sarahIntro: "Time to activate your prior knowledge! I have three discussion questions for you. Let's start with the first one: What's the biggest challenge for a new community project - getting money or managing the project? Take a moment to think..."
  },

  // Slide 4: Activity 1 - Connecting Concepts (Vocabulary)
  {
    index: 3,
    phase: 'controlled',
    activityType: 'vocab_practice',
    errorCorrectionMode: 'immediate',
    grammarFocus: [],
    lexisFocus: ['grant proposal', 'donor relations', 'budget allocation', 'measurable outcome', 'objective', 'rationale', 'methodology', 'timeline', 'stakeholders'],
    pairworkEnabled: true,
    estimatedDuration: 7,
    sarahIntro: "Now let's practice connecting vocabulary from fundraising and project planning. Look at the two lists on the right. Can you create a sentence that uses one word from each list? For example: 'In our grant proposal, we must define the project's objective.'"
  },

  // Slide 5: Activity 2 - Second Conditional
  {
    index: 4,
    phase: 'controlled',
    activityType: 'grammar_practice',
    errorCorrectionMode: 'immediate',
    grammarFocus: ['second conditional', 'If + Past Simple, would + infinitive'],
    lexisFocus: ['objective', 'stakeholders', 'methodology', 'budget'],
    pairworkEnabled: true,
    estimatedDuration: 8,
    sarahIntro: "Let's practice the second conditional - hypothetical situations using 'If + past simple, would + infinitive'. Look at the three scenarios on the slide. Let's start with the first one: What would you change about the project's objective if you had double the budget?"
  },

  // Slide 6: Activity 3 - Purpose Clauses
  {
    index: 5,
    phase: 'controlled',
    activityType: 'roleplay',
    errorCorrectionMode: 'immediate',
    grammarFocus: ['in order to', 'so that', 'because'],
    lexisFocus: ['funding', 'equipment', 'support'],
    pairworkEnabled: true,
    estimatedDuration: 10,
    sarahIntro: "Now we'll practice clauses of purpose and reason. I'll assign roles for a short role-play. One of you will be an NGO Manager, and the other will be a potential Donor. Manager, your job is to convince the donor using 'in order to', 'so that', and 'because'."
  },

  // Slide 7: Activity 4 - The Donor's Condition (Problem-solving)
  {
    index: 6,
    phase: 'semi-controlled',
    activityType: 'problem_solving',
    errorCorrectionMode: 'delayed',
    grammarFocus: ['second conditional', 'purpose clauses'],
    lexisFocus: ['measurable outcome', 'grant'],
    pairworkEnabled: true,
    estimatedDuration: 10,
    sarahIntro: "Here's a realistic problem: The donor accepted your grant, but they want to see measurable outcomes in 3 months instead of 12 months. What would you do? Discuss together using the second conditional and purpose clauses. I'll listen and take notes."
  },

  // Slide 8: Main Task Intro
  {
    index: 7,
    phase: 'main-task',
    activityType: 'main_task_intro',
    errorCorrectionMode: 'delayed',
    grammarFocus: [],
    lexisFocus: [],
    pairworkEnabled: false,
    estimatedDuration: 2,
    sarahIntro: "Excellent work so far! Now it's time for the main task: a Strategic Planning Meeting role-play. You'll use all the language we've practiced today in a realistic scenario."
  },

  // Slide 9: Main Task Roles
  {
    index: 8,
    phase: 'main-task',
    activityType: 'main_task',
    errorCorrectionMode: 'delayed',
    grammarFocus: ['second conditional', 'purpose clauses'],
    lexisFocus: ['objective', 'rationale', 'methodology', 'budget', 'stakeholders'],
    pairworkEnabled: true,
    estimatedDuration: 15,
    sarahIntro: "Let me assign your roles. Look at the cards on the slide. Role A is Finance Manager - you'll ask challenging 'what if' questions. Role B is Project Manager - you'll present a project idea and justify it. Take a moment to read your role, then begin your meeting."
  },

  // Slide 10: Follow-Up Task
  {
    index: 9,
    phase: 'main-task',
    activityType: 'follow_up',
    errorCorrectionMode: 'delayed',
    grammarFocus: ['decision-making language'],
    lexisFocus: ['decided to', 'because', 'rationale'],
    pairworkEnabled: true,
    estimatedDuration: 8,
    sarahIntro: "Good discussion! Now I'll take on the role of Director. Please summarize your discussion for me: What did you decide, and why? Use phrases like 'We decided to... because...'"
  },

  // Slide 11: Reflection
  {
    index: 10,
    phase: 'reflection',
    activityType: 'reflection',
    errorCorrectionMode: 'delayed',
    grammarFocus: [],
    lexisFocus: [],
    pairworkEnabled: false,
    estimatedDuration: 7,
    sarahIntro: "Time to reflect on your learning. Look at the three reflection questions. Let's start with the first: Was it more challenging to use the vocabulary or the grammar today?"
  },

  // Slide 12: End
  {
    index: 11,
    phase: 'closing',
    activityType: 'closing',
    errorCorrectionMode: 'none',
    grammarFocus: [],
    lexisFocus: [],
    pairworkEnabled: false,
    estimatedDuration: 3,
    sarahIntro: "Excellent work today! You both made great progress with second conditionals and purpose clauses. I noticed some strong examples during the main task."
  }
];

export const getLessonInfo = () => ({
  id: 'b2-1-3-ngo-strategy',
  title: 'NGO Strategy: Consolidation & Planning',
  level: 'B2',
  totalSlides: slideMetadata.length,
  estimatedDuration: slideMetadata.reduce((sum, slide) => sum + slide.estimatedDuration, 0)
});
