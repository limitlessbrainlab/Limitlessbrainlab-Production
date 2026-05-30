# Stress & Burnout Scoring Logic Fix

## Problem

1. **Wrong Score Display**:
   - Images showed 2 red parameters (0/1) and 1 green parameter (1/1)
   - Display showed: **1/3** (wrong - counting green parameters)
   - Should show: **2/3** (correct - counting red parameters)

2. **Wrong Color for Medium**:
   - "Medium" stress/burnout showed in YELLOW
   - Should show in RED (it's a warning state)

---

## Root Cause

### Issue 1: Scoring Logic
Stress and Burnout are **negative parameters** - higher score means worse condition:
- **Other parameters**: 3/3 = High = Good (green)
- **Stress/Burnout**: 3/3 = High = Bad (red)

But the scoring was counting healthy (green) sub-parameters instead of unhealthy (red) ones.

### Issue 2: Color Mapping
The color logic didn't differentiate between Stress/Burnout and other parameters:
- All parameters used: High = green, Medium = yellow, Low = red
- For Stress/Burnout should be: Low = green, Medium/High = red

---

## Solution

### 1. Inverted Scoring Logic for Stress & Burnout

**File**: `server/services/algorithmCalculator.js`

**Before:**
```javascript
calculateStress() {
  const metric1 = this.calculateArousalScore();  // 0 (unhealthy)
  const metric2 = this.calculateRelaxationScore(); // 0 (unhealthy)
  const metric3 = this.calculateRegeneration();  // 1 (healthy)

  const totalScore = metric1.score + metric2.score + metric3.score;
  // = 0 + 0 + 1 = 1/3 ❌ WRONG!
}
```

**After:**
```javascript
calculateStress() {
  const metric1 = this.calculateArousalScore();  // 0 (unhealthy)
  const metric2 = this.calculateRelaxationScore(); // 0 (unhealthy)
  const metric3 = this.calculateRegeneration();  // 1 (healthy)

  // INVERT SCORES: Count red parameters (unhealthy)
  const invertedScore1 = 1 - metric1.score;  // 1 - 0 = 1
  const invertedScore2 = 1 - metric2.score;  // 1 - 0 = 1
  const invertedScore3 = 1 - metric3.score;  // 1 - 1 = 0

  const totalScore = invertedScore1 + invertedScore2 + invertedScore3;
  // = 1 + 1 + 0 = 2/3 ✅ CORRECT!
}
```

### 2. Special Classification Method

**Added**: `classifyStressBurnout()` method

```javascript
classifyStressBurnout(score) {
  if (score === 0) return 'Low';      // 0/3 = No stress (green)
  if (score <= 2) return 'Medium';    // 1/3 or 2/3 = Medium stress (RED)
  return 'High';                      // 3/3 = High stress (red)
}
```

### 3. Frontend Color Logic Update

**File**: `src/components/admin/AlgorithmDataProcessor.jsx`

**Before:**
```javascript
color: param.classification === 'High' ? 'green' :
       param.classification === 'Medium' ? 'blue' : 'orange'
// All parameters use same color logic
```

**After:**
```javascript
const isStressOrBurnout = param.name === 'Stress' || param.name === 'Burnout & Fatigue';

if (isStressOrBurnout) {
  // For Stress/Burnout: Low = green, Medium/High = red
  color = param.classification === 'Low' ? 'green' : 'red';
} else {
  // For other parameters: High = green, Medium = blue, Low = orange
  color = param.classification === 'High' ? 'green' :
          param.classification === 'Medium' ? 'blue' : 'orange';
}
```

---

## How It Works Now

### Example: Stress Parameter

**Sub-Parameters:**
- ❌ Arousal Score: 1.64 (> 1 is abnormal) → Score: 0/1 (unhealthy)
- ❌ Relaxation Score: 6.54 (< 10 is low) → Score: 0/1 (unhealthy)
- ✅ Regeneration: 45.3% (> 30% is healthy) → Score: 1/1 (healthy)

**Calculation:**
```
Individual scores: 0, 0, 1
Inverted scores: (1-0), (1-0), (1-1) = 1, 1, 0
Total: 1 + 1 + 0 = 2/3
Classification: Medium (score <= 2)
Color: RED (Medium stress is warning)
```

**Display:**
```
┌─────────────────────────┐
│ Stress            2/3   │ ← Shows 2 red parameters
│ Medium            RED   │ ← Medium shows in RED
├─────────────────────────┤
│ ❌ Arousal Score   0/1  │ ← Red X
│ ❌ Relaxation Score 0/1 │ ← Red X
│ ✅ Regeneration    1/1  │ ← Green check
└─────────────────────────┘
```

---

## Scoring Logic Comparison

### Normal Parameters (e.g., Focus, Learning)
```
High score = Good health
- 3/3 = High = Green (excellent)
- 2/3 = Medium = Blue (moderate)
- 0-1/3 = Low = Orange (poor)
```

### Stress & Burnout Parameters
```
High score = More problems
- 0/3 = Low = Green (no stress, excellent)
- 1-2/3 = Medium = RED (some stress, warning)
- 3/3 = High = RED (high stress, critical)
```

---

## Files Modified

### Backend:
1. **`server/services/algorithmCalculator.js`**
   - Line 131-135: Added `classifyStressBurnout()` method
   - Line 648-681: Updated `calculateStress()` with inverted scoring
   - Line 717-750: Updated `calculateBurnoutFatigue()` with inverted scoring

### Frontend:
2. **`src/components/admin/AlgorithmDataProcessor.jsx`**
   - Line 557-579: Updated color logic for Stress/Burnout parameters

---

## Testing

### Test Case 1: 2 Red Parameters

**Input:**
- Arousal: 0/1 (red)
- Relaxation: 0/1 (red)
- Regeneration: 1/1 (green)

**Expected Output:**
- Score: 2/3 ✓
- Classification: Medium
- Color: RED ✓

### Test Case 2: All Green Parameters

**Input:**
- Arousal: 1/1 (green)
- Relaxation: 1/1 (green)
- Regeneration: 1/1 (green)

**Expected Output:**
- Score: 0/3 ✓
- Classification: Low
- Color: GREEN ✓

### Test Case 3: All Red Parameters

**Input:**
- Arousal: 0/1 (red)
- Relaxation: 0/1 (red)
- Regeneration: 0/1 (red)

**Expected Output:**
- Score: 3/3 ✓
- Classification: High
- Color: RED ✓

---

## Console Logs (New)

When processing Stress parameter, you'll see:

```
📊 === STRESS PARAMETER (Inverted Scoring) ===

🔄 INVERTING SCORES (counting red parameters):
   Arousal healthy: 0 → Stress points: 1
   Relaxation healthy: 0 → Stress points: 1
   Regeneration healthy: 1 → Stress points: 0

📊 STRESS TOTAL: 1 + 1 + 0 = 2/3
💡 Interpretation: 2/3 = 2 red parameters (unhealthy)
```

---

## Color Legend

### Stress & Burnout:
- 🟢 **Low (0/3)**: No stress, excellent mental health
- 🔴 **Medium (1-2/3)**: Some stress, needs attention
- 🔴 **High (3/3)**: High stress, immediate intervention needed

### Other Parameters:
- 🟢 **High (3/3)**: Excellent function
- 🔵 **Medium (2/3)**: Moderate function
- 🟠 **Low (0-1/3)**: Poor function

---

## Summary

✅ **Fixed scoring logic** - Counts red (unhealthy) parameters for Stress/Burnout
✅ **Added inversion** - Higher score = more stress (correct interpretation)
✅ **Special classification** - Medium shows in RED for Stress/Burnout
✅ **Updated frontend** - Different color logic for Stress/Burnout vs other parameters
✅ **Accurate display** - 2 red parameters = 2/3 score

**Stress and Burnout parameters now correctly show severity!** 🎯
