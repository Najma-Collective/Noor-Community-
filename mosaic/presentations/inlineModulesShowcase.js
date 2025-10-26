(() => {
  const presentation = {
    id: 'inlineModulesShowcase',
    deckTitle: 'Inline Activity Toolkit',
    slides: [
      {
        layout: 'hero-title',
        content: {
          title: 'Inline Activity Toolkit',
          backgroundImageQuery: 'teachers collaborating over lesson plans',
          backgroundImageAlt: 'Educators comparing lesson plans with laptops and sticky notes at a table.'
        }
      },
      {
        layout: 'inline-module',
        content: {
          title: 'Unscramble Sentences · Hedging Language',
          summary: 'Reactivate diplomatic phrasing before critique tasks.',
          description:
            'Frame this as a brisk pattern-recognition challenge. Tell pairs to whisper the sentence as they arrange it so intonation cues stay connected to meaning.',
          facilitationStrategies: [
            'Set a visible 90-second timer and have partners justify their final word order aloud before they press “Check Answers.”',
            'Project one completed response and invite the room to spot which words carry the stress when you read it back with hesitation.'
          ],
          moduleHTML: `
            <div class="card" data-activity="unscramble">
              <p>Invite learners to rebuild these hedge-filled statements before they critique a partner proposal.</p>
              <ul class="unscramble-list">
                <li>
                  <p>1. appears / timeline / It / the / that / is / overly / optimistic / .</p>
                  <input type="text" class="unscramble-input" data-answer="It appears that the timeline is overly optimistic." aria-label="Unscramble sentence 1" />
                </li>
                <li>
                  <p>2. might / argue / stakeholders / additional / some / for / consultation</p>
                  <input type="text" class="unscramble-input" data-answer="Some stakeholders might argue for additional consultation." aria-label="Unscramble sentence 2" />
                </li>
                <li>
                  <p>3. There / seems / to / be / a / gap / in / the / proposal / reporting / .</p>
                  <input type="text" class="unscramble-input" data-answer="There seems to be a gap in the proposal reporting." aria-label="Unscramble sentence 3" />
                </li>
              </ul>
              <div class="activity-actions">
                <button class="activity-btn" type="button" data-action="check">Check Answers</button>
                <button class="activity-btn secondary" type="button" data-action="reset">Reset</button>
              </div>
              <div class="feedback-msg" aria-live="polite"></div>
            </div>
          `,
          whenToUse:
            'Use at the top of an analysis phase when learners need hedging language on the surface before evaluating ideas or writing feedback.',
          customizations: [
            'Swap the sentences for excerpts pulled from current learner drafts so the activity previews the feedback language they will deliver later.',
            'Add subtle colour highlights behind discourse markers if a group benefits from visual prompts about tone.'
          ],
          troubleshooting: [
            'If typing slows momentum, hand learners printed strips to arrange first, then transcribe into the inputs once they agree.',
            'Model how punctuation and capitalisation hint at the starting point so learners don’t ignore mechanics while typing.'
          ]
        }
      },
      {
        layout: 'inline-module',
        content: {
          title: 'Gap Inputs · Narrative Recall',
          summary: 'Guide learners to supply missing chunks while revisiting context.',
          description:
            'Encourage teams to speak each full sentence before writing so they rely on meaning, not just isolated words.',
          facilitationStrategies: [
            'Assign roles: one learner proposes an answer, the other challenges with “Why that form?” to prompt metalinguistic talk.',
            'After revealing answers, elicit two alternative correct phrases to reinforce flexibility and personalised storytelling.'
          ],
          moduleHTML: `
            <div class="card" data-activity="gap-fill">
              <p>Complete the story starter with accurate verb phrases before you retell it to another pair.</p>
              <ol>
                <li>
                  1. We <input type="text" class="gap-input" data-answer="planned" aria-label="Gap 1" /> the campaign on Friday and shared the draft deck.
                </li>
                <li>
                  2. By Monday we <input type="text" class="gap-input" data-answer="had collected" aria-label="Gap 2" /> feedback from every partner.
                </li>
                <li>
                  3. The donors <input type="text" class="gap-input" data-answer="asked for" aria-label="Gap 3" /> clearer community examples before signing off.
                </li>
              </ol>
              <div class="activity-actions">
                <button class="activity-btn" type="button" data-action="check">Check Answers</button>
                <button class="activity-btn secondary" type="button" data-action="reset">Reset</button>
              </div>
              <div class="feedback-msg" aria-live="polite"></div>
            </div>
          `,
          whenToUse:
            'Drop this into the clarification stage after an input text so learners reassemble key moments with controlled language.',
          customizations: [
            'Replace the verbs with sector-specific collocations (e.g., “secured pledges,” “mapped stakeholders”) to match your project theme.',
            'Embed short audio clips of each sentence for pronunciation reinforcement when working asynchronously.'
          ],
          troubleshooting: [
            'If answers come back single words only, require groups to read the full sentence aloud before checking to reinforce context.',
            'For classes struggling with tense review, pre-teach a mini number line showing the order of events they are reconstructing.'
          ]
        }
      },
      {
        layout: 'inline-module',
        content: {
          title: 'Matching Stack · Function Labels',
          summary: 'Help learners link distancing phrases with pragmatic intent.',
          description:
            'Invite triads to debate which option fits best before selecting; dissent surfaces subtle distinctions in tone.',
          facilitationStrategies: [
            'Circulate and ask “What makes that function different from the others?” so groups verbalise decision criteria.',
            'When revealing answers, have learners rewrite one option in their own words to check comprehension beyond matching.'
          ],
          moduleHTML: `
            <div class="card" data-activity="matching">
              <p>Match each phrase to the function it performs in a cautious project update.</p>
              <div class="matching-stack">
                <div class="matching-option" data-correct="Acknowledging a potential limitation without blame.">
                  <span>There may be a capacity gap in our weekend coverage.</span>
                  <select>
                    <option value="">Select function...</option>
                    <option>Acknowledging a potential limitation without blame.</option>
                    <option>Requesting urgent escalation from leadership.</option>
                    <option>Highlighting strong evidence to support a decision.</option>
                  </select>
                </div>
                <div class="matching-option" data-correct="Requesting urgent escalation from leadership.">
                  <span>Could we escalate this to the steering group for a decision?</span>
                  <select>
                    <option value="">Select function...</option>
                    <option>Acknowledging a potential limitation without blame.</option>
                    <option>Requesting urgent escalation from leadership.</option>
                    <option>Highlighting strong evidence to support a decision.</option>
                  </select>
                </div>
                <div class="matching-option" data-correct="Highlighting strong evidence to support a decision.">
                  <span>The pilot data clearly indicates a higher retention rate.</span>
                  <select>
                    <option value="">Select function...</option>
                    <option>Acknowledging a potential limitation without blame.</option>
                    <option>Requesting urgent escalation from leadership.</option>
                    <option>Highlighting strong evidence to support a decision.</option>
                  </select>
                </div>
              </div>
              <div class="activity-actions">
                <button class="activity-btn" type="button" data-action="check">Check Answers</button>
                <button class="activity-btn secondary" type="button" data-action="reset">Reset</button>
              </div>
              <div class="feedback-msg" aria-live="polite"></div>
            </div>
          `,
          whenToUse:
            'Use in the controlled practice phase when you need learners to discriminate between close-but-different pragmatic moves.',
          customizations: [
            'Swap the select options for drag-and-drop tokens if you are working in a digital whiteboard and want a tactile variation.',
            'Add a fourth “distractor” function that seems plausible to spark discussion about shades of meaning.'
          ],
          troubleshooting: [
            'If groups guess without discussion, require them to note one clue from the sentence that signposts the function before checking.',
            'Pair struggling learners with a mentor who can paraphrase each function using simpler language before they choose.'
          ]
        }
      },
      {
        layout: 'inline-module',
        content: {
          title: 'Matching Grid · Quick Connections',
          summary: 'Get learners pairing prompts and responses with tactile clicks.',
          description:
            'Encourage a “think, tap, tell” routine: choose a question, tap an answer, then justify the pairing out loud.',
          facilitationStrategies: [
            'Demonstrate how the highlight moves when learners reassign a pair so they feel comfortable correcting themselves mid-stream.',
            'Once matches are locked, ask partners to role-play a mini dialogue using the linked question and answer.'
          ],
          moduleHTML: `
            <div class="card" data-activity="matching-connect">
              <p>Tap a question, then tap the answer that keeps the update polite yet clear.</p>
              <div class="matching-connect-grid" role="group" aria-label="Click to connect questions and answers">
                <div class="match-column" aria-label="Questions">
                  <button type="button" class="match-item match-question" data-question-id="q1" data-answer="We&#39;re preparing a quick summary for the board.">
                    <span class="match-text">1. What should we send the board this afternoon?</span>
                    <span class="match-assignment" aria-live="polite"></span>
                  </button>
                  <button type="button" class="match-item match-question" data-question-id="q2" data-answer="It needs one more round of fact-checking.">
                    <span class="match-text">2. Is the impact report ready to circulate?</span>
                    <span class="match-assignment" aria-live="polite"></span>
                  </button>
                  <button type="button" class="match-item match-question" data-question-id="q3" data-answer="Let&#39;s brief the volunteers before the weekend.">
                    <span class="match-text">3. What is the immediate next step for our volunteers?</span>
                    <span class="match-assignment" aria-live="polite"></span>
                  </button>
                </div>
                <div class="match-column" aria-label="Answers">
                  <button type="button" class="match-item match-answer" data-value="We&#39;re preparing a quick summary for the board.">
                    <span class="match-text">A. We&#39;re preparing a quick summary for the board.</span>
                  </button>
                  <button type="button" class="match-item match-answer" data-value="It needs one more round of fact-checking.">
                    <span class="match-text">B. It needs one more round of fact-checking.</span>
                  </button>
                  <button type="button" class="match-item match-answer" data-value="Let&#39;s brief the volunteers before the weekend.">
                    <span class="match-text">C. Let&#39;s brief the volunteers before the weekend.</span>
                  </button>
                </div>
              </div>
              <div class="activity-actions">
                <button class="activity-btn secondary" type="button" data-action="reset">Reset</button>
                <button class="activity-btn" type="button" data-action="check">Check Answers</button>
              </div>
              <div class="feedback-msg" aria-live="polite"></div>
            </div>
          `,
          whenToUse:
            'Drop this mid-lesson to re-energise groups when they need to revisit key Q&A language from a dialogue or listening task.',
          customizations: [
            'Swap text answers for image cards when you want learners to match questions to visual cues in community outreach scenarios.',
            'Add an “Explain why” column to capture notes once pairs have made their matches for deeper reflection.'
          ],
          troubleshooting: [
            'If learners forget to deselect before tapping a new match, demonstrate slowly how to clear a question by tapping it twice.',
            'Prepare an answer key slide so you can quickly project the solution if technology hiccups interrupt the feedback message.'
          ]
        }
      },
      {
        layout: 'inline-module',
        content: {
          title: 'Quiz Cards · Micro Checks',
          summary: 'Use fast form-focused questions to confirm understanding.',
          description:
            'Challenge groups to justify each choice with evidence from the prior reading or input, not just instinct.',
          facilitationStrategies: [
            'Ask learners to hold up fingers to show confidence (1–5) before checking; it invites reflection on certainty.',
            'After revealing the score, assign each pair one incorrect option to rewrite into a correct statement.'
          ],
          moduleHTML: `
            <div class="card" data-activity="mc-grammar">
              <p>Choose the option that best completes each reflection sentence.</p>
              <div class="quiz-card" data-answer="aligned">
                <p>
                  1. Our messaging must stay
                  <select>
                    <option>...</option>
                    <option>aligned</option>
                    <option>isolated</option>
                    <option>improvised</option>
                  </select>
                  with the community brief.
                </p>
              </div>
              <div class="quiz-card" data-answer="stakeholders">
                <p>
                  2. Let&#39;s invite the primary
                  <select>
                    <option>...</option>
                    <option>stakeholders</option>
                    <option>obstacles</option>
                    <option>shortcuts</option>
                  </select>
                  to the wrap-up call.
                </p>
              </div>
              <div class="quiz-card" data-answer="prototype">
                <p>
                  3. We should test a small
                  <select>
                    <option>...</option>
                    <option>prototype</option>
                    <option>detour</option>
                    <option>headline</option>
                  </select>
                  before scaling the idea.
                </p>
              </div>
              <div class="activity-actions">
                <button class="activity-btn" type="button" data-action="check">Check Answers</button>
                <button class="activity-btn secondary" type="button" data-action="reset">Reset</button>
              </div>
              <div class="feedback-msg" aria-live="polite"></div>
            </div>
          `,
          whenToUse:
            'Deploy right after a dense reading or input burst to confirm key lexis before moving into freer production.',
          customizations: [
            'Swap the select menus for radio-button quiz options when you need to model the alternative layout used in exams.',
            'Add a short reflection box beneath each card asking learners to cite the line in the text that justifies their answer.'
          ],
          troubleshooting: [
            'If everyone selects the same wrong option, pause and revisit the anchor text together to locate the supporting sentence.',
            'Remind learners to reset the card before replaying the check so feedback clears and they can attempt again.'
          ]
        }
      },
      {
        layout: 'inline-module',
        content: {
          title: 'Stress Sentences · Prosody Awareness',
          summary: 'Tune learners into emphasis choices that change meaning.',
          description:
            'Demonstrate one sentence twice—once with neutral stress, once with contrastive stress—so learners hear the shift before they click.',
          facilitationStrategies: [
            'Have groups annotate why the stressed word matters (e.g., it signals caution, urgency, or optimism).',
            'Invite volunteers to record themselves reading the sentence with the chosen stress and share the clip for peer feedback.'
          ],
          moduleHTML: `
            <div class="card" data-activity="stress-mark">
              <p>Click the word you would stress to convey your stance clearly.</p>
              <div class="stress-sentence" data-correct="really">
                <span class="stress-word">We</span>
                <span class="stress-word">really</span>
                <span class="stress-word">appreciate</span>
                <span class="stress-word">the</span>
                <span class="stress-word">volunteers.</span>
              </div>
              <div class="stress-sentence" data-correct="might">
                <span class="stress-word">The</span>
                <span class="stress-word">timeline</span>
                <span class="stress-word">might</span>
                <span class="stress-word">need</span>
                <span class="stress-word">adjusting.</span>
              </div>
              <div class="stress-sentence" data-correct="still">
                <span class="stress-word">We</span>
                <span class="stress-word">still</span>
                <span class="stress-word">believe</span>
                <span class="stress-word">in</span>
                <span class="stress-word">the</span>
                <span class="stress-word">plan.</span>
              </div>
              <div class="activity-actions">
                <button class="activity-btn" type="button" data-action="check">Check Answers</button>
                <button class="activity-btn secondary" type="button" data-action="reset">Reset</button>
              </div>
              <div class="feedback-msg" aria-live="polite"></div>
            </div>
          `,
          whenToUse:
            'Place this after a pronunciation focus or before learners role-play updates so they rehearse contrastive stress patterns.',
          customizations: [
            'Record short model audio clips for each sentence so learners can compare their delivery with yours.',
            'Swap the sentences for lines drawn from upcoming presentations or reports to keep stress practice authentic.'
          ],
          troubleshooting: [
            'If learners click every word, remind them to listen for which syllable changes the implied attitude.',
            'For mixed-ability groups, allow learners to annotate the sentence with arrows or underline before committing to a click.'
          ]
        }
      }
    ]
  };

  window.MOSAIC_PRESENTATIONS = window.MOSAIC_PRESENTATIONS || {};
  window.MOSAIC_PRESENTATIONS[presentation.id] = presentation;
})();
