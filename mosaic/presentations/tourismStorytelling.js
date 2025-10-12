(() => {
  const presentation = {
    id: 'tourismStorytelling',
    deckTitle: 'Tourism & Storytelling',
    slides: [
      {
        layout: 'hero-title',
        content: {
          backgroundImageQuery: 'sunrise over bustling market in morocco',
          backgroundImage: 'https://images.pexels.com/photos/2610821/pexels-photo-2610821.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
          backgroundImageAlt: 'A vibrant outdoor market scene displaying hanging brass pots and people shopping.',
          backgroundImageCredit: 'Zak Chapman',
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
          image: 'https://images.pexels.com/photos/2977435/pexels-photo-2977435.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
          imageAlt: 'Bustling outdoor street market in Hanoi featuring colorful produce and local vendors.',
          imageCredit: 'Hugo Heimendinger'
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
          images: [
            'https://images.pexels.com/photos/3389955/pexels-photo-3389955.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
            'https://images.pexels.com/photos/25205130/pexels-photo-25205130.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
            'https://images.pexels.com/photos/3789215/pexels-photo-3789215.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'
          ],
          imageAltTexts: [
            'Vibrant hot air balloons soar over Cappadocia at sunrise.',
            'Crowds exploring the vibrant Grand Bazaar in Istanbul.',
            'Elderly man in a suit smiling while taking a selfie outside.'
          ],
          imageCredits: ['熊大 旅遊趣', 'Kadir Avşar', 'Andrea Piacquadio'],
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
          images: [
            'https://images.pexels.com/photos/29212334/pexels-photo-29212334.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
            'https://images.pexels.com/photos/33816933/pexels-photo-33816933.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
            'https://images.pexels.com/photos/5472523/pexels-photo-5472523.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
            'https://images.pexels.com/photos/2771807/pexels-photo-2771807.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200'
          ],
          imageAltTexts: [
            'City crosswalk with people in an urban setting, featuring an old building.',
            'Visitors at St. Lawrence Market, Toronto, enjoying a variety of food delights.',
            'Family enjoying a walk in the scenic Moroccan countryside during a peaceful evening.',
            'Colorful lantern festival in Taiwan with lively crowds and decorations.'
          ],
          imageCredits: ['Anthony Lian', '@coldbeer', 'Ryutaro Tsukata', 'Kai-Chieh Chan']
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
          image: 'https://images.pexels.com/photos/3811863/pexels-photo-3811863.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
          imageAlt: 'Three tourists exploring a city using a map under bright daylight.',
          imageCredit: 'Andrea Piacquadio',
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
          image: 'https://images.pexels.com/photos/11324112/pexels-photo-11324112.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200',
          imageAlt: 'Monochrome scene of pilgrims resting near Santiago de Compostela Cathedral in Spain.',
          imageCredit: 'Zally'
        }
      }
    ]
  };

  window.MOSAIC_PRESENTATIONS = window.MOSAIC_PRESENTATIONS || {};
  window.MOSAIC_PRESENTATIONS[presentation.id] = presentation;
})();
