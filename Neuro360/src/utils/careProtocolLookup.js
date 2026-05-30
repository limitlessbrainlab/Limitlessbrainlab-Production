import KSB_27_COMBINATIONS from './ksb27Combinations';

// P1 = Cognition composite from Cognition + Focus & Attention (Sheet1 matrix)
const P1_MATRIX = {
  'L-L': 'L', 'L-M': 'L', 'L-H': 'M',
  'M-L': 'L', 'M-M': 'M', 'M-H': 'H',
  'H-L': 'M', 'H-M': 'H', 'H-H': 'H',
};

// P2 = Stress & Burnout composite from Stress + Burnout & Fatigue (Sheet1 matrix)
const P2_MATRIX = {
  'L-L': 'L', 'L-M': 'L', 'L-H': 'M',
  'M-L': 'L', 'M-M': 'M', 'M-H': 'H',
  'H-L': 'H', 'H-M': 'H', 'H-H': 'H',
};

// Map algorithm classification string to L/M/H
const normalizeLevel = (classification) => {
  if (!classification) return null;
  const c = classification.toLowerCase().trim();
  if (c === 'low' || c === 'mild') return 'L';
  if (c === 'medium' || c === 'moderate') return 'M';
  if (c === 'high' || c === 'severe') return 'H';
  return null;
};

// Fallback: derive level from rawScore ('score/max' format, score is 0-3)
const levelFromRawScore = (rawScore) => {
  if (!rawScore) return null;
  const score = parseInt(rawScore.split('/')[0], 10);
  if (isNaN(score)) return null;
  if (score <= 1) return 'L';
  if (score === 2) return 'M';
  return 'H';
};

const findParam = (data, names) =>
  data.find((item) => {
    if (!item?.parameter) return false;
    const p = item.parameter.toLowerCase();
    return names.some((n) => p.includes(n.toLowerCase()));
  });

// Returns the matching KSB care protocol for the patient, or null if data is insufficient
const getCareProtocol = (algorithmResultsData) => {
  if (!Array.isArray(algorithmResultsData) || algorithmResultsData.length === 0) return null;

  const level = (item) => normalizeLevel(item?.classification) || levelFromRawScore(item?.rawScore);

  const cog = level(findParam(algorithmResultsData, ['cognition']));
  const focus = level(findParam(algorithmResultsData, ['focus & attention', 'focus and attention', 'focus']));
  const stress = level(findParam(algorithmResultsData, ['stress']));
  const burnout = level(findParam(algorithmResultsData, ['burnout & fatigue', 'burnout and fatigue', 'burnout']));
  const er = level(findParam(algorithmResultsData, ['emotional regulation']));

  if (!cog || !focus || !stress || !burnout || !er) return null;

  const p1 = P1_MATRIX[`${cog}-${focus}`];
  const p2 = P2_MATRIX[`${stress}-${burnout}`];
  const p3 = er;

  if (!p1 || !p2 || !p3) return null;

  const combo = KSB_27_COMBINATIONS[`${p1}-${p2}-${p3}`];
  if (!combo) return null;

  return { ...combo, p1, p2, p3 };
};

export { getCareProtocol };
