/**
 * Appendix Generator
 * Detailed guides for breathing techniques and practices
 */

const { COLORS, FONTS, LAYOUT, startNewSection, addPageFooter, drawRoundedRect } = require('./pdfStyles');

// Breathing techniques from the NeuroSense report
const BREATHING_TECHNIQUES = [
  {
    name: 'Alternate Nasal Breathing (Nadi Shodhana)',
    benefits: [
      'Balances left and right brain hemispheres',
      'Improves frontal lobe coherence',
      'Reduces anxiety and promotes calmness',
      'Enhances focus and mental clarity'
    ],
    steps: [
      'Sit comfortably with a straight spine',
      'Use your right thumb to close your right nostril',
      'Inhale slowly through your left nostril (4 counts)',
      'Close left nostril with ring finger, release right nostril',
      'Exhale through right nostril (4 counts)',
      'Inhale through right nostril (4 counts)',
      'Close right nostril, release left nostril',
      'Exhale through left nostril (4 counts)',
      'This completes one round. Repeat for 5-10 minutes'
    ]
  },
  {
    name: '4-7-8 Breathing',
    benefits: [
      'Activates parasympathetic nervous system',
      'Reduces high beta activity (stress)',
      'Improves alpha/beta ratio',
      'Promotes rapid relaxation and better sleep'
    ],
    steps: [
      'Sit or lie down in a comfortable position',
      'Place tongue tip behind upper front teeth',
      'Exhale completely through mouth with a whoosh sound',
      'Close mouth and inhale quietly through nose for 4 counts',
      'Hold breath for 7 counts',
      'Exhale completely through mouth for 8 counts',
      'Repeat this cycle 4 times',
      'Practice twice daily for best results'
    ]
  },
  {
    name: 'Humming Bee Breath (Bhramari)',
    benefits: [
      'Increases alpha and theta coherence',
      'Calms racing thoughts and anxiety',
      'Improves concentration',
      'Stimulates vagus nerve for relaxation'
    ],
    steps: [
      'Sit comfortably with eyes closed',
      'Place index fingers on ears or temples',
      'Inhale deeply through nose',
      'Exhale while making a humming sound like a bee',
      'Feel the vibration in your head',
      'Continue for 5-10 breaths',
      'Notice the calming effect after each round'
    ]
  },
  {
    name: 'Diaphragmatic Breathing',
    benefits: [
      'Increases alpha activity and relaxation',
      'Reduces arousal score (HiBeta/Beta ratio)',
      'Improves oxygen flow to brain',
      'Strengthens breathing efficiency'
    ],
    steps: [
      'Lie down or sit with back supported',
      'Place one hand on chest, one on belly',
      'Breathe in slowly through nose (4-5 counts)',
      'Feel your belly rise while chest stays still',
      'Exhale slowly through pursed lips (6-7 counts)',
      'Belly falls inward',
      'Practice for 5-10 minutes daily'
    ]
  },
  {
    name: 'Cyclic Sighing',
    benefits: [
      'Rapidly reduces stress and anxiety',
      'Lowers high beta activity',
      'Improves emotional regulation',
      'Scientifically proven to calm nervous system'
    ],
    steps: [
      'Inhale deeply through nose until lungs feel full',
      'Take a second, shorter inhale to maximally fill lungs',
      'Exhale very slowly through mouth',
      'Make the exhale longer than the inhale',
      'Repeat for 5 minutes',
      'Can be done anytime you feel stressed'
    ]
  },
  {
    name: 'Bhastrika (Breath of Fire)',
    benefits: [
      'Increases beta activity and alertness',
      'Energizes the brain',
      'Improves focus and concentration',
      'Clears mental fog'
    ],
    steps: [
      'Sit in comfortable position with straight spine',
      'Take a deep breath in through nose',
      'Forcefully exhale through nose',
      'Immediately forcefully inhale through nose',
      'Continue rapid, forceful breathing for 10-20 breaths',
      'End with a deep inhale and slow exhale',
      'Rest and observe the energizing effects',
      'Caution: Avoid if you have high blood pressure'
    ]
  },
  {
    name: 'Wim Hof Method',
    benefits: [
      'Increases stress resilience',
      'Improves focus and mental clarity',
      'Enhances mood and energy',
      'Strengthens immune system'
    ],
    steps: [
      'Sit or lie down comfortably',
      'Take 30-40 deep breaths (full inhale, passive exhale)',
      'After last exhale, hold breath as long as comfortable',
      'When you need to breathe, inhale deeply',
      'Hold breath for 15 seconds',
      'Exhale and return to normal breathing',
      'Repeat cycle 3 times',
      'Practice in safe environment only'
    ]
  },
  {
    name: 'Box Breathing (Square Breathing)',
    benefits: [
      'Balances nervous system',
      'Improves focus and attention',
      'Reduces theta/beta ratio',
      'Promotes calm alertness'
    ],
    steps: [
      'Sit comfortably with straight posture',
      'Exhale all air from lungs',
      'Inhale through nose for 4 counts',
      'Hold breath for 4 counts',
      'Exhale through mouth for 4 counts',
      'Hold empty lungs for 4 counts',
      'Repeat for 5-10 minutes',
      'Used by Navy SEALs for stress management'
    ]
  },
  {
    name: 'Rapid Cycling Breath',
    benefits: [
      'Quickly energizes the brain',
      'Increases alertness and beta activity',
      'Breaks mental fatigue',
      'Improves cognitive performance'
    ],
    steps: [
      'Stand or sit with good posture',
      'Breathe in and out rapidly through nose',
      'Keep breaths shallow and quick',
      'Maintain rhythm for 30 seconds',
      'Rest for 30 seconds with normal breathing',
      'Repeat 3-5 times',
      'Best used when feeling sluggish or unfocused'
    ]
  }
];

/**
 * Generate the appendix section
 */
function generateAppendix(doc) {
  let yPos = startNewSection(doc, 'Appendix');

  // Page title
  doc.fontSize(FONTS.heading1)
     .fillColor(COLORS.primaryDark)
     .font(FONTS.bold)
     .text('Appendix: Breathing Techniques', LAYOUT.margin.left, yPos);

  yPos += 40;

  // Introduction
  const intro = 'Breathing exercises are powerful tools for regulating brain activity and improving mental health. Each technique targets specific brain wave patterns and can help optimize your cognitive function, emotional regulation, and stress management. Practice these techniques regularly for best results.';

  doc.fontSize(FONTS.body)
     .fillColor(COLORS.darkGray)
     .font(FONTS.regular)
     .text(intro, LAYOUT.margin.left, yPos, {
       width: LAYOUT.contentWidth,
       align: 'justify',
       lineGap: 4
     });

  yPos += 80;

  // Generate pages for each technique
  BREATHING_TECHNIQUES.forEach((technique, index) => {
    if (index > 0) {
      yPos = startNewSection(doc, 'Breathing Techniques');
    }

    yPos = drawBreathingTechnique(doc, technique, yPos);
  });

  // Final note
  yPos = startNewSection(doc, 'Breathing Techniques');

  doc.fontSize(FONTS.heading3)
     .fillColor(COLORS.primary)
     .font(FONTS.bold)
     .text('Getting Started', LAYOUT.margin.left, yPos);

  yPos += 25;

  const finalNote = 'Choose 2-3 techniques that resonate with your brain type and current needs. Start with 5 minutes daily and gradually increase duration. Consistency is more important than duration. Track your progress and notice how different techniques affect your mental state and cognitive performance.';

  doc.fontSize(FONTS.body)
     .fillColor(COLORS.darkGray)
     .font(FONTS.regular)
     .text(finalNote, LAYOUT.margin.left, yPos, {
       width: LAYOUT.contentWidth,
       align: 'justify',
       lineGap: 4
     });

  yPos += 70;

  // Safety note
  doc.fontSize(FONTS.small)
     .fillColor(COLORS.danger)
     .font(FONTS.bold)
     .text('Safety Note:', LAYOUT.margin.left, yPos);

  yPos += 20;

  const safetyNote = 'If you experience dizziness, discomfort, or unusual sensations during any breathing exercise, stop immediately and return to normal breathing. Consult a healthcare professional if symptoms persist. Some techniques may not be suitable for individuals with certain medical conditions.';

  doc.fontSize(FONTS.small)
     .fillColor(COLORS.gray)
     .font(FONTS.regular)
     .text(safetyNote, LAYOUT.margin.left, yPos, {
       width: LAYOUT.contentWidth,
       align: 'justify',
       lineGap: 3
     });

  // Footer
  addPageFooter(doc);
}

/**
 * Draw a breathing technique guide
 */
function drawBreathingTechnique(doc, technique, yPos) {
  // Technique name
  doc.fontSize(FONTS.heading2)
     .fillColor(COLORS.primary)
     .font(FONTS.bold)
     .text(technique.name, LAYOUT.margin.left, yPos);

  yPos += 35;

  // Benefits section
  doc.fontSize(FONTS.heading3)
     .fillColor(COLORS.primaryDark)
     .font(FONTS.bold)
     .text('Evidence-Based Benefits:', LAYOUT.margin.left, yPos);

  yPos += 22;

  technique.benefits.forEach(benefit => {
    doc.fontSize(FONTS.small)
       .fillColor(COLORS.success)
       .font(FONTS.regular)
       .text('✓', LAYOUT.margin.left + 10, yPos);

    doc.fontSize(FONTS.small)
       .fillColor(COLORS.darkGray)
       .font(FONTS.regular)
       .text(benefit, LAYOUT.margin.left + 25, yPos, {
         width: LAYOUT.contentWidth - 25,
         lineGap: 2
       });

    yPos += 20;
  });

  yPos += 15;

  // Practice instructions
  doc.fontSize(FONTS.heading3)
     .fillColor(COLORS.primaryDark)
     .font(FONTS.bold)
     .text('How to Practice:', LAYOUT.margin.left, yPos);

  yPos += 22;

  technique.steps.forEach((step, index) => {
    // Step number
    const stepNum = `${index + 1}.`;

    doc.fontSize(FONTS.body)
       .fillColor(COLORS.primary)
       .font(FONTS.bold)
       .text(stepNum, LAYOUT.margin.left + 10, yPos, { width: 20 });

    doc.fontSize(FONTS.body)
       .fillColor(COLORS.darkGray)
       .font(FONTS.regular)
       .text(step, LAYOUT.margin.left + 35, yPos, {
         width: LAYOUT.contentWidth - 35,
         lineGap: 3
       });

    yPos += 25;
  });

  return yPos + 30;
}

module.exports = { generateAppendix };
