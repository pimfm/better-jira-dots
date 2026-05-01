/* global chrome, browser */
// Settings module. Exposed at window.BJD.settings.
// Loaded first; later content scripts reuse window.BJD.

(function () {
  "use strict";

  const STORAGE_KEY = "betterJiraDots.settings.v1";

  const DEFAULTS = Object.freeze({
    enabled: true,
    // Jira status category keys: "new" = To Do, "indeterminate" = In Progress, "done" = Done.
    hiddenStatusCategories: ["new", "done"],
    // Sun..Sat. Mon-Fri true by default.
    workingDays: [false, true, true, true, true, true, false],
    cacheTtlMs: 5 * 60 * 1000,
  });

  // Extension API: Chrome exposes `chrome`, Firefox exposes both `browser` and `chrome`.
  // We use `chrome.storage` because both browsers expose a callback-or-promise variant on it.
  const storage = (typeof chrome !== "undefined" && chrome.storage)
    ? chrome.storage
    : (typeof browser !== "undefined" ? browser.storage : null);

  function get() {
    if (!storage) return Promise.resolve({ ...DEFAULTS });
    return new Promise((resolve) => {
      try {
        const result = storage.sync.get(STORAGE_KEY, (items) => {
          const stored = items && items[STORAGE_KEY];
          resolve(merge(DEFAULTS, stored || {}));
        });
        // Firefox returns a Promise from storage.sync.get and ignores the callback.
        if (result && typeof result.then === "function") {
          result.then((items) => {
            const stored = items && items[STORAGE_KEY];
            resolve(merge(DEFAULTS, stored || {}));
          }).catch(() => resolve({ ...DEFAULTS }));
        }
      } catch (err) {
        resolve({ ...DEFAULTS });
      }
    });
  }

  function set(partial) {
    return get().then((current) => {
      const next = merge(current, partial);
      return new Promise((resolve, reject) => {
        if (!storage) {
          resolve(next);
          return;
        }
        try {
          const result = storage.sync.set({ [STORAGE_KEY]: next }, () => {
            resolve(next);
          });
          if (result && typeof result.then === "function") {
            result.then(() => resolve(next)).catch(reject);
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  function onChange(callback) {
    if (!storage || !storage.onChanged) return () => {};
    const listener = (changes, area) => {
      if (area !== "sync") return;
      if (!changes[STORAGE_KEY]) return;
      const next = merge(DEFAULTS, changes[STORAGE_KEY].newValue || {});
      try { callback(next); } catch (err) { /* ignore */ }
    };
    storage.onChanged.addListener(listener);
    return () => storage.onChanged.removeListener(listener);
  }

  function merge(base, overrides) {
    const out = { ...base };
    for (const key of Object.keys(overrides || {})) {
      if (overrides[key] === undefined) continue;
      out[key] = overrides[key];
    }
    // Defensive normalization.
    if (!Array.isArray(out.hiddenStatusCategories)) {
      out.hiddenStatusCategories = [...DEFAULTS.hiddenStatusCategories];
    }
    if (!Array.isArray(out.workingDays) || out.workingDays.length !== 7) {
      out.workingDays = [...DEFAULTS.workingDays];
    }
    out.workingDays = out.workingDays.map(Boolean);
    out.cacheTtlMs = clampInt(out.cacheTtlMs, 0, 60 * 60 * 1000, DEFAULTS.cacheTtlMs);
    // Strip any legacy keys (yellowThreshold/redThreshold/maxDots) so they don't
    // resurface on read from sync storage written by older versions.
    delete out.yellowThreshold;
    delete out.redThreshold;
    delete out.maxDots;
    return out;
  }

  function clampInt(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.round(n)));
  }

  const ns = (window.BJD = window.BJD || {});
  ns.settings = { get, set, onChange, DEFAULTS, STORAGE_KEY };
})();
