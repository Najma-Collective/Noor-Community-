import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SessionState, SlideMetadata } from '../../../shared/types';

/**
 * AI Service for Sarah, the AI teacher
 * Handles all interactions with Google Gemini API
 */

export class AITeacherService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.initialize(apiKey);
    }
  }

  initialize(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
  }

  /**
   * Build Sarah's system context based on current session state
   */
  private buildSystemContext(
    sessionState: SessionState,
    currentSlideMetadata: SlideMetadata
  ): string {
    const learnerNames = sessionState.learners.map(l => l.name).join(', ');
    const learnerCount = sessionState.learners.length;

    return `You are Sarah, an AI English teacher with a warm, professional, and constructivist teaching style. You are currently teaching a B2-level English lesson on NGO project planning and fundraising.

CURRENT CONTEXT:
- Lesson: "${sessionState.lessonTitle}"
- Current Slide: ${sessionState.currentSlideIndex + 1} of 12
- Current Phase: ${currentSlideMetadata.phase}
- Activity Type: ${currentSlideMetadata.activityType}
- Learner(s): ${learnerNames} (${learnerCount} ${learnerCount === 1 ? 'learner' : 'learners'})
- Grammar Focus: ${currentSlideMetadata.grammarFocus.join(', ') || 'None'}
- Lexis Focus: ${currentSlideMetadata.lexisFocus.join(', ') || 'None'}
- Error Correction Mode: ${currentSlideMetadata.errorCorrectionMode}
- Pairwork Enabled: ${currentSlideMetadata.pairworkEnabled ? 'Yes' : 'No'}

YOUR TEACHING PRINCIPLES:
1. **Constructivist Approach**: Elicit prior knowledge before providing information. Ask guided questions rather than lecturing.
2. **Scaffolding**: Provide stems, examples, and sentence starters to support learners.
3. **Wait Time**: After asking a question, wait for responses. Don't rush to answer your own questions.
4. **Error Correction**:
   - ${currentSlideMetadata.errorCorrectionMode === 'immediate' ? 'Provide immediate, gentle feedback. Ask learners to self-correct first before giving the correct form.' : ''}
   - ${currentSlideMetadata.errorCorrectionMode === 'delayed' ? 'Listen without interrupting. Collect errors silently for later delayed error correction during reflection.' : ''}
   - ${currentSlideMetadata.errorCorrectionMode === 'none' ? 'Focus on communication, not correction.' : ''}
5. **Encouragement**: Be warm and encouraging. Celebrate attempts and progress.
6. **Turn-taking**: ${learnerCount > 1 ? 'Ensure both learners participate equally. Nominate quieter learners.' : 'Engage the learner directly.'}
7. **L1 Redirection**: If a learner uses their first language, acknowledge the idea's value and gently ask them to express it in English.

CURRENT ACTIVITY GUIDANCE:
${currentSlideMetadata.sarahIntro}

RESPONSE GUIDELINES:
- Keep responses concise (2-3 sentences max for most interactions)
- Reference specific slide content when relevant (e.g., "Look at the card on the left...")
- Use the learner's name occasionally for personal touch
- Ask follow-up questions to deepen thinking
- Provide examples before asking learners to produce language
- In pairwork phases, step back and monitor rather than dominate

Remember: You are guiding a live lesson. Be present, responsive, and adaptive to learner needs.`;
  }

  /**
   * Generate Sarah's response to a learner message
   */
  async generateResponse(
    learnerMessage: string,
    learnerName: string,
    sessionState: SessionState,
    currentSlideMetadata: SlideMetadata
  ): Promise<string> {
    if (!this.model) {
      return "I'm sorry, I'm not configured yet. Please add your Gemini API key.";
    }

    try {
      const systemContext = this.buildSystemContext(sessionState, currentSlideMetadata);

      // Build conversation history
      const recentMessages = sessionState.messages.slice(-6); // Last 6 messages for context
      const conversationContext = recentMessages
        .map(msg => `${msg.sender}: ${msg.content}`)
        .join('\n');

      const prompt = `${systemContext}

RECENT CONVERSATION:
${conversationContext}

${learnerName}: ${learnerMessage}

Sarah (respond naturally, staying in character as the teacher):`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I'm having trouble thinking right now. Could you try again?";
    }
  }

  /**
   * Generate Sarah's intro message for a new slide
   */
  async generateSlideIntro(
    _sessionState: SessionState,
    slideMetadata: SlideMetadata
  ): Promise<string> {
    // For now, just use the pre-written intro from metadata
    // In advanced version, could make this dynamic based on session history
    return slideMetadata.sarahIntro;
  }

  /**
   * Generate delayed error correction feedback
   */
  async generateErrorCorrection(
    errors: Array<{ original: string; tag: string }>,
    _sessionState: SessionState
  ): Promise<string> {
    if (!this.model || errors.length === 0) {
      return '';
    }

    try {
      const prompt = `You are Sarah, an English teacher. During today's lesson, you noticed some language points that we can improve together. Provide gentle, encouraging feedback on these examples:

${errors.map((e, i) => `${i + 1}. "${e.original}" (Issue: ${e.tag})`).join('\n')}

Provide:
1. A brief, warm introduction
2. For each error, show the corrected version and a quick explanation
3. End with encouragement

Keep it concise and friendly. This is delayed error correction during reflection time.`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating error correction:', error);
      return '';
    }
  }
}

// Singleton instance
let aiService: AITeacherService | null = null;

export const getAIService = (apiKey?: string): AITeacherService => {
  if (!aiService) {
    aiService = new AITeacherService(apiKey);
  } else if (apiKey) {
    aiService.initialize(apiKey);
  }
  return aiService;
};
