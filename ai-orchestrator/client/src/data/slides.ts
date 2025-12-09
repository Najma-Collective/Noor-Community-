/**
 * Slide content extracted from B2-1-3-b.html
 * Each slide's HTML structure preserved for rendering
 */

export interface SlideContent {
  index: number;
  html: string;
  className: string; // e.g., 'full-width-bg', 'centered-text'
}

export const slides: SlideContent[] = [
  // Slide 1: Title
  {
    index: 0,
    className: 'full-width-bg',
    html: `
      <img src="https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Team planning a project" class="img-bg" style="opacity: 0.2;">
      <div class="img-overlay" style="background: linear-gradient(80deg, var(--soft-white) 45%, transparent 90%);"></div>
      <div class="slide-inner">
        <div class="bg-content grid-container">
          <div class="col-span-7">
            <p class="subtitle" style="color: var(--primary-sage);">B2 English Lesson</p>
            <h1>Planning for Impact</h1>
            <p style="font-size: var(--step-2); color: var(--ink-muted);">Consolidating language for NGO project planning and fundraising.</p>
          </div>
        </div>
      </div>
    `
  },

  // Slide 2: Today's Goals
  {
    index: 1,
    className: '',
    html: `
      <div class="slide-inner">
        <div class="grid-container">
          <div class="col-span-12 centered-text">
            <h2 class="subtitle">Today's Goals</h2>
          </div>
          <div class="col-span-6">
            <div class="card"><i class="fas fa-sitemap icon"></i><h3>Connect Ideas</h3><p>Combine vocabulary for fundraising and project proposals.</p></div>
          </div>
          <div class="col-span-6">
            <div class="card"><i class="fas fa-lightbulb icon"></i><h3>Discuss Hypotheticals</h3><p>Use the Second Conditional to talk about project plans.</p></div>
          </div>
          <div class="col-span-6">
            <div class="card"><i class="fas fa-bullseye icon"></i><h3>Explain Your Reasons</h3><p>Use clauses of purpose to justify fundraising decisions.</p></div>
          </div>
          <div class="col-span-6">
            <div class="card"><i class="fas fa-users icon"></i><h3>Solve Problems</h3><p>Use all your language in a realistic planning meeting.</p></div>
          </div>
        </div>
      </div>
    `
  },

  // Slide 3: Lead-in Discussion
  {
    index: 2,
    className: '',
    html: `
      <div class="slide-inner">
        <div class="grid-container">
          <div class="col-span-5 centered-text">
            <i class="fa-solid fa-comments" style="font-size: 5rem; color: var(--tertiary-sage);"></i>
            <h2 style="margin-top: 1rem;">Let's Discuss!</h2>
            <p class="subtitle" style="color: var(--ink-muted);">Your thoughts on community projects...</p>
          </div>
          <div class="col-span-7">
            <p><strong>1.</strong> What's the biggest challenge for a new community project: <span class="text-highlight">getting money</span> or <span class="text-highlight">managing the project</span>?</p>
            <hr class="divider">
            <p><strong>2.</strong> How do project <span class="text-highlight">objectives</span> change if the donor is local vs. international?</p>
            <hr class="divider">
            <p><strong>3.</strong> Why do you think successful projects succeed? What is their <span class="text-highlight">rationale</span>?</p>
          </div>
        </div>
      </div>
    `
  },

  // Slide 4: Activity 1 - Vocabulary
  {
    index: 3,
    className: '',
    html: `
      <div class="slide-inner">
        <div class="grid-container">
          <div class="col-span-5">
            <h2 class="subtitle">Activity 1</h2>
            <h2>Connecting Concepts</h2>
            <p>With a partner, create a short dialogue between two NGO colleagues. Your dialogue must use vocabulary from both fundraising and project planning.</p>
            <blockquote>For example: "In our <span class="text-highlight">grant proposal</span>, we must define the project's <span class="text-highlight">objective</span>."</blockquote>
          </div>
          <div class="col-span-7">
            <div class="card">
              <h3>Vocabulary Connections:</h3>
              <div class="grid-container">
                <div class="col-span-6">
                  <p><strong>Funding Terms:</strong></p>
                  <ul>
                    <li>grant proposal</li>
                    <li>donor relations</li>
                    <li>budget allocation</li>
                    <li>measurable outcome</li>
                  </ul>
                </div>
                <div class="col-span-6">
                  <p><strong>Proposal Terms:</strong></p>
                  <ul>
                    <li>objective</li>
                    <li>rationale</li>
                    <li>methodology</li>
                    <li>timeline</li>
                    <li>stakeholders</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },

  // Slide 5: Activity 2 - Second Conditional
  {
    index: 4,
    className: '',
    html: `
      <div class="slide-inner">
        <div class="grid-container">
          <div class="col-span-5 centered-text">
            <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 6rem; color: var(--tertiary-sage);"></i>
            <h2 style="margin-top: 1rem;">What If...?</h2>
            <p class="subtitle" style="color: var(--ink-muted);">Activity 2: Second Conditional</p>
          </div>
          <div class="col-span-7">
            <div class="card">
              <h3>Discuss these 'what if' scenarios:</h3>
              <p><strong>1.</strong> What would you change about the project's <span class="text-highlight">objective</span> if you <span class="text-highlight">had</span> double the budget?</p>
              <hr class="divider">
              <p><strong>2.</strong> If the main <span class="text-highlight">stakeholders</span> gave negative feedback, how <span class="text-highlight">would</span> you adapt your <span class="text-highlight">methodology</span>?</p>
              <hr class="divider">
              <p><strong>3.</strong> If you <span class="text-highlight">had</span> only six months, what impact <span class="text-highlight">would</span> you focus on?</p>
            </div>
          </div>
        </div>
      </div>
    `
  },

  // Slide 6: Activity 3 - Purpose Clauses
  {
    index: 5,
    className: '',
    html: `
      <div class="slide-inner">
        <div class="grid-container">
          <div class="col-span-7">
            <div class="card">
              <h3>Your Task: Role-Play</h3>
              <p><strong>Student A:</strong> You are an NGO manager. <br><strong>Student B:</strong> You are a potential donor.</p>
              <hr class="divider">
              <p>Manager, convince the donor to fund your project. Use purpose clauses to explain why you need the money.</p>
              <blockquote>Example: "We need $10,000 <span class="text-highlight">in order to</span> buy new equipment. This is necessary <span class="text-highlight">because</span> our current tools are old."</blockquote>
            </div>
          </div>
          <div class="col-span-5">
            <h2 class="subtitle">Activity 3</h2>
            <h2>Explaining the 'Why'</h2>
            <p>Use clauses of purpose and reason to justify your plans.</p>
            <ul>
              <li>...<span class="text-highlight">in order to</span> expand our work.</li>
              <li>...<span class="text-highlight">so that</span> they continue to support us.</li>
              <li>...<span class="text-highlight">because</span> our team needs new skills.</li>
            </ul>
          </div>
        </div>
      </div>
    `
  },

  // Slide 7: Activity 4 - Problem Solving
  {
    index: 6,
    className: 'centered-text',
    html: `
      <i class="fa-solid fa-puzzle-piece" style="font-size: 4rem; color: var(--tertiary-sage);"></i>
      <h1>Activity 4: The Donor's Condition</h1>
      <p>In your groups, discuss this problem:</p>
      <div class="dialogue-box" style="margin-top: 1rem; max-width: 800px; text-align: left;">
        Your donor gave you the grant! But they have a last-minute condition: You must show a <span class="text-highlight">measurable outcome</span> in 3 months, not 12. What would you do?
        <hr class="divider">
        <p style="font-size: var(--step--1);">Use the second conditional (If we...) to discuss options, and purpose clauses (because...) to justify your final decision.</p>
      </div>
    `
  },

  // Slide 8: Main Task Intro
  {
    index: 7,
    className: 'centered-text',
    html: `
      <div class="slide-inner">
        <i class="fa-solid fa-star" style="font-size: 4rem; color: var(--primary-sage);"></i>
        <h1>The Main Task</h1>
        <h2 class="subtitle">Role-Play: The Strategic Planning Meeting</h2>
        <blockquote>Time to use all your language to plan a new project.</blockquote>
      </div>
    `
  },

  // Slide 9: Main Task Roles
  {
    index: 8,
    className: 'full-width-bg',
    html: `
      <img src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Team meeting" class="img-bg" style="opacity: 0.12;">
      <div class="img-overlay" style="background: linear-gradient(180deg, var(--soft-white) 10%, transparent 100%);"></div>
      <div class="slide-inner">
        <div class="grid-container align-self-start">
          <div class="col-span-12 centered-text">
            <h2>Scenario: Internal Planning Meeting</h2>
          </div>
          <div class="col-span-6">
            <div class="card card-full-height">
              <i class="fa-solid fa-calculator icon"></i>
              <h3>Role A: Finance Manager</h3>
              <p>You are worried about money and resources. Listen to the project idea and ask difficult hypothetical questions using the <span class="text-highlight">second conditional</span>.</p>
              <blockquote>"What would happen to the budget if we couldn't find volunteers?"</blockquote>
            </div>
          </div>
          <div class="col-span-6">
            <div class="card card-full-height">
              <i class="fa-solid fa-diagram-project icon"></i>
              <h3>Role B: Project Manager</h3>
              <p>You have a great idea for a new project. Present your idea's <span class="text-highlight">objective, rationale,</span> and <span class="text-highlight">methodology</span>. Convince the Finance Manager it's a good idea.</p>
            </div>
          </div>
        </div>
      </div>
    `
  },

  // Slide 10: Follow-Up Task
  {
    index: 9,
    className: '',
    html: `
      <div class="slide-inner">
        <div class="grid-container">
          <div class="col-span-12 centered-text">
            <h2 class="subtitle">Follow-Up Task</h2>
          </div>
          <div class="col-span-6">
            <div class="card card-full-height">
              <i class="fa-solid fa-person-chalkboard icon"></i>
              <h3>1. Update the Director</h3>
              <p>Join another pair. The Project Managers will explain their ideas, and the Finance Managers will summarize the financial concerns.</p>
            </div>
          </div>
          <div class="col-span-6">
            <div class="card card-full-height">
              <i class="fa-solid fa-check-double icon"></i>
              <h3>2. Make a Final Decision</h3>
              <p>As a group of four, discuss: Which of the two project ideas is more realistic? Use language of purpose and reason to justify your choice.</p>
            </div>
          </div>
        </div>
      </div>
    `
  },

  // Slide 11: Reflection
  {
    index: 10,
    className: '',
    html: `
      <div class="slide-inner">
        <div class="grid-container">
          <div class="col-span-12 centered-text">
            <h2 class="subtitle">Let's Reflect!</h2>
            <p>Think about your own learning today.</p>
          </div>
          <div class="col-span-4"><div class="card card-full-height"><p>Was it more challenging to use the <span class="text-highlight">vocabulary</span> or the <span class="text-highlight">grammar</span> today?</p></div></div>
          <div class="col-span-4"><div class="card card-full-height"><p>What is one thing you would say <span class="text-highlight">differently</span> if you did the final role-play again?</p></div></div>
          <div class="col-span-4"><div class="card card-full-height"><p>Which piece of language today will be <span class="text-highlight">most useful</span> for you in real life?</p></div></div>
        </div>
      </div>
    `
  },

  // Slide 12: End
  {
    index: 11,
    className: 'centered-text',
    html: `
      <div class="slide-inner centered-text">
        <i class="fa-solid fa-hands-clapping" style="font-size: 4rem; color: var(--primary-sage);"></i>
        <h1>Excellent work today!</h1>
        <h2 class="subtitle">See you next time!</h2>
      </div>
    `
  }
];
