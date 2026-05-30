import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Brain } from 'lucide-react';

const InteractiveBrain = () => {
  const navigate = useNavigate();
  const [activePart, setActivePart] = useState(null);

  const brainParts = {
    frontal_lobe: {
      title: 'Frontal Lobe',
      color: '#00bcd4',
      description: "The Frontal Lobe is the most recently-evolved part of the brain and the last to develop in young adulthood. It's dorso-lateral prefrontal circuit is the brain's top executive. It organizes responses to complex problems, plans steps to an objective, searches memory for relevant experience, adapts strategies to accommodate new data, guides behavior with verbal skills and houses working memory.",
      functions: ['Planning', 'Motor Functions', 'Higher Order Functions', 'Reasoning', 'Judgement', 'Impulse Control', 'Memory', 'Language']
    },
    parietal_lobe: {
      title: 'Parietal Lobe',
      color: '#e497a4',
      description: 'The Parietal Lobe receives and processes sensory information from the body including calculating location and speed of objects.',
      functions: ['Cognition', 'Information Processing', 'Touch Sensation', 'Spatial Orientation', 'Movement Coordination', 'Speech', 'Visual Perception', 'Reading', 'Writing', 'Mathematical Computation']
    },
    temporal_lobe: {
      title: 'Temporal Lobe',
      color: '#7e7acf',
      description: 'The Temporal Lobe controls memory storage area, emotion, hearing, and, on the left side, language.',
      functions: ['Auditory Perception', 'Memory', 'Speech', 'Language Comprehension', 'Emotional Responses', 'Visual Perception', 'Facial Recognition']
    },
    occipital_lobe: {
      title: 'Occipital Lobe',
      color: '#ffc446',
      description: 'The Occipital Lobe processes visual data and routes it to other parts of the brain for identification and storage.',
      functions: ['Visual Perception', 'Color Recognition', 'Reading', 'Reading Comprehension', 'Depth Perception', 'Recognition of Object Movement']
    },
    cerebellum: {
      title: 'Cerebellum',
      color: '#00aa7f',
      description: 'Two peach-size mounds of folded tissue located at the top of the brain stem, the cerebellum is the guru of skilled, coordinated movement and is involved in some learning pathways.',
      functions: ['Fine Movement Coordination', 'Balance & Equilibrium', 'Muscle Tone', 'Sense of Body Position']
    },
    brain_stem: {
      title: 'Brain Stem',
      color: '#b81434',
      description: 'The part of the brain that connects to the spinal cord. The brain stem controls functions basic to the survival of all animals, such as heart rate, breathing, digesting foods, and sleeping. It is the lowest, most primitive area of the human brain.',
      functions: ['Alertness', 'Arousal', 'Breathing', 'Blood Pressure', 'Digestion', 'Heart Rate']
    }
  };

  const currentInfo = activePart ? brainParts[activePart] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#323956] to-[#4a5578] text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/dashboard/welcome')}
            className="flex items-center space-x-2 text-blue-200 hover:text-white mb-4 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-4">
            <div className="bg-white/20 rounded-xl p-3">
              <Brain className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Interactive Brain Map</h1>
              <p className="text-blue-200 mt-1">
                Hover over different parts of the brain to learn about their functions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Panel */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
              {currentInfo ? (
                <>
                  <div
                    className="w-full h-2 rounded-full mb-4"
                    style={{ backgroundColor: currentInfo.color }}
                  />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {currentInfo.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {currentInfo.description}
                  </p>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                      Key Functions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentInfo.functions.map((func, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 text-sm rounded-full text-white"
                          style={{ backgroundColor: currentInfo.color }}
                        >
                          {func}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Hover over a part of the brain!
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">
                    Explore different brain regions and learn about their functions
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Brain Visualization */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="relative w-full max-w-lg mx-auto" style={{ height: '500px' }}>
                {/* Frontal Lobe */}
                <div
                  className={`absolute cursor-pointer transition-all duration-300 ${activePart === 'frontal_lobe' ? 'z-20' : 'z-10'}`}
                  style={{ top: '0', left: '0' }}
                  onMouseEnter={() => setActivePart('frontal_lobe')}
                  onMouseLeave={() => setActivePart(null)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 263.36 316.37"
                    className={`w-48 transition-all duration-300 ${activePart && activePart !== 'frontal_lobe' ? 'opacity-30' : 'opacity-100'} ${activePart === 'frontal_lobe' ? 'scale-110' : 'scale-100'}`}
                    style={{
                      fill: activePart === 'frontal_lobe' ? '#00bcd4' : 'white',
                      stroke: activePart === 'frontal_lobe' ? '#fff' : '#323956',
                      filter: activePart === 'frontal_lobe' ? 'drop-shadow(0 0 10px #00bcd4)' : 'none'
                    }}
                  >
                    <path
                      strokeMiterlimit="10"
                      strokeWidth="2"
                      d="M1.27,192.38c1.08-11.44,4.95-19.83,12.68-36.62A365.14,365.14,0,0,1,32.26,122c1.61-2.63,9.21-15.05,16.9-25.35,24.44-32.73,55.69-52,60.56-54.93,26.78-16.18,50.73-22.39,67.61-26.76,4.64-1.2,12.27-2.39,26.76-5.63,11.63-2.6,17.4-4.09,26.76-5.63,17.17-2.83,25.83-4.16,29.58,0,2.74,3,2.84,8.11-1.41,22.54-7.65,25.95-13.47,28.1-16.9,42.25-5.61,23.14,7.46,27.75,1.41,52.11-4.11,16.57-10.23,14.72-14.08,32.39-4.51,20.66,2.24,30.59-5.63,39.44-5.88,6.6-12.89,4.73-25.35,8.45-22.61,6.74-36.27,23.85-40.85,29.58-21.05,26.36-9.69,48-33.8,70.42-3.76,3.49-8.84,8.11-16.9,11.27-23.36,9.14-50.45-2.41-66.2-15.49-16.14-13.4-22-31.94-33.8-69C1.47,210.48.4,201.55,1.27,192.38Z"
                    />
                  </svg>
                </div>

                {/* Parietal Lobe */}
                <div
                  className={`absolute cursor-pointer transition-all duration-300 ${activePart === 'parietal_lobe' ? 'z-20' : 'z-10'}`}
                  style={{ top: '0', left: '160px' }}
                  onMouseEnter={() => setActivePart('parietal_lobe')}
                  onMouseLeave={() => setActivePart(null)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 257.5 215.34"
                    className={`w-48 transition-all duration-300 ${activePart && activePart !== 'parietal_lobe' ? 'opacity-30' : 'opacity-100'} ${activePart === 'parietal_lobe' ? 'scale-110' : 'scale-100'}`}
                    style={{
                      fill: activePart === 'parietal_lobe' ? '#e497a4' : 'white',
                      stroke: activePart === 'parietal_lobe' ? '#fff' : '#323956',
                      filter: activePart === 'parietal_lobe' ? 'drop-shadow(0 0 10px #e497a4)' : 'none'
                    }}
                  >
                    <path
                      strokeMiterlimit="10"
                      strokeWidth="2"
                      d="M32.14,3c3.32-4.53,11.53-.24,33.8,1.41C81.54,5.58,85,4,94.12,7.24c7.68,2.71,8.41,4.94,16.9,8.45,10.63,4.39,16.22,3.67,26.76,5.63a119.7,119.7,0,0,1,40.85,16.9c9.49,6.35,7.31,7.28,25.35,22.54C219.67,74,221.62,73.57,232.14,83.3c13,12.06,27,24.92,23.94,35.21a12.91,12.91,0,0,1-.66,1.67c-3.92,8.79-10.77,9-13.42,13.82-3.89,7,6.89,13.83,4.23,23.94-1.24,4.7-4.09,5.44-14.08,14.08A265.16,265.16,0,0,0,208.2,196c-10.74,12.43-12.22,17.65-18.31,18.31s-7.11-4.24-16.9-7c-9.21-2.63-17.38-.89-28.17,1.41-14.05,3-14.68,6-22.54,5.63-10.5-.53-18-6.37-22.54-9.86-5.35-4.15-16-12.38-15.49-22.54.09-1.87,1.94-6,5.63-14.08,5.21-11.45,6.73-13.47,5.63-15.49-2.29-4.25-13.1-3.11-19.72-1.41-11.06,2.84-11.6,7.53-23.94,12.68-4.92,2-11.73,3.24-25.35,5.63-21.13,3.71-23,2.39-23.94,1.41-4.43-4.86,1.38-17.38,7-29.58,5.76-12.41,8.88-14.31,11.27-22.54,3.33-11.47.89-22.23,0-26.76-2.46-12.49-6-12.52-5.63-19.72C15.73,61.36,23.46,61,29.33,45.27a60.81,60.81,0,0,0,4.23-26.76C32.77,9,29.94,6,32.14,3Z"
                    />
                  </svg>
                </div>

                {/* Temporal Lobe */}
                <div
                  className={`absolute cursor-pointer transition-all duration-300 ${activePart === 'temporal_lobe' ? 'z-20' : 'z-10'}`}
                  style={{ top: '140px', left: '80px' }}
                  onMouseEnter={() => setActivePart('temporal_lobe')}
                  onMouseLeave={() => setActivePart(null)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 287.49 189.89"
                    className={`w-52 transition-all duration-300 ${activePart && activePart !== 'temporal_lobe' ? 'opacity-30' : 'opacity-100'} ${activePart === 'temporal_lobe' ? 'scale-110' : 'scale-100'}`}
                    style={{
                      fill: activePart === 'temporal_lobe' ? '#7e7acf' : 'white',
                      stroke: activePart === 'temporal_lobe' ? '#fff' : '#323956',
                      filter: activePart === 'temporal_lobe' ? 'drop-shadow(0 0 10px #7e7acf)' : 'none'
                    }}
                  >
                    <path
                      strokeMiterlimit="10"
                      strokeWidth="2"
                      d="M1.11,140c1-7.82,8.46-7.87,16.9-19.72,5.3-7.43,4.49-10.38,12.68-33.8C36.09,71,38.8,63.26,40.54,61.12,51.26,47.95,63.39,54.13,87,40c14-8.4,10.25-10.88,23.94-18.31C114,20,122.33,15.74,154.63,7.6,169,4,175-1.16,178.57,2c4.19,3.63-1.85,10.92,1.41,21.13,4,12.49,18.43,18.49,28.17,22.54,7.21,3,16.44,6.83,28.17,5.63,14.42-1.47,18.71-9.11,33.8-8.45,4.64.2,12.83.56,15.49,5.63,3.1,5.91-2.4,16.14-9.86,19.72-5.77,2.77-9.19-.12-16.9,0-16.57.26-34.76,14.13-36.62,28.17C221,105.45,227.58,108,225,114.64c-5,13.15-35.37,14-39.44,14.08-12.9.35-14.25-2.39-21.13,0-8.52,3-9.51,8.24-23.94,23.94A184.6,184.6,0,0,1,118,173.8c-9.73,7.54-15.42,12-23.94,14.08-8.91,2.22-15.92.57-29.58-2.82-17.22-4.27-33-8.2-47.89-21.13C9.48,157.73-.12,149.37,1.11,140Z"
                    />
                  </svg>
                </div>

                {/* Occipital Lobe */}
                <div
                  className={`absolute cursor-pointer transition-all duration-300 ${activePart === 'occipital_lobe' ? 'z-20' : 'z-10'}`}
                  style={{ top: '100px', left: '260px' }}
                  onMouseEnter={() => setActivePart('occipital_lobe')}
                  onMouseLeave={() => setActivePart(null)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 172.75 162.7"
                    className={`w-32 transition-all duration-300 ${activePart && activePart !== 'occipital_lobe' ? 'opacity-30' : 'opacity-100'} ${activePart === 'occipital_lobe' ? 'scale-110' : 'scale-100'}`}
                    style={{
                      fill: activePart === 'occipital_lobe' ? '#ffc446' : 'white',
                      stroke: activePart === 'occipital_lobe' ? '#fff' : '#323956',
                      filter: activePart === 'occipital_lobe' ? 'drop-shadow(0 0 10px #ffc446)' : 'none'
                    }}
                  >
                    <path
                      strokeMiterlimit="10"
                      strokeWidth="2"
                      d="M28.08,150.3c7.67-2,12.21,1.73,21.13,4.23,20.93,5.86,26-6.07,53.52-4.23,20.17,1.35,23.56,8.16,35.21,4.23,12.82-4.33,19.57-16.23,23.94-23.94,9.56-16.84,9.73-33,9.86-45.07a121,121,0,0,0-7-42.25C160.84,32.67,150.78.61,137.94,1c-5.69.17-11.33,6.67-12.68,12.68-1.67,7.45,4.07,10.52,4.23,18.31.13,6.41-3.64,9.38-21.13,28.17C88.12,81.91,89.29,82.11,83,86.92c-8.35,6.39-12.33,7.5-16.9,14.08-6.33,9.11-4.26,15-8.45,21.13-6.29,9.23-17.31,1.73-38,9.86-8.06,3.16-16.6,6.65-18.31,14.08-1.44,6.25,2.18,14.33,7,15.49C14.3,163,17.55,153,28.08,150.3Z"
                    />
                  </svg>
                </div>

                {/* Cerebellum */}
                <div
                  className={`absolute cursor-pointer transition-all duration-300 ${activePart === 'cerebellum' ? 'z-20' : 'z-10'}`}
                  style={{ top: '260px', left: '200px' }}
                  onMouseEnter={() => setActivePart('cerebellum')}
                  onMouseLeave={() => setActivePart(null)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 214.25 161.76"
                    className={`w-36 transition-all duration-300 ${activePart && activePart !== 'cerebellum' ? 'opacity-30' : 'opacity-100'} ${activePart === 'cerebellum' ? 'scale-110' : 'scale-100'}`}
                    style={{
                      fill: activePart === 'cerebellum' ? '#00aa7f' : 'white',
                      stroke: activePart === 'cerebellum' ? '#fff' : '#323956',
                      filter: activePart === 'cerebellum' ? 'drop-shadow(0 0 10px #00aa7f)' : 'none'
                    }}
                  >
                    <path
                      strokeMiterlimit="10"
                      strokeWidth="2"
                      d="M113.8,157.91c12.66-4.17,35.25-16.66,59.15-46.48,24.13-30.11,32.25-56.24,35.21-67.61,4-15.51,8.74-27.87.68-35.57C202.42,2.13,191.69-1.46,164.5,3c-19.42,3.17-23.72,6.37-36.62,0-9.8-4.84-18.54,4.8-28.17,8.45-25.49,9.68-16.73,7.29-38,16.9-15.87,7.16-20.89,3.28-38,.86-6-.85-17.25,6.69-22,14.49-2.83,4.63,4,6.31,13.56,15.64,10.35,10.05,14.64,21.33,18.31,31,7.08,18.63,2.81,23,8.45,35.21,8.2,17.75,24.74,25.66,29.58,28.17,5.1,2.65,13,6.65,23.94,7A50.93,50.93,0,0,0,113.8,157.91Z"
                    />
                  </svg>
                </div>

                {/* Brain Stem */}
                <div
                  className={`absolute cursor-pointer transition-all duration-300 ${activePart === 'brain_stem' ? 'z-20' : 'z-10'}`}
                  style={{ top: '300px', left: '160px' }}
                  onMouseEnter={() => setActivePart('brain_stem')}
                  onMouseLeave={() => setActivePart(null)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 198.11 242.51"
                    className={`w-32 transition-all duration-300 ${activePart && activePart !== 'brain_stem' ? 'opacity-30' : 'opacity-100'} ${activePart === 'brain_stem' ? 'scale-110' : 'scale-100'}`}
                    style={{
                      fill: activePart === 'brain_stem' ? '#b81434' : 'white',
                      stroke: activePart === 'brain_stem' ? '#fff' : '#323956',
                      filter: activePart === 'brain_stem' ? 'drop-shadow(0 0 10px #b81434)' : 'none'
                    }}
                  >
                    <path
                      strokeMiterlimit="10"
                      strokeWidth="2"
                      d="M1.14,39c1.11,3.32,7.64,1.49,14,6.24,5.7,4.23,7.64,11,9,15.62,2.44,8.46.11,10.6,2.75,17.69.64,1.71,2.38,5.9,9,13a97.43,97.43,0,0,0,20,16.11c11.14,7.14,19.87,20.74,37.34,47.95,8.16,12.71,13.92,23.27,17.29,29.48,7.46,13.72,11.18,20.59,14.15,27.82,6.37,15.56,5.69,20.13,11.4,24.45,7.51,5.68,17.36,4.32,25.94,3.14,10-1.38,27.39-3.77,33.41-14.93s-6.14-19.19-22-61.31c-8.86-23.52-10.66-35.95-22.8-42.05-7.49-3.77-9.76-.52-23.19-3.93-6.06-1.54-22.74-6-36.94-20.83-3.86-4-15.87-17.52-18.86-37.34-1.2-7.92.56-6.8-.79-13.76C68.11,31.75,59.46,22.12,47,8.19,41.39,2,40.11,1.36,38.71,1.11,31.27-.21,28.11,10.18,8.05,29,4.27,32.56.19,36.14,1.14,39Z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Brain Regions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(brainParts).map(([key, part]) => (
                  <button
                    key={key}
                    onClick={() => setActivePart(activePart === key ? null : key)}
                    className={`flex items-center space-x-2 p-2 rounded-lg transition-all ${activePart === key ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: part.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{part.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveBrain;
