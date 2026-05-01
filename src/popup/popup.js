/* global chrome, browser */

const STORAGE_KEY = "betterJiraDots.settings.v1";

const DEFAULTS = Object.freeze({
  enabled: true,
  hiddenStatusCategories: ["new", "done"],
  workingDays: [false, true, true, true, true, true, false],
  cacheTtlMs: 5 * 60 * 1000,
});

const ext = (typeof chrome !== "undefined" && chrome) || (typeof browser !== "undefined" ? browser : null);
const storage = ext && ext.storage ? ext.storage : null;

const els = {
  enabled: document.getElementById("enabled"),
  toggleLabel: document.getElementById("toggle-label"),
  openOptions: document.getElementById("open-options"),
  hint: document.getElementById("hint"),
};

init();

async function init() {
  const settings = await loadSettings();
  paint(settings);

  els.enabled.addEventListener("change", async () => {
    const next = { ...settings, enabled: els.enabled.checked };
    paint(next);
    try {
      await writeSettings(next);
    } catch (err) {
      paint(settings);
      els.enabled.checked = settings.enabled;
    }
  });

  els.openOptions.addEventListener("click", () => {
    if (ext && ext.runtime && typeof ext.runtime.openOptionsPage === "function") {
      ext.runtime.openOptionsPage();
      window.close();
    }
  });
}

function paint(settings) {
  els.enabled.checked = !!settings.enabled;
  els.toggleLabel.textContent = settings.enabled ? "Enabled" : "Disabled";
  els.hint.style.opacity = settings.enabled ? "1" : "0.6";
}

function loadSettings() {
  return new Promise((resolve) => {
    if (!storage) return resolve({ ...DEFAULTS });
    try {
      const result = storage.sync.get(STORAGE_KEY, (items) => {
        const stored = items && items[STORAGE_KEY];
        resolve({ ...DEFAULTS, ...(stored || {}) });
      });
      if (result && typeof result.then === "function") {
        result.then((items) => {
          const stored = items && items[STORAGE_KEY];
          resolve({ ...DEFAULTS, ...(stored || {}) });
        }).catch(() => resolve({ ...DEFAULTS }));
      }
    } catch {
      resolve({ ...DEFAULTS });
    }
  });
}

function writeSettings(settings) {
  return new Promise((resolve, reject) => {
    if (!storage) return resolve();
    try {
      const result = storage.sync.set({ [STORAGE_KEY]: settings }, () => resolve());
      if (result && typeof result.then === "function") {
        result.then(resolve).catch(reject);
      }
    } catch (err) {
      reject(err);
    }
  });
}
