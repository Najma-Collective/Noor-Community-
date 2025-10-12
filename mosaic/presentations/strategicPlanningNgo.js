(() => {
  const presentation = {
    id: 'strategicPlanningNgo',
    deckTitle: 'Strategic Planning in the NGO Sector',
    slides: [
      {
        layout: 'hero-title',
        content: {
          title: 'Strategic Planning in the NGO Sector',
          backgroundImageQuery: 'environmental ngo workers in a meeting',
          backgroundImageAlt:
            'A diverse group of people collaborating around a table with charts and documents about environmental conservation.'
        }
      },
      {
        layout: 'framed-list',
        content: {
          title: "Today's Aims",
          introText: 'By the end of this lesson, you will be able to:',
          listItems: [
            '<i class="fa-solid fa-magnifying-glass-chart" style="margin-right: 10px; color: #005a70;"></i>Analyze a report on a local environmental issue to identify key challenges.',
            '<i class="fa-solid fa-scale-balanced" style="margin-right: 10px; color: #005a70;"></i>Evaluate two proposed strategies and justify your choice using persuasive language.',
            '<i class="fa-solid fa-users" style="margin-right: 10px; color: #005a70;"></i>Collaborate with a group to summarize your analysis and recommendations.',
            '<i class="fa-solid fa-volume-high" style="margin-right: 10px; color: #005a70;"></i>Use sentence stress effectively to emphasize key data and findings in a discussion.'
          ]
        }
      },
      {
        layout: 'discussion-table',
        content: {
          title: '<i class="fa-solid fa-lightbulb" style="margin-right: 10px;"></i>Activate: Successful Community Projects',
          subtitle: 'Work in pairs. Discuss the following questions (3 minutes):',
          questions: [
            'Think of a successful community-based project you know of in Palestine (it can be about the environment, culture, education, etc.). What was its goal?',
            'What made it successful? What challenges did it face?',
            'Why are community-based projects often important for creating sustainable change?'
          ]
        }
      },
      {
        layout: 'audio-comprehension',
        content: {
          title: '<i class="fa-solid fa-ear-listen" style="margin-right: 10px;"></i>Model: Analyzing a Discussion',
          instruction:
            'You will listen to a dialogue between two NGO workers, Fatima and Yousef. Listen and answer: What is the main problem, and what are the two options they are considering?',
          audioFile: 'assets/audio/ngo-recycling-discussion.mp3',
          imageQuery: 'recycling bins nablus',
          imageAlt: 'A row of recycling bins on a city street in Nablus.',
          text: `
            <p><strong>Fatima:</strong> Okay, so the municipal report <em>came out</em> last week. It <em>showed</em> that while we <em>were running</em> the awareness campaign last year, recycling rates <em>hadn't improved</em> as much as we'd hoped. The main issue they <em>identified</em> was contamination in the bins.</p>
            <p><strong>Yousef:</strong> I see. So, we have two options: invest in expensive sorting technology at the plant, or run a new series of targeted community workshops. For me, the choice is clear. The key to long-term <strong>sustainability</strong> is direct engagement. We need to focus on the <strong>stakeholders</strong> themselves.</p>
            <p><strong>Fatima:</strong> You think workshops will be more effective?</p>
            <p><strong>Yousef:</strong> Definitely. A proper <strong>impact assessment</strong> of the last campaign showed the message wasn't reaching older residents. If we design workshops <em>with</em> them, not <em>for</em> them, we can address the root cause. It's the only way to ensure real <strong>conservation</strong> of resources.</p>
          `
        }
      },
      {
        layout: 'analysis-table',
        content: {
          title: '<i class="fa-solid fa-gears" style="margin-right: 10px;"></i>Model: Language Analysis',
          instruction: 'In your pairs, review the transcript and discuss these questions:',
          questions: [
            'What past tenses does Fatima use to summarize the background of the problem?',
            'What specific phrases does Yousef use to argue for his preferred strategy (the community workshops)?'
          ]
        }
      },
      {
        layout: 'worksheet',
        content: {
          sections: [
            {
              title: '<i class="fa-solid fa-spell-check" style="margin-right: 8px;"></i>1. Past Tense Analysis',
              contentHTML: `
                <p>Look at the sentences from the dialogue. Why was each past tense used?</p>
                <ul>
                  <li>"The report <b>came out</b> last week." <em>(Completed action, specific time)</em></li>
                  <li>"While we <b>were running</b> the campaign..." <em>(Action in progress, background)</em></li>
                  <li>"...recycling rates <b>hadn't improved</b>..." <em>(Action completed before another past action)</em></li>
                </ul>
              `
            },
            {
              title: '<i class="fa-solid fa-book-open" style="margin-right: 8px;"></i>2. Vocabulary Practice',
              contentHTML: `
                <p>Complete these sentences using the words below:</p>
                <p><em>sustainability, conservation, impact assessment, carbon footprint, stakeholder, watershed</em></p>
                <ol>
                  <li>We need to consult every ______, from farmers to local residents.</li>
                  <li>The long-term ______ of the ______ depends on our actions now.</li>
                  <li>A full ______ will show us the potential effects of this project.</li>
                </ol>
              `
            }
          ]
        }
      },
      {
        layout: 'discussion-table',
        content: {
          title: '<i class="fa-solid fa-comments" style="margin-right: 10px;"></i>Language Focus: Freer Practice',
          subtitle:
            "Your NGO has a small budget surplus. In pairs, choose one option and convince your partner it's the best choice.",
          questions: [
            'Option A: Buy new, energy-efficient office printers.',
            'Option B: Fund a small community garden project.'
          ]
        }
      },
      {
        layout: 'full-text-block',
        content: {
          htmlContent: `
            <h2><i class="fa-solid fa-bullhorn" style="margin-right: 12px;"></i>Pronunciation: Using Stress to Emphasize Data</h2>
            <p>When we present data from a report, we stress the most important word to make our point.</p>
            <hr>
            <h4>Noticing Task</h4>
            <p>Listen to your teacher say one of the sentences below. Which one did you hear? What is the different meaning?</p>
            <p><b>A.</b> The report showed a <b>twenty</b> percent increase in water usage.</p>
            <p><b>B.</b> The report showed a twenty percent <b>increase</b> in water usage.</p>
          `
        }
      },
      {
        layout: 'two-column-details',
        content: {
          title: '<i class="fa-solid fa-microphone-lines" style="margin-right: 10px;"></i>Pronunciation: Information Gap Practice',
          subtitle:
            'Student A has the correct data. Student B, ask Student A questions to check your information. Student A, answer and stress the correct information.',
          leftContentHTML: `
            <h4>Student A's Card (Correct Info)</h4>
            <ul>
              <li>Project start date: 2019</li>
              <li>Number of villages affected: <strong>Twelve</strong></li>
              <li>Budget required: <strong>$50,000</strong></li>
            </ul>
          `,
          rightContentHTML: `
            <h4>Student B's Card (Incorrect Info)</h4>
            <ul>
              <li>Project start date: 2020?</li>
              <li>Number of villages affected: Twenty?</li>
              <li>Budget required: $15,000?</li>
            </ul>
          `
        }
      },
      {
        layout: 'worksheet',
        content: {
          sections: [
            {
              title: '<i class="fa-solid fa-bullseye" style="margin-right: 8px;"></i>Main Task: Planning a Water Conservation Strategy',
              contentHTML: `
                <p><strong>Homework:</strong> Before class, please read the 'Hebron Water Report Summary' document.</p>
                <p><strong>Scenario:</strong> You are a team of project officers at a Hebron-based environmental NGO. You have analyzed the report and must now choose one of two strategies to recommend for funding.</p>
              `
            },
            {
              title: '<i class="fa-solid fa-list-check" style="margin-right: 8px;"></i>Task (15 mins)',
              contentHTML: `
                <ol>
                  <li>In your group, briefly discuss the key challenges identified in the report (using past tenses).</li>
                  <li>Analyze the two proposed strategies. Choose the one you believe will be most effective and sustainable.</li>
                  <li>Justify your choice, using language from the lesson and data from the report.</li>
                  <li>Prepare a 3-slide summary of your decision in a shared document.</li>
                </ol>
              `
            },
            {
              title: '<i class="fa-solid fa-shuffle" style="margin-right: 8px;"></i>Strategy Options',
              contentHTML: `
                <p><strong>Strategy A (Community-Based):</strong> A public awareness campaign including workshops in schools and community centers, and the creation of local 'water-wise' committees.</p>
                <p><strong>Strategy B (Infrastructure-Focused):</strong> A plan to distribute subsidized water-saving fixtures (taps, shower heads) to households.</p>
              `
            },
            {
              title: '<i class="fa-solid fa-file-powerpoint" style="margin-right: 8px;"></i>Deliverable',
              contentHTML: `
                <p>Create a 3-slide presentation with these headings:</p>
                <ul>
                  <li>Slide 1: Title & Team Members</li>
                  <li>Slide 2: Summary of Key Challenges from the Report</li>
                  <li>Slide 3: Our Chosen Strategy & Justification</li>
                </ul>
              `
            }
          ]
        }
      },
      {
        layout: 'feedback-columns',
        content: {
          title: '<i class="fa-solid fa-person-chalkboard" style="margin-right: 10px;"></i>Reporting & Feedback: Gallery Walk',
          instruction:
            "In your new breakout rooms, open another group's presentation and discuss the following (5 mins):",
          column1Title: '<i class="fa-regular fa-circle-question" style="margin-right: 8px;"></i>Clarification Question',
          column2Title: '<i class="fa-solid fa-triangle-exclamation" style="margin-right: 8px;"></i>Challenge Question'
        }
      },
      {
        layout: 'task-preparation',
        content: {
          title: '<i class="fa-solid fa-clipboard-check" style="margin-right: 10px;"></i>Lesson Review & Next Steps',
          instruction: "Well done today! Let's quickly review our aims.",
          steps: [
            '<i class="fa-solid fa-check" style="margin-right: 10px; color: green;"></i>You analyzed a report and identified key challenges.',
            '<i class="fa-solid fa-check" style="margin-right: 10px; color: green;"></i>You evaluated two strategies and justified your choice.',
            '<i class="fa-solid fa-check" style="margin-right: 10px; color: green;"></i>You collaborated to summarize your recommendations.',
            '<i class="fa-solid fa-check" style="margin-right: 10px; color: green;"></i>You practiced using sentence stress to emphasize data.'
          ]
        }
      }
    ]
  };

  window.MOSAIC_PRESENTATIONS = window.MOSAIC_PRESENTATIONS || {};
  window.MOSAIC_PRESENTATIONS[presentation.id] = presentation;
})();
