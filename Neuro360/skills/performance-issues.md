# Neuro360 Performance Issues & Fix Plan

## Critical Bottlenecks

### 1. PatientDashboard.jsx (9,473 lines, 73 useState hooks)
- Eagerly imports 11 heavy page components: ANSResetProtocol, FrequenciesMusic, SupplementsNootropics, FivePillars, NeuroCoaching, BrainCoach, HomeNeurofeedback, Photobiomodulation, WalletPage, OpeningPage, InteractiveBrain
- Every state change re-renders the entire component
- Zero React.memo, useMemo, or useCallback usage
- **Fix:** Lazy import sub-pages, split into smaller components, add memoization

### 2. No Code Splitting (App.jsx)
- All 50+ routes eagerly imported — no React.lazy() or Suspense
- Entire app bundled in one chunk (estimated 2-4MB)
- **Fix:** Wrap all route components with React.lazy() + Suspense fallback

### 3. Unoptimized Images (28+ MB in /public)
- 3.png (6.4MB), 2.png (5.6MB), 1.png (5.5MB), 4.png (5.1MB), Neurosense Academy.jpeg (2.2MB)
- No lazy loading, no WebP/AVIF, no compression, no responsive variants
- **Fix:** Compress images, convert to WebP, add loading="lazy"

### 4. Unthrottled Scroll Listeners
- GuideToBrainwaves.jsx fires querySelectorAll + setState 60x/second on scroll
- No throttle/debounce on scroll handlers
- **Fix:** Add throttle (200ms) to scroll event handlers

### 5. 1,939 console.log Statements
- Across all src/ files including App.jsx startup
- Each log creates string interpolations and objects
- **Fix:** Add vite plugin to strip console.log in production builds

### 6. Massive Monolithic Components
- Landing.jsx: 2,537 lines
- BrainCoach.jsx: 2,405 lines
- ANSResetProtocol.jsx: 2,476 lines (27+ setTimeout calls, nested timer chains)
- **Fix:** Break into smaller sub-components

### 7. Excessive Context Providers Without Memoization
- App.jsx wraps entire app in 4+ context providers (ContactForm, ProfessionalForm, ProgramForm, LocationsPopup)
- AuthContext.jsx: 803 lines — updates trigger full app re-render
- **Fix:** Memoize context values, split contexts by update frequency

### 8. Vite Config Missing Optimizations
- No chunk splitting configuration
- sourcemap: true in production (should be false)
- No minification or chunk size limit settings
- **Fix:** Add rollupOptions manualChunks, disable sourcemaps in prod

### 9. Heavy Dependencies
- framer-motion (141KB gzipped) — full import
- recharts (130KB gzipped) — often only subset needed
- **Fix:** Tree-shake imports, lazy load chart/animation libraries

### 10. Audio/Timer Memory Leaks
- FrequenciesMusic.jsx: audio element ref not always cleared on unmount
- ANSResetProtocol.jsx: 27+ setTimeout/setInterval calls without guaranteed cleanup
- **Fix:** Ensure all intervals/timeouts cleaned in useEffect return

## Priority Fix Order

1. Route-level code splitting in App.jsx (biggest impact, ~30min)
2. Lazy import sub-pages in PatientDashboard.jsx (~30min)
3. Strip console.logs via vite config (~5min)
4. Compress/optimize images (~1hr)
5. Throttle scroll listeners (~15min)
6. Add memoization to heavy components (~1hr)
7. Split monolithic components (ongoing)

## Performance Targets

- Initial bundle: < 500KB (currently estimated 2-4MB)
- TTI: < 3 seconds (currently estimated 8-12s)
- Scroll FPS: 60 FPS (currently drops to 20-30)
- Image payload: < 2MB total (currently 28+ MB)
