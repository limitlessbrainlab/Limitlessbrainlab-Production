import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * Automatically scrolls to top of page when route changes
 * Handles both window scroll AND scrollable containers (like DashboardLayout's main)
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    // Temporarily disable smooth scroll
    const html = document.documentElement;
    const originalScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    // Method 1: Window scroll
    window.scrollTo(0, 0);

    // Method 2: Document elements
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Method 3: Target the main content area with overflow-y-auto (DashboardLayout)
    const mainElements = document.querySelectorAll('main');
    mainElements.forEach(main => {
      main.scrollTop = 0;
    });

    // Method 4: Target any element with overflow-y-auto or overflow-auto
    // EXCEPT sidebar navigation (preserve sidebar scroll position)
    const scrollableContainers = document.querySelectorAll(
      '[class*="overflow-y-auto"], [class*="overflow-auto"], [class*="overflow-y-scroll"]'
    );
    scrollableContainers.forEach(el => {
      // Skip sidebar navigation - check if element is inside sidebar or has data-preserve-scroll
      if (el.closest('[data-preserve-scroll]') || el.hasAttribute('data-preserve-scroll')) {
        return;
      }
      el.scrollTop = 0;
    });

    // Method 5: Target specific app containers
    const appContainers = document.querySelectorAll('.App, #root, #app');
    appContainers.forEach(el => {
      el.scrollTop = 0;
    });

    // Restore scroll behavior
    requestAnimationFrame(() => {
      html.style.scrollBehavior = originalScrollBehavior;
    });

  }, [pathname]);

  return null;
};

export default ScrollToTop;
