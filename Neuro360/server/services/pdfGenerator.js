/**
 * NeuroSense PDF Report Generator
 * Generates comprehensive QEEG intelligence reports in PDF format
 * Based on the NeuroSense Report template
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Import PDF section generators
const { generateCoverPage } = require('./pdf/coverPage');
const { generateIntroduction } = require('./pdf/introduction');
const { generateBrainWavesProfile } = require('./pdf/brainWavesProfile');
const { generateNumbersAtGlance } = require('./pdf/numbersAtGlance');
const { generateMetricsPages } = require('./pdf/metricsPages');
const { BrainTypeClassifier } = require('./pdf/brainTypeClassifier');
const { generateBrainTypePage } = require('./pdf/brainTypePage');
const { generateAppendix } = require('./pdf/appendix');
const { COLORS, FONTS } = require('./pdf/pdfStyles');

class PDFReportGenerator {
  constructor(patientData, algorithmResults, qeegData) {
    this.patientData = patientData;
    this.algorithmResults = algorithmResults;
    this.qeegData = qeegData;
    this.brainType = null;
  }

  /**
   * Generate complete PDF report
   * @param {string} outputPath - Path to save the generated PDF
   * @returns {Promise<string>} Path to generated PDF
   */
  async generateReport(outputPath) {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: 50,
            bottom: 50,
            left: 50,
            right: 50
          },
          bufferPages: true,
          autoFirstPage: false
        });

        // Create write stream
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Classify brain type first (needed for recommendations)
        const classifier = new BrainTypeClassifier(this.algorithmResults);
        this.brainType = classifier.classify();

        console.log('🎨 Generating PDF report...');
        console.log(`📊 Brain Type: ${this.brainType.type} - ${this.brainType.name}`);

        // Generate all sections
        this.generateAllSections(doc);

        // Add page numbers to all pages
        this.addPageNumbers(doc);

        // Finalize PDF
        doc.end();

        // Handle completion
        stream.on('finish', () => {
          console.log('✅ PDF report generated successfully:', outputPath);
          resolve(outputPath);
        });

        stream.on('error', (error) => {
          console.error('❌ Error writing PDF:', error);
          reject(error);
        });

      } catch (error) {
        console.error('❌ Error generating PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate all sections of the report
   */
  generateAllSections(doc) {
    // 1. Cover Page
    console.log('  📄 Generating cover page...');
    generateCoverPage(doc, this.patientData);

    // 2. Numbers at a Glance (All Results on One Page)
    console.log('  📊 Generating results summary...');
    generateNumbersAtGlance(doc, this.qeegData, this.algorithmResults);

    // 3. Brain Type Classification & Recommendations
    console.log('  🧠 Generating brain type and recommendations...');
    generateBrainTypePage(doc, this.brainType);
  }

  /**
   * Add page numbers and footer to all pages
   */
  addPageNumbers(doc) {
    const pageCount = doc.bufferedPageRange().count;
    console.log(`  📑 Adding page numbers and footer to ${pageCount} pages...`);

    // Generate report timestamp
    const reportDate = new Date();
    const dateTimeStr = reportDate.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    // Get patient ID
    const patientId = this.patientData.id || this.patientData.patientId || this.patientData.uid || 'N/A';

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      const pageNum = i + 1;
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Save current state
      doc.save();

      // Cover page (first page) has dark background, use white text
      // Other pages use dark gray text
      const textColor = (i === 0) ? '#FFFFFF' : '#666666';
      const disclaimerColor = (i === 0) ? '#CCCCCC' : '#888888';

      // Footer Line 1: Report generated info
      doc.fontSize(7)
         .fillColor(textColor)
         .font(FONTS.regular)
         .text(
           `Report generated on: ${dateTimeStr} | Patient ID: ${patientId}`,
           0,
           pageHeight - 45,
           {
             width: pageWidth,
             align: 'center'
           }
         );

      // Footer Line 2: Disclaimer
      doc.fontSize(6)
         .fillColor(disclaimerColor)
         .font(FONTS.regular)
         .text(
           'This AI-generated report is not diagnostic. Please consult your doctor for proper interpretation and clinical correlation.',
           0,
           pageHeight - 32,
           {
             width: pageWidth,
             align: 'center'
           }
         );

      // Footer Line 3: Page number
      doc.fontSize(8)
         .fillColor(textColor)
         .font(FONTS.regular)
         .text(
           `Page ${pageNum} of ${pageCount}`,
           0,
           pageHeight - 18,
           {
             width: pageWidth,
             align: 'center'
           }
         );

      // Restore state
      doc.restore();
    }
  }

  /**
   * Generate sample report for testing
   */
  static async generateSampleReport() {
    // Sample patient data
    const samplePatient = {
      name: 'John Doe',
      dateOfRecording: new Date().toISOString().split('T')[0],
      age: 35,
      gender: 'Male',
      handedness: 'Right',
      symptoms: ['ADHD', 'Anxiety', 'Insomnia']
    };

    // Sample algorithm results (mock data)
    const sampleResults = {
      parameters: [
        {
          name: 'Cognition',
          score: 2,
          maxScore: 3,
          classification: 'Medium',
          metrics: [
            { name: 'Focus Score (Theta:Beta)', value: 1.2, score: 1, description: 'Theta:Beta Ratio = 1.20 (< 1.5 is normal)' },
            { name: 'Alpha Peak', value: 10.3, score: 1, description: 'Alpha Peak = 10.3 Hz (> 9 is normal)' },
            { name: 'Alpha:Theta Balance', value: { fz: 1.5, cz: 1.8, pz: 2.1 }, score: 0, description: 'Alpha:Theta Order = Abnormal order' }
          ]
        },
        {
          name: 'Stress',
          score: 1,
          maxScore: 3,
          classification: 'Low',
          metrics: [
            { name: 'Arousal Score', value: 0.8, score: 1, description: 'Arousal Score = 0.80 (< 1 is normal)' },
            { name: 'Relaxation Score', value: 8.5, score: 0, description: 'Relaxation Score = 8.50 (> 8 is healthy)' },
            { name: 'Regeneration (Alpha Modulation)', value: 35.2, score: 1, description: 'Alpha Modulation = 35.2% (> 30% is healthy)' }
          ]
        },
        {
          name: 'Focus & Attention',
          score: 2,
          maxScore: 3,
          classification: 'Medium',
          metrics: [
            { name: 'Focus Theta', value: 18.2, score: 1, description: 'Focus Theta = 18.2% (< 20% is normal)' },
            { name: 'Alpha:Theta Balance', value: { fz: 1.5, cz: 1.8, pz: 2.1 }, score: 1, description: 'Alpha:Theta Order = Normal' },
            { name: 'Focus Score (Theta:Beta)', value: 1.2, score: 0, description: 'Theta:Beta Ratio = 1.20 (< 1.5 is normal)' }
          ]
        },
        {
          name: 'Burnout & Fatigue',
          score: 1,
          maxScore: 3,
          classification: 'Low',
          metrics: [
            { name: 'Arousal Score', value: 0.8, score: 1, description: 'Arousal Score = 0.80 (< 1 is normal)' },
            { name: 'Relaxation Score', value: 8.5, score: 0, description: 'Relaxation Score = 8.50 (> 8 is healthy)' },
            { name: 'Excessive Delta', value: 65.0, score: 1, description: 'Excessive Delta = 65.0% (< 70% is normal)' }
          ]
        },
        {
          name: 'Emotional Regulation',
          score: 2,
          maxScore: 3,
          classification: 'Medium',
          metrics: [
            { name: 'Alpha Asymmetry (Frontal)', value: 0.95, score: 1, description: 'Alpha Asymmetry = 0.95 (< 1 is normal)' },
            { name: 'Arousal Score', value: 0.8, score: 1, description: 'Arousal Score = 0.80 (< 1 is normal)' },
            { name: 'Regeneration (Alpha Modulation)', value: 35.2, score: 0, description: 'Alpha Modulation = 35.2% (> 30% is healthy)' }
          ]
        },
        {
          name: 'Learning',
          score: 2,
          maxScore: 3,
          classification: 'Medium',
          metrics: [
            { name: 'Alpha Peak', value: 10.3, score: 1, description: 'Alpha Peak = 10.3 Hz (> 9 is normal)' },
            { name: 'Focus Score (Theta:Beta)', value: 1.2, score: 1, description: 'Theta:Beta Ratio = 1.20 (< 1.5 is normal)' },
            { name: 'Arousal Score', value: 0.8, score: 0, description: 'Arousal Score = 0.80 (< 1 is normal)' }
          ]
        },
        {
          name: 'Creativity',
          score: 2,
          maxScore: 3,
          classification: 'Medium',
          metrics: [
            { name: 'Relaxation Score', value: 8.5, score: 0, description: 'Relaxation Score = 8.50 (> 8 is healthy)' },
            { name: 'Focus Score (Theta:Beta)', value: 1.2, score: 1, description: 'Theta:Beta Ratio = 1.20 (< 1.5 is normal)' },
            { name: 'Alpha Peak', value: 10.3, score: 1, description: 'Alpha Peak = 10.3 Hz (> 9 is normal)' }
          ]
        }
      ],
      overallScore: 14
    };

    // Sample QEEG data
    const sampleQEEG = {
      EC: {
        absolute: {
          Fz: { Delta: 5.2, Theta: 4.1, Alpha: 8.3, Beta: 6.2, HiBeta: 3.1 },
          Cz: { Delta: 4.8, Theta: 3.9, Alpha: 9.1, Beta: 6.5, HiBeta: 3.3 },
          Pz: { Delta: 4.5, Theta: 3.5, Alpha: 10.2, Beta: 5.8, HiBeta: 2.9 }
        },
        relative: {
          Pz: { Alpha: 45.2 }
        },
        special: {
          alphaPeak: 10.3,
          O1: 10.1
        }
      },
      EO: {
        absolute: {
          Fz: { Theta: 3.8, Beta: 3.2, HiBeta: 2.5 },
          Cz: { Theta: 3.6, Beta: 3.0, HiBeta: 2.4 }
        },
        relative: {
          Pz: { Alpha: 28.7 },
          Fz: { Theta: 18.5 },
          Cz: { Theta: 17.8 }
        }
      }
    };

    const generator = new PDFReportGenerator(samplePatient, sampleResults, sampleQEEG);
    const outputPath = path.join(__dirname, '../uploads/sample-neurosense-report.pdf');

    await generator.generateReport(outputPath);
    return outputPath;
  }
}

module.exports = PDFReportGenerator;
