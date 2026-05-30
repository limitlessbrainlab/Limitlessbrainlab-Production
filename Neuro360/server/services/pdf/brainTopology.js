/**
 * Brain Topology Heat Map Generator
 * Generates simplified brain topology visualizations for EEG data
 * Note: This is a simplified text-based representation
 * For production, consider using canvas-based heat map generation
 */

const { COLORS, FONTS, LAYOUT, drawRoundedRect } = require('./pdfStyles');

/**
 * Generate brain topology heat maps
 * This is a simplified version - production version would use canvas for actual heat maps
 */
function generateBrainTopologyMaps(doc, qeegData, x, yPos) {
  const mapSize = 120;
  const spacing = 20;
  const bandsToDisplay = ['Delta', 'Theta', 'Alpha', 'Beta', 'HiBeta'];

  // Title
  doc.fontSize(FONTS.small)
     .fillColor(COLORS.gray)
     .font(FONTS.bold)
     .text('Brain Activity Distribution', x, yPos, {
       width: LAYOUT.contentWidth,
       align: 'center'
     });

  yPos += 25;

  // Calculate layout
  const totalWidth = (mapSize * bandsToDisplay.length) + (spacing * (bandsToDisplay.length - 1));
  const startX = x + (LAYOUT.contentWidth - totalWidth) / 2;

  let currentX = startX;

  bandsToDisplay.forEach((band, index) => {
    // Draw simplified topology map
    drawSimplifiedTopologyMap(doc, band, qeegData, currentX, yPos, mapSize);
    currentX += mapSize + spacing;
  });

  return yPos + mapSize + 40;
}

/**
 * Draw a simplified topology map (circular representation)
 */
function drawSimplifiedTopologyMap(doc, band, qeegData, x, y, size) {
  // Band label
  doc.fontSize(FONTS.tiny)
     .fillColor(COLORS.gray)
     .font(FONTS.bold)
     .text(band, x, y - 12, { width: size, align: 'center' });

  // Circle background
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size / 2;

  // Get average power for this band (simplified)
  const power = getAveragePower(qeegData, band);
  const intensity = normalizeIntensity(power);

  // Color based on intensity
  const color = getIntensityColor(intensity);

  // Draw circle
  doc.save();
  doc.circle(centerX, centerY, radius)
     .fillColor(color, 0.6)
     .fill()
     .circle(centerX, centerY, radius)
     .strokeColor(COLORS.gray)
     .lineWidth(1)
     .stroke();
  doc.restore();

  // Add simplified electrode markers (frontal, central, parietal, occipital)
  drawElectrodeMarkers(doc, centerX, centerY, radius);

  // Power value
  doc.fontSize(FONTS.tiny)
     .fillColor(COLORS.darkGray)
     .font(FONTS.bold)
     .text(`${power.toFixed(1)}`, x, y + size + 5, { width: size, align: 'center' });

  doc.fontSize(FONTS.tiny - 1)
     .fillColor(COLORS.gray)
     .font(FONTS.regular)
     .text('μV²', x, y + size + 15, { width: size, align: 'center' });
}

/**
 * Draw simplified electrode position markers
 */
function drawElectrodeMarkers(doc, centerX, centerY, radius) {
  const markerRadius = 3;
  const positions = [
    { x: 0, y: -radius * 0.7 },      // Frontal
    { x: -radius * 0.5, y: 0 },       // Left Central
    { x: radius * 0.5, y: 0 },        // Right Central
    { x: 0, y: radius * 0.7 }         // Occipital
  ];

  doc.save();
  positions.forEach(pos => {
    doc.circle(centerX + pos.x, centerY + pos.y, markerRadius)
       .fillColor(COLORS.white, 0.8)
       .fill()
       .circle(centerX + pos.x, centerY + pos.y, markerRadius)
       .strokeColor(COLORS.darkGray, 0.5)
       .lineWidth(0.5)
       .stroke();
  });
  doc.restore();
}

/**
 * Get average power for a frequency band across all channels
 */
function getAveragePower(qeegData, band) {
  try {
    const channels = ['Fz', 'Cz', 'Pz', 'C3', 'C4', 'O1', 'O2'];
    let total = 0;
    let count = 0;

    // Try Eyes Closed first
    if (qeegData.EC && qeegData.EC.absolute) {
      channels.forEach(channel => {
        if (qeegData.EC.absolute[channel] && qeegData.EC.absolute[channel][band] !== undefined) {
          total += qeegData.EC.absolute[channel][band];
          count++;
        }
      });
    }

    // Fallback to Eyes Open if EC not available
    if (count === 0 && qeegData.EO && qeegData.EO.absolute) {
      channels.forEach(channel => {
        if (qeegData.EO.absolute[channel] && qeegData.EO.absolute[channel][band] !== undefined) {
          total += qeegData.EO.absolute[channel][band];
          count++;
        }
      });
    }

    return count > 0 ? total / count : 5.0; // Default value if no data
  } catch (error) {
    console.error('Error calculating average power:', error);
    return 5.0;
  }
}

/**
 * Normalize intensity to 0-1 range
 */
function normalizeIntensity(power) {
  // Typical range for absolute power is 0-20 μV²
  const normalized = Math.min(Math.max(power / 20, 0), 1);
  return normalized;
}

/**
 * Get color based on intensity (heat map colors)
 */
function getIntensityColor(intensity) {
  // Blue (low) -> Green (medium) -> Yellow -> Red (high)
  if (intensity < 0.25) {
    return interpolateColor(COLORS.gradient.low, '#00FFFF', intensity * 4);
  } else if (intensity < 0.5) {
    return interpolateColor('#00FFFF', COLORS.gradient.mid, (intensity - 0.25) * 4);
  } else if (intensity < 0.75) {
    return interpolateColor(COLORS.gradient.mid, '#FFFF00', (intensity - 0.5) * 4);
  } else {
    return interpolateColor('#FFFF00', COLORS.gradient.high, (intensity - 0.75) * 4);
  }
}

/**
 * Helper function to interpolate between two hex colors
 */
function interpolateColor(color1, color2, factor) {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

module.exports = { generateBrainTopologyMaps };
