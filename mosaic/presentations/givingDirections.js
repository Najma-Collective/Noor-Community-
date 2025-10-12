(() => {
  const presentation = {
    id: 'givingDirections',
    deckTitle: 'How to Give Directions',
    slides: [
      {
        layout: 'hero-title',
        content: {
          backgroundImageQuery: 'city map navigation with people asking directions',
          backgroundImage: 'https://images.pexels.com/photos/7362886/pexels-photo-7362886.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
          backgroundImageAlt: 'Close-up of hands holding a smartphone with GPS navigation displayed, in a car setting.',
          backgroundImageCredit: 'RDNE Stock project',
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
          image: 'https://images.pexels.com/photos/8828455/pexels-photo-8828455.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
          imageAlt: 'Colorful pushpins marking locations on a detailed map of Central Asia.',
          imageCredit: 'Lara Jameson'
        }
      }
    ]
  };

  window.MOSAIC_PRESENTATIONS = window.MOSAIC_PRESENTATIONS || {};
  window.MOSAIC_PRESENTATIONS[presentation.id] = presentation;
})();
