(() => {
  const presentation = {
    id: 'buildingCv',
    deckTitle: 'Building a CV',
    slides: [
      {
        layout: 'hero-title',
        content: {
          backgroundImageQuery: 'professional resume workspace flatlay',
          backgroundImage: 'https://images.pexels.com/photos/590044/pexels-photo-590044.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
          backgroundImageAlt: 'Top view of a desk with resume, coffee cup, and laptop on a wooden surface, ideal for business concepts.',
          backgroundImageCredit: 'Lukas',
          title: 'Building a CV'
        }
      },
      {
        layout: 'framed-list',
        content: {
          title: 'Learning Outcomes',
          introText: 'By the end of this lesson, you will be able to:',
          listItems: [
            'Choose a clear CV structure that fits your profile.',
            'Write action-based bullet points that show impact.',
            'Tailor your CV to a specific role in minutes.'
          ]
        }
      },
      {
        layout: 'two-column-details',
        content: {
          title: 'Anatomy of a Strong CV',
          subtitle: 'Balance clarity with personal voice',
          leftContentHTML:
            '<h3>Essential sections</h3><ul><li>Professional summary: one dynamic sentence.</li><li>Key skills: 5 bullet points organised by theme.</li><li>Experience: reverse chronological with results.</li><li>Education: highlight relevant certifications.</li></ul>',
          rightContentHTML:
            '<h3>Design choices</h3><ul><li>Keep margins generous and fonts consistent.</li><li>Use bold, not colour, to signal hierarchy.</li><li>Leave breathing space for easy scanning.</li><li>Save as PDF to protect formatting.</li></ul>'
        }
      },
      {
        layout: 'full-text-block',
        content: {
          htmlContent:
            '<h2>Sample Snapshot</h2><p><strong>Jade Hassan</strong> | Project Coordinator</p><p><em>Summary:</em> Agile project lead with 5+ years managing cross-cultural teams to deliver community programmes.</p><h3>Experience</h3><ul><li><strong>Community Spark</strong> — Coordinated 12-week employability bootcamp; achieved 92% completion.</li><li><strong>Bright Futures NGO</strong> — Redesigned volunteer onboarding, cutting attrition by 30%.</li></ul><h3>Skills</h3><ul><li>Stakeholder communication</li><li>Event budgeting</li><li>Report writing</li></ul>'
        }
      },
      {
        layout: 'discussion-table',
        content: {
          title: 'Warm Discussion',
          subtitle: 'Discuss the questions in pairs.',
          questions: [
            'What do recruiters scan first on a CV?',
            'How can a hobby strengthen your profile?',
            'When did you last update your CV and why?'
          ]
        }
      },
      {
        layout: 'analysis-table',
        content: {
          title: 'Experience Analyzer',
          instruction: 'Rewrite each bullet with action verbs and numbers.',
          questions: [
            'Organised events for students.',
            'Helped the sales team reach targets.',
            'Worked in customer service at a cafe.'
          ]
        }
      },
      {
        layout: 'image-response',
        content: {
          title: 'Personal Branding',
          instruction: 'Note two ways to express your personality professionally.',
          imageQuery: 'confident professional portrait smiling in office',
          image: 'https://images.pexels.com/photos/7552374/pexels-photo-7552374.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
          imageAlt: 'Young woman with curly hair working on her laptop in a cozy home setting, exuding confidence and focus.',
          imageCredit: 'Hanna Pad'
        }
      },
      {
        layout: 'checklist',
        content: {
          title: 'Peer Review Checklist',
          instruction: 'Swap CV drafts and tick each item.',
          checklistItems: [
            '<b>Summary hooks attention</b> with role-specific keywords.',
            '<b>Experience bullets</b> include numbers or outcomes.',
            '<b>Design stays consistent</b> with spacing and fonts.',
            '<b>Contact details</b> look professional and current.'
          ]
        }
      },
      {
        layout: 'task-preparation',
        content: {
          title: 'Next Steps',
          instruction: 'Prepare to finalise your CV tonight.',
          steps: [
            'Select a job ad and highlight three repeated phrases.',
            'Tailor your summary + top skills to match the language.',
            'Email your updated CV to a peer for feedback.'
          ]
        }
      }
    ]
  };

  window.MOSAIC_PRESENTATIONS = window.MOSAIC_PRESENTATIONS || {};
  window.MOSAIC_PRESENTATIONS[presentation.id] = presentation;
})();
