/* global chrome, browser */

const STORAGE_KEY = "betterJiraDots.settings.v1";

const DEFAULTS = Object.freeze({
  enabled: true,
  hiddenStatusCategories: ["new", "done"],
  workingDays: [false, true, true, true, true, true, false],
  cacheTtlMs: 5 * 60 * 1000,
});

const storage = (typeof chrome !== "undefined" && chrome.storage)
  ? chrome.storage
  : (typeof browser !== "undefined" ? browser.storage : null);

const els = {
  form: document.getElementById("settings-form"),
  enabled: document.getElementById("enabled"),
  status: document.getElementById("status"),
  reset: document.getElementById("reset"),
  preview: document.getElementById("preview"),
  categories: Array.from(document.querySelectorAll("[data-category]")),
  weekdays: Array.from(document.querySelectorAll("[data-day]")),
};

let saveTimer = null;

init();

async function init() {
  const settings = await loadSettings();
  applySettingsToForm(settings);
  updatePreview();

  els.form.addEventListener("change", onAnyChange);
  els.form.addEventListener("input", onAnyChange);
  els.reset.addEventListener("click", onReset);
}

function onAnyChange() {
  const settings = readSettingsFromForm();
  updatePreview();
  scheduleSave(settings);
}

function scheduleSave(settings) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(settings), 200);
}

async function save(settings) {
  setStatus("Saving…");
  try {
    await writeSettings(settings);
    setStatus("Saved", true);
    setTimeout(() => setStatus(""), 1200);
  } catch (err) {
    setStatus("Failed to save: " + (err && err.message ? err.message : String(err)));
  }
}

async function onReset() {
  applySettingsToForm({ ...DEFAULTS });
  updatePreview();
  await save({ ...DEFAULTS });
}

function setStatus(text, saved = false) {
  els.status.textContent = text;
  els.status.classList.toggle("status--saved", saved && Boolean(text));
}

function applySettingsToForm(s) {
  els.enabled.checked = !!s.enabled;
  for (const input of els.categories) {
    const key = input.dataset.category;
    input.checked = s.hiddenStatusCategories.includes(key);
  }
  for (const input of els.weekdays) {
    const day = Number(input.dataset.day);
    input.checked = !!s.workingDays[day];
  }
}

function readSettingsFromForm() {
  const hidden = els.categories.filter((i) => i.checked).map((i) => i.dataset.category);
  const workingDays = [false, false, false, false, false, false, false];
  for (const input of els.weekdays) {
    workingDays[Number(input.dataset.day)] = input.checked;
  }
  return {
    enabled: els.enabled.checked,
    hiddenStatusCategories: hidden,
    workingDays,
    cacheTtlMs: DEFAULTS.cacheTtlMs,
  };
}

function updatePreview() {
  const rows = els.preview.querySelectorAll("[data-count]");
  for (const row of rows) {
    const count = Number(row.getAttribute("data-count"));
    const pattern = getDotPattern(count);
    row.innerHTML = pattern
      .map((color) => `<span style="background-color: var(--${color});"></span>`)
      .join("");
  }
}

function getDotPattern(days) {
  if (!Number.isFinite(days) || days <= 0) return [];
  if (days === 1) return ["grey"];
  if (days === 2) return ["grey", "grey"];
  if (days === 3) return ["grey", "grey", "grey"];
  let red;
  if (days >= 20) red = 4;
  else if (days >= 12) red = 3;
  else if (days >= 8) red = 2;
  else if (days >= 7) red = 1;
  else red = 0;
  const grey = 4 - red;
  const out = [];
  for (let i = 0; i < red; i++) out.push("red");
  for (let i = 0; i < grey; i++) out.push("grey");
  return out;
}

function loadSettings() {
  return new Promise((resolve) => {
    if (!storage) return resolve({ ...DEFAULTS });
    try {
      const result = storage.sync.get(STORAGE_KEY, (items) => {
        const stored = items && items[STORAGE_KEY];
        resolve(merge({ ...DEFAULTS }, stored || {}));
      });
      if (result && typeof result.then === "function") {
        result.then((items) => {
          const stored = items && items[STORAGE_KEY];
          resolve(merge({ ...DEFAULTS }, stored || {}));
        }).catch(() => resolve({ ...DEFAULTS }));
      }
    } catch (err) {
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

function merge(base, overrides) {
  const out = { ...base, ...overrides };
  if (!Array.isArray(out.hiddenStatusCategories)) out.hiddenStatusCategories = [...DEFAULTS.hiddenStatusCategories];
  if (!Array.isArray(out.workingDays) || out.workingDays.length !== 7) out.workingDays = [...DEFAULTS.workingDays];
  out.workingDays = out.workingDays.map(Boolean);
  return out;
}
