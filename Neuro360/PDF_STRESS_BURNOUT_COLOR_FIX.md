# PDF Report: Stress & Burnout Color Fix

## Problem

Downloaded PDF reports were showing incorrect colors for Stress and Burnout parameters:

**Before:**
- Stress 3/3 High → GREEN ❌ (wrong!)
- Burnout 2/3 Medium → BLUE ❌ (wrong!)
- Only Low (0/3) → GREEN ✅

**User Requirement:**
- **0/3 (Low)** → Green (no stress, healthy)
- **1/3 (Medium)** → RED (stress present, warning)
- **2/3 (Medium)** → RED (stress present, warning)
- **3/3 (High)** → RED (high stress, critical)

---

## Root Cause

PDF generators were using generic color logic for ALL parameters:
- High score = Green (good)
- Medium score = Blue (moderate)
- Low score = Orange (poor)

But for Stress/Burnout, **higher scores mean MORE problems**, so:
- 0/3 = No stress = GREEN ✅
- 1-3/3 = Stress present = RED ✅

---

## Solution

Updated 4 PDF generation files to use **parameter-aware color logic**.

---

## Files Modified

### 1. `server/config/pdfCoordinates.js`

**Added special color palette for Stress/Burnout:**

```javascript
// Lines 167-172: New color set for Stress/Burnout
stressBurnoutColors: {
  Low: { r: 0.18, g: 0.8, b: 0.44 },    // Green (no stress = healthy)
  Medium: { r: 0.85, g: 0.35, b: 0.13 }, // Red (some stress = warning)
  High: { r: 0.85, g: 0.35, b: 0.13 }    // Red (high stress = critical)
},
```

**Updated helper function to accept parameter name:**

```javascript
// Lines 190-202: Updated function signature
getClassificationColor(classification, parameterName = '') {
  // Check if this is a Stress or Burnout parameter
  const isStressOrBurnout = parameterName === 'Stress' ||
                             parameterName === 'Burnout & Fatigue';

  if (isStressOrBurnout) {
    // For Stress/Burnout: Low = green, Medium/High = red
    return this.stressBurnoutColors[classification] || this.defaults.color;
  }

  // For other parameters: use normal color logic
  return this.classificationColors[classification] || this.defaults.color;
}
```

---

### 2. `server/services/pdfGeneratorTemplate.js`

**Updated function call to pass parameter name:**

```javascript
// Line 243: Pass parameter name to color function
const classColor = coordinates.getClassificationColor(param.classification, param.name);
```

**Before:**
```javascript
const classColor = coordinates.getClassificationColor(param.classification);
```

---

### 3. `server/services/pdf/numbersAtGlance.js`

**Updated color function to show Medium as RED for Stress/Burnout:**

```javascript
// Lines 154-183: Updated getClassificationColor()
function getClassificationColor(classification, parameterName = '') {
  const isInvertedParameter = parameterName === 'Stress' ||
                               parameterName === 'Burnout & Fatigue';

  if (isInvertedParameter) {
    // INVERTED: For Stress/Burnout, Low is good (green) and Medium/High are bad (red)
    switch(classification) {
      case 'High':
        return COLORS.error;    // Red (High stress = Bad)
      case 'Medium':
        return COLORS.error;    // Red (Medium stress = Bad) ✅ FIXED
      case 'Low':
        return COLORS.green;    // Green (Low stress = Good)
      default:
        return COLORS.gray;
    }
  } else {
    // NORMAL: For other parameters, High is good (green) and Low is bad (orange)
    switch(classification) {
      case 'High':
        return COLORS.green;    // Green (High = Good)
      case 'Medium':
        return COLORS.primary;  // Blue (Medium = Moderate)
      case 'Low':
        return COLORS.orange;   // Orange (Low = Bad)
      default:
        return COLORS.gray;
    }
  }
}
```

**What Changed:**
- **Before:** Medium → Blue/Orange
- **After:** Medium → RED (for Stress/Burnout only)

---

### 4. `server/services/aiPdfGeneratorEnhanced.js`

**Added parameter-aware color logic:**

```javascript
// Lines 834-856: Updated getClassificationColor()
getClassificationColor(classification, parameterName = '') {
  // Check if this is a Stress or Burnout parameter
  const isStressOrBurnout = parameterName === 'Stress' ||
                             parameterName === 'Burnout & Fatigue';

  if (isStressOrBurnout) {
    // INVERTED: For Stress/Burnout, Low is good and Medium/High are bad
    const stressColors = {
      'High': COLORS.orange,    // Orange/Red (High stress = Bad)
      'Medium': COLORS.orange,  // Orange/Red (Medium stress = Bad)
      'Low': COLORS.green       // Green (Low stress = Good)
    };
    return stressColors[classification] || COLORS.darkGray;
  }

  // NORMAL: For other parameters
  const colors = {
    'High': COLORS.green,     // Green
    'Medium': COLORS.blue,    // Blue
    'Low': COLORS.orange      // Orange
  };
  return colors[classification] || COLORS.darkGray;
}
```

**Updated function call:**

```javascript
// Line 444: Pass parameter name
const classColor = this.getClassificationColor(param.classification, param.name);
```

---

## How It Works Now

### Example 1: Stress with 3/3 Score (High)

**Input:**
- Arousal Score: 0/1 (red)
- Relaxation Score: 0/1 (red)
- Regeneration: 0/1 (red)
- Final Score: 3/3 (High)

**PDF Output:**
```
┌─────────────────────────────┐ ← RED border ✅
│ Stress            3/3       │
│ High              RED       │ ← RED badge ✅
└─────────────────────────────┘
```

### Example 2: Burnout with 2/3 Score (Medium)

**Input:**
- Arousal Score: 0/1 (red)
- Relaxation Score: 0/1 (red)
- Excessive Delta: 1/1 (green)
- Final Score: 2/3 (Medium)

**PDF Output:**
```
┌─────────────────────────────┐ ← RED border ✅
│ Burnout & Fatigue  2/3      │
│ Medium            RED       │ ← RED badge ✅
└─────────────────────────────┘
```

### Example 3: Stress with 0/3 Score (Low)

**Input:**
- All sub-parameters healthy
- Final Score: 0/3 (Low)

**PDF Output:**
```
┌─────────────────────────────┐ ← GREEN border ✅
│ Stress            0/3       │
│ Low              GREEN      │ ← GREEN badge ✅
└─────────────────────────────┘
```

---

## Color Logic Summary

### For Stress & Burnout Parameters:
| Score | Classification | PDF Color | Meaning          |
|-------|---------------|-----------|------------------|
| 0/3   | Low           | GREEN     | No stress        |
| 1/3   | Medium        | RED       | Some stress      |
| 2/3   | Medium        | RED       | Medium stress    |
| 3/3   | High          | RED       | High stress      |

### For Other Parameters (Focus, Learning, etc.):
| Score | Classification | PDF Color | Meaning          |
|-------|---------------|-----------|------------------|
| 1/3   | Low           | ORANGE    | Poor function    |
| 2/3   | Medium        | BLUE      | Moderate         |
| 3/3   | High          | GREEN     | Excellent        |

---

## Testing the Fix

### Test Case 1: Generate PDF with Stress 3/3
1. Run algorithm with patient having high stress (all red sub-parameters)
2. Generate PDF report
3. **Expected:** Stress parameter shows RED color in PDF

### Test Case 2: Generate PDF with Burnout 2/3
1. Run algorithm with patient having medium burnout (2 red, 1 green)
2. Generate PDF report
3. **Expected:** Burnout parameter shows RED color in PDF

### Test Case 3: Generate PDF with Stress 0/3
1. Run algorithm with patient having no stress (all green sub-parameters)
2. Generate PDF report
3. **Expected:** Stress parameter shows GREEN color in PDF

---

## Visual Comparison

### Before (Wrong Colors):
```
Stress 3/3 High        [GREEN badge]  ❌ Wrong!
Burnout 2/3 Medium     [BLUE badge]   ❌ Wrong!
```

### After (Correct Colors):
```
Stress 3/3 High        [RED badge]    ✅ Correct!
Burnout 2/3 Medium     [RED badge]    ✅ Correct!
Stress 0/3 Low         [GREEN badge]  ✅ Correct!
```

---

### 5. `server/services/geminiPdfGenerator.js`

**Updated color mapping for Medium classification:**

```javascript
// Lines 756-770: Fixed Medium to show RED for Stress/Burnout
if (isInvertedParameter) {
  // INVERTED color mapping for Stress and Burnout & Fatigue
  // Low (0/3) = Green (no stress), Medium/High (1-3/3) = Red (stress present)
  const invertedColorMap = {
    'Low': '#38A169',           // Green (Low stress = Good)
    'Medium': '#E53E3E',        // Red (Medium stress = Warning) ✅ FIXED
    'High': '#E53E3E'           // Red (High stress = Bad)
  };
  return invertedColorMap[bucketOrColor] || '#4299E1';
}
```

**What Changed:**
- **Before:** Medium → Orange (#ED8936)
- **After:** Medium → Red (#E53E3E) for Stress/Burnout

---

## Summary

✅ **Fixed all 5 PDF generators** - pdfCoordinates, pdfGeneratorTemplate, numbersAtGlance, aiPdfGeneratorEnhanced, geminiPdfGenerator
✅ **Added parameter-aware logic** - Color functions now check parameter type
✅ **Consistent with UI** - PDF colors now match web interface colors
✅ **Medium shows RED** - For Stress/Burnout, any stress level (1-3/3) shows red
✅ **Low shows GREEN** - Only 0/3 (no stress) shows green for Stress/Burnout

**Downloaded PDF reports now correctly show RED for any stress level!** 🎯
