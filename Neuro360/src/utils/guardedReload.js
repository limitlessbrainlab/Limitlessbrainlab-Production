// Reload the page at most once per window per reason, per tab.
// sessionStorage = per-tab scope (each stale tab gets its own one-shot),
// survives the reload itself, cleared on tab close.
const WINDOW_MS = 60 * 1000;

export function reloadAllowed(reason = 'chunk') {
  try {
    const key = `guarded_reload_${reason}`;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < WINDOW_MS) return false;
    sessionStorage.setItem(key, String(Date.now()));
    return true;
  } catch (e) {
    return true; // storage blocked: fail open, a single reload is still the right call
  }
}

export function guardedReload(reason = 'chunk') {
  if (!reloadAllowed(reason)) return false;
  window.location.reload();
  return true;
}
