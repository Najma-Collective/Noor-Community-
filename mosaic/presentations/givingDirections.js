(() => {
  const presentation = {
    id: 'givingDirections',
    deckTitle: 'How to Give Directions',
    slides: [
      {
        layout: 'hero-title',
        content: {
          backgroundImageQuery: 'city map navigation with people asking directions',
          backgroundImageAlt: 'Illustrated city navigation scene with people asking for directions',
          title: 'How to Give Directions'
        }
      },
      {
        layout: 'framed-list',
        content: {
          title: 'Lesson Goals',
          introText: 'By the end you can confidently:',
          listItems: [
            'Use sequencing phrases to guide a listener.',
            'Highlight landmarks to check understanding.',
            'Confirm that the listener feels confident to go.'
          ]
        }
      },
      {
        layout: 'matching-task-vertical',
        content: {
          title: 'Map the Route',
          instruction: 'Match the listener questions with the helpful responses.',
          stimulusHTML:
            '<p><strong>Starting point:</strong> City library entrance.</p><p><strong>Destination:</strong> Riverside cafe.</p><p>Consider turns, landmarks, and distance.</p>',
          options: [
            '“Walk past the fountain and take the first left.”',
            '“It is opposite the museum with the glass roof.”',
            '“It is a ten-minute walk; shall I mark it on your map?”'
          ]
        }
      },
      {
        layout: 'image-response',
        content: {
          title: 'Try It Out',
          instruction: 'Write two sentences to guide a visitor from the star to the cafe.',
          imageQuery: 'illustrated city map with location pins',
          imageAlt: 'Colorful illustrated city map showing landmarks and route markers'
        }
      }
    ]
  };

  window.MOSAIC_PRESENTATIONS = window.MOSAIC_PRESENTATIONS || {};
  window.MOSAIC_PRESENTATIONS[presentation.id] = presentation;
})();
