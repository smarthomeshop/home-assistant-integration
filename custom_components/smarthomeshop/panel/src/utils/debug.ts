// Runtime-toggleable debug logging for the SmartHomeShop frontend bundles.
//
// Enable from the browser console with:   shsDebug.enable()
// Disable with:                           shsDebug.disable()
// The setting persists in localStorage across reloads.

const STORAGE_KEY = "smarthomeshop_debug";

let enabled = false;
try {
  enabled = localStorage.getItem(STORAGE_KEY) === "1";
} catch {
  enabled = false;
}

interface DebugGlobal {
  __shsDebugSetters?: Array<(v: boolean) => void>;
  shsDebug?: { enable: () => void; disable: () => void; readonly enabled: boolean };
}

const g = window as unknown as DebugGlobal;

// Each bundle (cards, panel) has its own module instance; register a setter
// so one global switch controls them all.
g.__shsDebugSetters = g.__shsDebugSetters || [];
g.__shsDebugSetters.push((v: boolean) => { enabled = v; });

if (!g.shsDebug) {
  g.shsDebug = {
    enable() {
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
      (g.__shsDebugSetters || []).forEach(fn => fn(true));
      console.info("[SmartHomeShop] Debug logging enabled");
    },
    disable() {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      (g.__shsDebugSetters || []).forEach(fn => fn(false));
      console.info("[SmartHomeShop] Debug logging disabled");
    },
    get enabled() {
      try { return localStorage.getItem(STORAGE_KEY) === "1"; } catch { return false; }
    },
  };
}

/** Gated debug logger: silent unless shsDebug.enable() was called. */
export function debugLog(...args: unknown[]): void {
  if (enabled) {
    console.log("[SmartHomeShop]", ...args);
  }
}
