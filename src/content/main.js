// Entry point for the content script. Loaded last in manifest.

(function () {
  "use strict";

  const ns = window.BJD || {};
  if (!ns.settings || !ns.api || !ns.dots || !ns.workdays) {
    return;
  }

  const SCHEDULE_DEDUPE_MS = 1500;

  let visibilityObserver = null;
  let mutationObserver = null;
  let scheduleTimer = null;
  let currentSettings = null;

  // Indicators we've registered with the visibility observer (or fallback queue).
  // Reassigned to fresh instances on uninstall so re-enable can re-register
  // the same DOM nodes — WeakSet/WeakMap have no `.clear()`.
  let observedIndicators = new WeakSet();
  let scheduled = new WeakMap();
  let indicatorKeys = new WeakMap();
  // Indicators waiting for the next batch tick.
  const pendingQueue = new Set();

  ns.settings.get().then((settings) => {
    currentSettings = settings;
    if (!settings.enabled) return;
    install();
  });

  ns.settings.onChange((next) => {
    const wasEnabled = !!(currentSettings && currentSettings.enabled);
    currentSettings = next;
    if (next.enabled && !wasEnabled) {
      install();
    } else if (!next.enabled && wasEnabled) {
      uninstall();
    } else if (next.enabled) {
      ns.api.clearCache();
      reprocessAll();
    }
  });

  function install() {
    visibilityObserver = new IntersectionObserver(handleVisibilityChanges, {
      root: null,
      rootMargin: "200px",
      threshold: 0,
    });

    mutationObserver = new MutationObserver(handleMutations);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    scanAndRegister(document);
  }

  function uninstall() {
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    if (visibilityObserver) {
      visibilityObserver.disconnect();
      visibilityObserver = null;
    }
    if (scheduleTimer != null) {
      clearTimeout(scheduleTimer);
      scheduleTimer = null;
    }
    pendingQueue.clear();
    observedIndicators = new WeakSet();
    scheduled = new WeakMap();
    indicatorKeys = new WeakMap();
    document
      .querySelectorAll(`.${ns.dots.HIDDEN_CLASS}`)
      .forEach((el) => ns.dots.resetIndicator(el));
    document.querySelectorAll(`.${ns.dots.DOTS_CLASS}`).forEach((el) => el.remove());
  }

  function handleMutations(records) {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        scanAndRegister(node.parentNode || node);
      }
    }
  }

  function scanAndRegister(root) {
    const items = ns.dots.findIndicators(root);
    for (const item of items) {
      registerIndicator(item);
    }
  }

  function registerIndicator({ indicator, issueKey }) {
    if (observedIndicators.has(indicator)) return;
    observedIndicators.add(indicator);
    indicatorKeys.set(indicator, issueKey);
    if (visibilityObserver) {
      visibilityObserver.observe(indicator);
    } else {
      enqueue(indicator);
    }
  }

  function handleVisibilityChanges(entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        enqueue(entry.target);
      }
    }
  }

  function enqueue(indicator) {
    if (!indicator.isConnected) return;
    const last = scheduled.get(indicator);
    const now = Date.now();
    if (last && now - last < SCHEDULE_DEDUPE_MS) return;
    scheduled.set(indicator, now);
    pendingQueue.add(indicator);
    flushSoon();
  }

  function flushSoon() {
    if (scheduleTimer != null) return;
    scheduleTimer = setTimeout(flushBatch, 100);
  }

  async function flushBatch() {
    scheduleTimer = null;
    if (!currentSettings || !currentSettings.enabled) {
      pendingQueue.clear();
      return;
    }
    const batch = Array.from(pendingQueue);
    pendingQueue.clear();
    const chunkSize = 8;
    for (let i = 0; i < batch.length; i += chunkSize) {
      const chunk = batch.slice(i, i + chunkSize);
      await Promise.all(chunk.map(processIndicator));
    }
  }

  async function processIndicator(indicator) {
    if (!indicator || !indicator.isConnected) return;
    const settings = currentSettings;
    if (!settings || !settings.enabled) return;

    const issueKey = indicatorKeys.get(indicator);
    if (!issueKey) return;

    let info;
    try {
      info = await ns.api.getIssueAging(issueKey, { ttlMs: settings.cacheTtlMs });
    } catch (err) {
      // Leave the native indicator alone if the API is unavailable.
      return;
    }

    if (!info || !info.statusCategory || !info.statusEnteredAt) return;

    if (settings.hiddenStatusCategories.includes(info.statusCategory)) {
      ns.dots.applyDecision(indicator, { hide: true }, settings);
      return;
    }

    const days = ns.workdays.countWorkingDays(
      info.statusEnteredAt,
      new Date(),
      settings.workingDays
    );
    ns.dots.applyDecision(indicator, { count: days }, settings);
  }

  function reprocessAll() {
    document
      .querySelectorAll(`.${ns.dots.HIDDEN_CLASS}, .${ns.dots.DOTS_CLASS}`)
      .forEach((el) => {
        if (el.classList.contains(ns.dots.HIDDEN_CLASS)) {
          ns.dots.resetIndicator(el);
        } else {
          el.remove();
        }
      });
    scanAndRegister(document);
    // Re-enqueue any known indicators that are still in the DOM.
    document
      .querySelectorAll(ns.dots.NATIVE_INDICATOR_SELECTORS.join(","))
      .forEach((el) => {
        if (observedIndicators.has(el)) enqueue(el);
      });
  }
})();
