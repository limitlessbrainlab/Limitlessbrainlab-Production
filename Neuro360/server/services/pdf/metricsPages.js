/**
 * Individual Metrics Pages Generator
 * Generates detailed pages for each of the 8 key QEEG metrics
 */

const { COLORS, FONTS, LAYOUT, startNewSection, addPageFooter, drawProgressBar, drawRoundedRect } = require('./pdfStyles');

/**
 * Generate all individual metric pages
 */
function generateMetricsPages(doc, algorithmResults, qeegData) {
  // Define the 8 key metrics based on the NeuroSense report
  const metricsToDisplay = [
    {
      title: 'Frontal Alpha Asymmetry',
      description: 'Measures the balance of alpha activity between left and right frontal regions. Imbalances can indicate emotional regulation patterns.',
      parameter: 'Emotional Regulation',
      metric: 'Alpha Asymmetry (Frontal)',
      interpretation: {
        normal: 'Balanced hemispheric activity suggests healthy emotional regulation.',
        concern: 'Asymmetry may indicate emotional processing differences.'
      }
    },
    {
      title: 'Total Brain Coherence',
      description: 'Measures how well different brain regions communicate and synchronize. Higher coherence indicates better brain network integration.',
      parameter: 'Cognition',
      metric: 'Alpha:Theta Balance',
      interpretation: {
        normal: 'Good coherence supports cognitive function and information processing.',
        concern: 'Low coherence may affect cognitive efficiency.'
      }
    },
    {
      title: 'Alpha Peak Frequency',
      description: 'The dominant alpha frequency indicates brain processing speed and cognitive efficiency. Higher is generally better.',
      parameter: 'Cognition',
      metric: 'Alpha Peak',
      interpretation: {
        normal: 'Optimal alpha peak supports good cognitive function and relaxation ability.',
        concern: 'Lower alpha peak may indicate slowed processing or fatigue.'
      }
    },
    {
      title: 'Posterior Dominant Rhythm (PDR)',
      description: 'The predominant rhythm in the back of the brain during rest. PDR should match age-appropriate norms.',
      parameter: 'Cognition',
      metric: 'Alpha Peak',
      interpretation: {
        normal: 'Age-appropriate PDR indicates healthy brain maturation.',
        concern: 'Slowed PDR may suggest developmental or degenerative changes.'
      }
    },
    {
      title: 'Focus & Attention Score',
      description: 'Based on theta/beta ratio. Lower ratios indicate better attention regulation and focus capability.',
      parameter: 'Focus & Attention',
      metric: 'Focus Score (Theta:Beta)',
      interpretation: {
        normal: 'Optimal ratio supports sustained attention and focus.',
        concern: 'Elevated ratio may indicate attention regulation challenges.'
      }
    },
    {
      title: 'Arousal Score',
      description: 'Measures high beta relative to beta activity. Indicates stress, anxiety, or hyperarousal levels.',
      parameter: 'Stress',
      metric: 'Arousal Score',
      interpretation: {
        normal: 'Normal arousal supports alertness without excessive stress.',
        concern: 'High arousal may indicate stress, anxiety, or hypervigilance.'
      }
    },
    {
      title: 'Relaxation Score',
      description: 'Alpha/beta ratio measuring ability to relax and disengage from active processing.',
      parameter: 'Stress',
      metric: 'Relaxation Score',
      interpretation: {
        normal: 'Good relaxation capacity supports stress recovery and restoration.',
        concern: 'Low relaxation score may indicate difficulty disengaging or resting.'
      }
    },
    {
      title: 'Peak Performance Ratio',
      description: 'Gamma/alpha ratio indicating cognitive processing capacity and mental performance.',
      parameter: 'Creativity',
      metric: 'Alpha Peak',
      interpretation: {
        normal: 'Optimal ratio supports peak cognitive performance and creativity.',
        concern: 'Imbalanced ratio may affect peak performance capacity.'
      }
    }
  ];

  metricsToDisplay.forEach(metric => {
    generateMetricPage(doc, metric, algorithmResults, qeegData);
  });
}

/**
 * Generate a single metric page
 */
function generateMetricPage(doc, metricInfo, algorithmResults, qeegData) {
  let yPos = startNewSection(doc, metricInfo.title);

  // Title
  doc.fontSize(FONTS.heading1)
     .fillColor(COLORS.primaryDark)
     .font(FONTS.bold)
     .text(metricInfo.title, LAYOUT.margin.left, yPos);

  yPos += 50;

  // Description
  doc.fontSize(FONTS.body)
     .fillColor(COLORS.darkGray)
     .font(FONTS.regular)
     .text(metricInfo.description, LAYOUT.margin.left, yPos, {
       width: LAYOUT.contentWidth,
       align: 'justify',
       lineGap: 4
     });

  yPos += 70;

  // Find the relevant parameter and metric from algorithm results
  const parameterData = algorithmResults.parameters.find(p => p.name === metricInfo.parameter);
  const metricData = parameterData?.metrics.find(m => m.name === metricInfo.metric);

  if (parameterData && metricData) {
    // Score visualization
    yPos = drawScoreCard(doc, metricData, LAYOUT.margin.left, yPos);

    yPos += 40;

    // Interpretation
    doc.fontSize(FONTS.heading3)
       .fillColor(COLORS.primary)
       .font(FONTS.bold)
       .text('Interpretation', LAYOUT.margin.left, yPos);

    yPos += 25;

    const interpretation = metricData.score === 1
      ? metricInfo.interpretation.normal
      : metricInfo.interpretation.concern;

    doc.fontSize(FONTS.body)
       .fillColor(COLORS.darkGray)
       .font(FONTS.regular)
       .text(interpretation, LAYOUT.margin.left, yPos, {
         width: LAYOUT.contentWidth,
         align: 'justify',
         lineGap: 4
       });

    yPos += 60;

    // Technical details
    doc.fontSize(FONTS.heading3)
       .fillColor(COLORS.primary)
       .font(FONTS.bold)
       .text('Technical Details', LAYOUT.margin.left, yPos);

    yPos += 25;

    doc.fontSize(FONTS.small)
       .fillColor(COLORS.gray)
       .font(FONTS.regular)
       .text(metricData.description || 'No additional details available.', LAYOUT.margin.left, yPos, {
         width: LAYOUT.contentWidth,
         lineGap: 3
       });

  } else {
    // No data available
    doc.fontSize(FONTS.body)
       .fillColor(COLORS.gray)
       .font(FONTS.italic)
       .text('Detailed analysis for this metric is not available in the current dataset.',
             LAYOUT.margin.left, yPos);
  }

  // Footer
  addPageFooter(doc);
}

/**
 * Draw a score card with visual representation
 */
function drawScoreCard(doc, metricData, x, yPos) {
  const cardWidth = LAYOUT.contentWidth;
  const cardHeight = 120;

  // Background
  drawRoundedRect(doc, x, yPos, cardWidth, cardHeight, 10, COLORS.veryLightGray);

  let contentY = yPos + 20;

  // Metric value
  doc.fontSize(FONTS.heading2)
     .fillColor(COLORS.primaryDark)
     .font(FONTS.bold)
     .text('Your Result', x + 30, contentY);

  contentY += 35;

  // Value display
  const valueText = typeof metricData.value === 'object'
    ? JSON.stringify(metricData.value)
    : `${metricData.value}`;

  doc.fontSize(28)
     .fillColor(COLORS.primary)
     .font(FONTS.bold)
     .text(valueText, x + 30, contentY);

  // Score indicator on the right
  const scoreX = x + cardWidth - 150;
  const scoreY = yPos + 30;

  doc.fontSize(FONTS.small)
     .fillColor(COLORS.gray)
     .font(FONTS.regular)
     .text('Score', scoreX, scoreY);

  // Score badge
  const badgeSize = 50;
  const badgeX = scoreX + 60;
  const badgeY = scoreY - 5;

  const scoreColor = metricData.score === 1 ? COLORS.success : COLORS.warning;

  doc.save();
  doc.circle(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2)
     .fillColor(scoreColor, 0.2)
     .fill()
     .circle(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2)
     .strokeColor(scoreColor)
     .lineWidth(3)
     .stroke();

  doc.fontSize(24)
     .fillColor(scoreColor)
     .font(FONTS.bold)
     .text(`${metricData.score}`, badgeX, badgeY + 12, { width: badgeSize, align: 'center' });

  doc.fontSize(FONTS.tiny)
     .fillColor(COLORS.gray)
     .text('/ 1', badgeX + badgeSize - 15, badgeY + 35);

  doc.restore();

  return yPos + cardHeight;
}

module.exports = { generateMetricsPages };
