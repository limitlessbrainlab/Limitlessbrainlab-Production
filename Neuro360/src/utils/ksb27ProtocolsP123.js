// KSB NSB — All 27 Combinations with P1/P2/P3 Specific Protocols
// Source: KSB_27_Combinations.xlsx — "Full Protocol — All 27" sheet
// P1 = Cognition, P2 = Stress & Burnout, P3 = Emotional Regulation

const KSB_27_PROTOCOLS_P123 = {
  'L-L-L': {
    code: 'L-L-L',
    P1: {
      pranayama: 'Kapalbhati\n5 min · AM',
      yogasana: 'Surya Namaskar\n5 rounds · AM',
      meditation: 'Neuro Memory - 10-15 mins; AM',
      binaural: 'Gamma Binaural · 20 min AM',
      chant: 'Gayatri Mantra\n21 × AM',
      supplement: 'Acetyl Carnie Pearl\nAcetyl-L-Carnitine 500mg\nOne Tablet · AM fasted'
    },
    P2: {
      pranayama: 'Anulom Vilom\n5 min · AM',
      yogasana: 'Vrikshasana (Tree)\n2-5 min · AM',
      chant: 'Medha Suktam\n7 × AM',
      supplement: 'P-Serine\nPhosphatidylserine 100mg\nOne Tablet · AM + PM'
    },
    P3: {
      pranayama: 'Bhramari\n5–10 min · AM + PM',
      yogasana: 'Marjaryasana-Bitilasana (Cat Cow)\n2-5 min · AM',
      meditation: 'Neuro Ho\'oponopono - 10-15 mins; PM',
      binaural: 'Solfeggio 528 Hz Heart Chakra , PM',
      chant: 'Saraswati Mantra\n21 × AM',
      supplement: 'Synergy Multivitamin\nFull spectrum vitamins\nOne Tablet · PM with food'
    }
  },
  'L-L-H': {
    code: 'L-L-H',
    P1: {
      pranayama: 'Kapalbhati\n5 min · AM',
      yogasana: 'Surya Namaskar\n5 rounds · AM',
      meditation: 'Neuro Memory - 10-15 mins; AM',
      binaural: 'Gamma Binaural · 20 min AM',
      chant: 'Gayatri Mantra\n21 × AM',
      supplement: 'Acetyl Carnie Pearl\nAcetyl-L-Carnitine 500mg\nOne Tablet · AM fasted'
    },
    P2: {
      pranayama: 'Anulom Vilom\n5 min · AM',
      yogasana: 'Vrikshasana (Tree)\n2-5 min · AM',
      chant: 'Medha Suktam\n7 × AM',
      supplement: 'P-Serine\nPhosphatidylserine 100mg\nOne Tablet · AM + PM'
    },
    P3: {
      pranayama: 'Bhramari\n5–10 min · AM + PM',
      yogasana: 'Marjaryasana-Bitilasana (Cat Cow)\n2-5 min · AM',
      chant: 'Saraswati Mantra\n21 × AM',
      supplement: 'Synergy Multivitamin\nFull spectrum vitamins\nOne Tablet · PM with food'
    }
  },
  'L-M-M': {
    code: 'L-M-M',
    P1: {
      pranayama: 'Kapalbhati\n5 min · AM',
      yogasana: 'Surya Namaskar\n5 rounds · AM',
      meditation: 'Memory Meditation\n20–30 min · AM',
      binaural: 'Alpha Binaural\n8–12 Hz · 20 min AM',
      chant: 'Gayatri Mantra\n21 × AM',
      supplement: 'Acetyl Carnie Pearl\nAcetyl-L-Carnitine 500mg\nOne Tab · AM fasted'
    },
    P2: {
      pranayama: 'Box Breathing\n5 min · AM + PM',
      yogasana: 'Vrikshasana (Tree)\n2-5 min · AM',
      meditation: 'Stress Relief Meditation\n20–25 min · PM',
      chant: 'Maha Mrityunjaya Mantra\n7 × PM'
    },
    P3: {
      pranayama: 'Bhramari\n5-10 min · AM + PM',
      yogasana: 'Viparita Karani\n10 min · PM',
      binaural: 'Solfeggio 396 Hz\n639 Hz · 20 min PM',
      supplement: 'Magneshine G\nLiposomal Magnesium C\n26 mg · One Tab ; PM'
    }
  },
  'L-H-L': {
    code: 'L-H-L',
    P1: {
      pranayama: 'Yogic Breathing\n5 min · AM',
      yogasana: 'Marjaryasana-Bitilasana (Cat Cow)\n2-5 min · AM',
      meditation: 'Yoga Nidra\n30–40 min · PM'
    },
    P2: {
      pranayama: 'Box Breathing\n5-10 min · PM',
      yogasana: 'Viparita Karani (Legs Up Wall)\n10 min · PM',
      meditation: 'Stress Relief Meditation\n30–40 min · AM'
    },
    P3: {
      pranayama: 'Bhramari\n5-10 min · PM',
      yogasana: 'Ushtrasana (Camel Pose)\n2- 5 min · AM'
    }
  },
  'L-H-H': {
    code: 'L-H-H',
    P1: {
      pranayama: 'Kapalbhati\n5 min · AM',
      yogasana: 'Marjaryasana-Bitilasana (Cat Cow)\n2-5 min · PM',
      meditation: 'Neuro Memory Meditation\n20–30 min · AM',
      binaural: 'Alpha Binaural\n8–12 Hz · 20 min AM'
    },
    P2: {
      pranayama: 'Box Breathing\n5 min · AM + PM',
      yogasana: 'Viparita Karani (Legs Up Wall)\n10 min · PM',
      meditation: 'Yoga Nidra\n30–40 min · PM',
      binaural: 'Solfeggio 285 Hz · 20–30 min PM'
    },
    P3: {
      pranayama: 'Anulom Vilom\n5 min · AM',
      yogasana: 'Surya Namaskar\n5 rounds · AM',
      meditation: 'Stress Relief Meditation\n20 min · AM'
    }
  },
  'M-L-L': {
    code: 'M-L-L',
    P1: {
      pranayama: 'Ujjayi\n10 min · AM',
      yogasana: 'Saral Matsyasana 2-5 mins, AM',
      binaural: 'Alpha Binaural\n · 20 min AM'
    },
    P2: {
      pranayama: 'Anulom Vilom\n5 min · AM',
      yogasana: 'Setu Bandhasana (Bridge)\n2-5 min · AM'
    },
    P3: {
      pranayama: 'Bhramari\n5-10 min · AM + PM',
      yogasana: 'Ushtrasana (Camel Pose)\n2-5 min · AM',
      meditation: 'Neuro Ho\'oponopono\n20–25 min · PM',
      binaural: 'Solfeggio 528 Hz\n528 Hz · 20 min AM'
    }
  },
  'M-L-H': {
    code: 'M-L-H',
    P1: {
      pranayama: 'Anulom Vilom\n5 mins · AM',
      yogasana: 'Surya Namaskar\n5 rounds · AM',
      meditation: 'Gamma Meditation\n20 min · AM',
      binaural: '40 Hz Gamma Binaural\n40 Hz · 20 min AM'
    },
    P2: {
      pranayama: 'Bhramari\n5 min · PM',
      yogasana: 'Setu Bandhasana (Bridge)\n2-5 min · PM',
      meditation: 'Alpha Meditation\n20 min · AM',
      binaural: 'Solfeggio 528 Hz\n528 Hz · 20 min AM'
    },
    P3: {
      pranayama: 'Bhastrika\n3 mins · AM',
      yogasana: 'Janushirshasana\n2-5 rounds · AM',
      binaural: 'Solfeggio 852 Hz\n852 Hz · 20 min AM'
    }
  },
  'M-M-L': {
    code: 'M-M-L',
    P1: {
      pranayama: 'Kapalbhati\n5 min · AM',
      yogasana: 'Surya Namaskar\n5 rounds · AM',
      binaural: 'Theta Binaural'
    },
    P2: {
      yogasana: 'Vrikshasana (Tree Pose)\n3–5 min · AM',
      meditation: 'Stress Relief Meditation\n20–25 min · PM',
      binaural: 'Solfeggio 528 Hz\n528 Hz · 25 min PM'
    },
    P3: {
      pranayama: 'Bhramari\n10–15 min · PM',
      yogasana: 'Ushtrasana (Camel Pose)\n2-5 min · PM',
      meditation: 'Neuro Ho\'oponopono 20 mins, PM'
    }
  },
  'M-M-M': {
    code: 'M-M-M',
    P1: {
      pranayama: 'Anulom Vilom\n10–15 min · AM',
      yogasana: 'Surya Namaskar - 5 rounds, AM',
      meditation: 'Gamma Meditation\n20 min · AM',
      binaural: '40 Hz Gamma Binaural\n40 Hz · 20 min AM'
    },
    P2: {
      pranayama: 'Bhastrika 5 mins PM',
      yogasana: 'Viparita Karani (Legs Up Wall)\n10 min · PM',
      meditation: 'Stress Relief Meditation\n20–25 min · PM',
      binaural: 'Solfeggio 963 Hz\n· 25 min PM'
    },
    P3: {
      pranayama: 'Ujjayi\n10 min · AM',
      yogasana: 'Saral Matsyasana 2-5 mins, PM'
    }
  },
  'M-M-H': {
    code: 'M-M-H',
    P1: {
      meditation: 'Gamma Meditation\n20 min · AM',
      binaural: '40 Hz Gamma Binaural\n40 Hz · 20 min AM'
    },
    P2: {
      meditation: 'Stress Relief Meditation\n20–25 min · PM',
      binaural: 'Solfeggio 528 Hz\n528 Hz · 25 min PM'
    },
    P3: {
      meditation: 'Alpha Meditation\n20 min · AM',
      binaural: 'Solfeggio 852 Hz\n852 Hz · 20 min AM'
    }
  },
  'M-H-L': {
    code: 'M-H-L',
    P1: {
      meditation: 'Gamma Meditation\n20 min · AM',
      binaural: '40 Hz Gamma Binaural\n40 Hz · 20 min AM'
    },
    P2: {
      meditation: 'Yoga Nidra\n30–40 min · PM',
      binaural: 'Solfeggio 174 Hz\n174 Hz · 20–30 min PM'
    },
    P3: {
      meditation: 'Anxiety Meditation\n20–25 min · PM',
      binaural: 'Solfeggio 639 Hz\n639 Hz · 20 min PM'
    }
  },
  'M-H-M': {
    code: 'M-H-M',
    P1: {},
    P2: {},
    P3: {}
  },
  'M-H-H': {
    code: 'M-H-H',
    P1: {},
    P2: {},
    P3: {}
  },
  'H-L-L': {
    code: 'H-L-L',
    P1: {},
    P2: {},
    P3: {}
  },
  'H-L-M': {
    code: 'H-L-M',
    P1: {},
    P2: {},
    P3: {}
  },
  'H-L-H': {
    code: 'H-L-H',
    P1: {
      meditation: 'Peak Performance Meditation\n20 min · AM',
      binaural: 'Solfeggio 963 Hz\n963 Hz · 20 min AM'
    },
    P2: {
      meditation: 'Alpha Meditation\n20 min · AM',
      binaural: 'Solfeggio 528 Hz\n528 Hz · 20 min AM'
    },
    P3: {
      meditation: 'Alpha Meditation\n20 min · AM',
      binaural: 'Solfeggio 852 Hz\n852 Hz · 20 min AM'
    }
  },
  'H-M-L': {
    code: 'H-M-L',
    P1: {},
    P2: {},
    P3: {}
  },
  'H-M-M': {
    code: 'H-M-M',
    P1: {
      meditation: 'Peak Performance Meditation\n20 min · AM',
      binaural: 'Solfeggio 963 Hz\n963 Hz · 20 min AM'
    },
    P2: {
      meditation: 'Stress Relief Meditation\n20–25 min · PM',
      binaural: 'Solfeggio 528 Hz\n528 Hz · 25 min PM'
    },
    P3: {
      meditation: 'PTSD Meditation\n20 min · PM',
      binaural: 'Solfeggio 639 Hz\n639 Hz · 20 min PM'
    }
  },
  'H-M-H': {
    code: 'H-M-H',
    P1: {},
    P2: {},
    P3: {}
  },
  'H-H-L': {
    code: 'H-H-L',
    P1: {},
    P2: {},
    P3: {}
  },
  'H-H-M': {
    code: 'H-H-M',
    P1: {},
    P2: {},
    P3: {}
  },
  'H-H-H': {
    code: 'H-H-H',
    P1: {},
    P2: {},
    P3: {}
  }
};

export default KSB_27_PROTOCOLS_P123;
