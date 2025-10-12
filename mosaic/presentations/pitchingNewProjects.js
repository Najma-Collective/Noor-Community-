(() => {
  const presentation = {
    id: 'pitchingNewProjects',
    deckTitle: 'Pitching a New Project Idea',
    slides: [
      {
        layout: 'hero-title',
        content: {
          title: 'Pitching a New Project Idea',
          backgroundImageQuery: 'team collaborating in modern office',
          backgroundImage: 'https://images.pexels.com/photos/23496705/pexels-photo-23496705.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
          backgroundImageAlt:
            'Young creative professionals discussing an architectural blueprint in a modern office setting.',
          backgroundImageCredit: 'Vitaly Gariev'
        }
      },
      {
        layout: 'simple-centered-text',
        content: {
          title: 'Lesson Goal',
          subtitle: 'Today, you will work in a team to create and deliver a persuasive project pitch.'
        }
      },
      {
        layout: 'discussion-table',
        content: {
          title: 'Warm-up: What Makes a Great Pitch?',
          subtitle: 'In your groups, discuss the following questions. Make notes in the boxes below.',
          questions: [
            'Think about a product or service you love. What makes it so appealing?',
            'What information is essential to include when proposing a new idea?',
            'What are some common mistakes people make when presenting a pitch?'
          ]
        }
      },
      {
        layout: 'two-column-details',
        content: {
          title: 'Key Language for Pitching',
          subtitle: 'Use these phrases to structure your pitch and make it more persuasive.',
          leftContentHTML: `
            <h4>Introducing the Idea</h4>
            <ul>
              <li>"We're excited to propose..."</li>
              <li>"Our project, [Project Name], addresses a key challenge..."</li>
              <li>"The core concept is to..."</li>
            </ul>
            <h4>Explaining the Benefit</h4>
            <ul>
              <li>"This will allow us to tap into a new market."</li>
              <li>"The key benefit for our customers is..."</li>
              <li>"This solution will significantly improve our efficiency by..."</li>
            </ul>
          `,
          rightContentHTML: `
            <h4>Describing the Target</h4>
            <ul>
              <li>"Our primary target audience is..."</li>
              <li>"We're focusing on professionals aged 25-40 who..."</li>
            </ul>
            <h4>Making a Call to Action</h4>
            <ul>
              <li>"We are seeking your approval to move forward."</li>
              <li>"Our ask is for a budget of $5,000 to develop a prototype."</li>
              <li>"We recommend proceeding with a pilot program."</li>
            </ul>
          `
        }
      },
      {
        layout: 'task-preparation',
        content: {
          title: 'Main Task: Prepare Your Pitch',
          instruction:
            'Your team works for a company that wants to improve employee wellness. Your task is to develop a project idea and prepare a 3-minute pitch to present to management. Follow these steps:',
          steps: [
            'Brainstorm 2-3 project ideas (e.g., a new fitness app, a mental health workshop series, healthier office snacks).',
            'Choose your best idea and give it a catchy name.',
            'Use the "Project Pitch Planner" on the next slide to structure your arguments.',
            'Decide who will present each part of the pitch.'
          ]
        }
      },
      {
        layout: 'worksheet',
        content: {
          title: 'Project Pitch Planner',
          sections: [
            {
              title: '1. Project Name & Core Concept',
              subtitle: 'Define the heart of your idea.',
              responsePrompts: [
                {
                  prompt: 'Summarise your idea in a single, memorable sentence.',
                  helperText: 'Keep it punchy—highlight the benefit for employee wellness.',
                  placeholder: 'e.g., “Mindful Moments” offers guided micro-meditations during the workday.'
                }
              ]
            },
            {
              title: '2. The Problem We Are Solving',
              subtitle: 'Diagnose the pain point.',
              responsePrompts: [
                {
                  prompt: 'Why is this project necessary right now?',
                  helperText: 'Use evidence or observations from your workplace.',
                  placeholder: 'e.g., Elevated stress is driving burnout and lowering productivity.'
                }
              ]
            },
            {
              title: '3. Key Benefits & Target Audience',
              subtitle: 'Connect impact to people.',
              responsePrompts: [
                {
                  prompt: 'Who gains the most and what changes for them?',
                  helperText: 'Think about both employees and the organisation.',
                  placeholder: 'e.g., Staff gain calmer workdays; leadership sees stronger morale and fewer sick days.'
                }
              ]
            },
            {
              title: '4. Call to Action',
              subtitle: 'Make a confident ask.',
              responsePrompts: [
                {
                  prompt: 'What specific decision or resource are you requesting?',
                  helperText: 'Be precise about timelines, budget, or support needs.',
                  placeholder: 'e.g., Approve a $2,000 budget for a three-month pilot launch.'
                }
              ]
            }
          ]
        }
      },
      {
        layout: 'reporting-prompt',
        content: {
          title: 'Presentation Time',
          instruction:
            'Each team will now have 3 minutes to present their pitch. As you listen to other teams, think about the feedback you will give them.',
          imageQuery: 'business person giving presentation to colleagues',
          image: 'https://images.pexels.com/photos/3861811/pexels-photo-3861811.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
          imageAlt:
            'A diverse team engaged in a vibrant office meeting led by a woman presenting ideas.',
          imageCredit: 'Andrea Piacquadio'
        }
      },
      {
        layout: 'feedback-columns',
        content: {
          title: 'Peer Feedback',
          instruction: 'Provide constructive feedback for one of the other teams. Use the "Star & Wish" model.',
          column1Title: 'Star (What was great?)',
          column2Title: 'Wish (What could be improved?)'
        }
      },
      {
        layout: 'three-column-reflection',
        content: {
          title: 'Lesson Reflection',
          instruction: "Take a moment to reflect on your own performance and today's lesson.",
          questions: [
            'What was the most challenging part of creating the pitch?',
            'What new phrase or vocabulary word will you use again?',
            'How confident do you feel about pitching an idea in English now?'
          ]
        }
      }
    ]
  };

  window.MOSAIC_PRESENTATIONS = window.MOSAIC_PRESENTATIONS || {};
  window.MOSAIC_PRESENTATIONS[presentation.id] = presentation;
})();
