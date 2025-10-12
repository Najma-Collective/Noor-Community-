(() => {
  const presentation = {
    id: 'tourismStorytelling',
    deckTitle: 'Tourism & Storytelling',
    slides: [
      {
        layout: 'hero-title',
        content: {
          backgroundImageQuery: 'sunrise over bustling market in morocco',
          backgroundImageAlt: 'Sunrise casting warm light over a lively Moroccan market',
          title: 'Tourism & Storytelling'
        }
      },
      {
        layout: 'simple-centered-text',
        content: {
          title: 'Our Journey Today',
          subtitle: 'Observe • Imagine • Share'
        }
      },
      {
        layout: 'image-prompt',
        content: {
          title: 'Warm-up',
          instruction: 'What details make this marketplace unforgettable?',
          imageQuery: 'colorful market street with people and spices',
          imageAlt: 'Vibrant street market filled with spices, fabrics, and visitors'
        }
      },
      {
        layout: 'image-matching-horizontal',
        content: {
          title: 'Match the Mood',
          instruction: 'Pair each photo with the sentence that fits the vibe.',
          imageQueries: [
            'tour guide pointing at sunrise in mountains',
            'travelers tasting spices at market stall',
            'friends taking photo while laughing in city'
          ],
          imageAltTexts: [
            'Guide gesturing toward a glowing sunrise in the mountains',
            'Travellers sampling spices at a bustling market stall',
            'Friends laughing together while snapping a city photo'
          ],
          sentences: [
            'The guide points to the horizon as the sun rises.',
            'Travellers pause to taste a new spice at the stall.',
            'Friends laugh while trying to capture the perfect photo.'
          ]
        }
      },
      {
        layout: 'storyboard-creator',
        content: {
          title: 'Craft Your Storyboard',
          instruction: 'Write a sentence under each frame to tell a mini-tour.',
          imageQueries: [
            'travel group exploring old city street',
            'local vendor serving tea to tourists',
            'family admiring scenic overlook at sunset',
            'night market with string lights and performers'
          ],
          imageAltTexts: [
            'Travellers walking through a narrow historic city street',
            'Vendor pouring tea for visiting tourists at a market stall',
            'Family enjoying a panoramic sunset view from an overlook',
            'Night market glowing with string lights and live performers'
          ]
        }
      },
      {
        layout: 'gap-fill-exercise',
        content: {
          title: 'Narration Boost',
          instruction: 'Use the words to complete the storytelling sentence.',
          wordBox: ['vibrant', 'stalls', 'weaving'],
          sentence: 'The ___ guide led us through ___ of colour, weaving a ___ memory.'
        }
      },
      {
        layout: 'audio-comprehension',
        content: {
          title: 'Listen & Note',
          instruction: 'Imagine you hear a guide welcoming visitors. Capture two key points.',
          imageQuery: 'tour guide smiling with microphone welcoming guests',
          imageAlt: 'Tour guide smiling with a microphone while greeting guests',
          text: '“Welcome back! Today we explore the hidden alleys, sample sweet saffron tea, and learn a phrase locals love.”',
          audioFile: 'assets/audio/tour-guide.mp3'
        }
      },
      {
        layout: 'three-column-reflection',
        content: {
          title: 'Reflect & Share',
          instruction: 'Capture quick thoughts before your presentation.',
          questions: [
            'Which moment in your story feels most vivid?',
            'What sensory detail can you add?',
            'How will you invite listeners into the journey?'
          ]
        }
      },
      {
        layout: 'reporting-prompt',
        content: {
          title: 'Ready to Report Back',
          instruction: 'Use the image to guide your storytelling summary.',
          imageQuery: 'traveler sharing story with group in plaza',
          imageAlt: 'Traveller animatedly sharing a story with a group in a plaza'
        }
      }
    ]
  };

  window.MOSAIC_PRESENTATIONS = window.MOSAIC_PRESENTATIONS || {};
  window.MOSAIC_PRESENTATIONS[presentation.id] = presentation;
})();
