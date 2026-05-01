// Native-indicator-first detection + replacement.
// Exposed at window.BJD.dots.
//
// Strategy: we only act on DOM elements that Jira already rendered as an
// aging indicator. We never render dots on cards/rows that don't already
// have one — so epics, headers, and other non-card UI are untouched.

(function () {
  "use strict";

  const NATIVE_INDICATOR_SELECTORS = [
    '[data-testid*="aging-indicator"]',
    '[data-testid*="aging-indicators"]',
    '[aria-label*="days in column" i]',
    '[aria-label*="days in this column" i]',
  ];

  const ISSUE_KEY_REGEX = /\/browse\/([A-Z][A-Z0-9_]+-\d+)/;
  const HIDDEN_CLASS = "bjd-hidden-native";
  const DOTS_CLASS = "bjd-dots";
  const KEY_ATTR = "data-bjd-key";

  // Returns array of { indicator, issueKey } for every native indicator we
  // can resolve to an issue key. Anything we can't resolve is skipped.
  function findIndicators(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const out = [];
    const seen = new Set();
    for (const sel of NATIVE_INDICATOR_SELECTORS) {
      let nodes;
      try { nodes = scope.querySelectorAll(sel); } catch { continue; }
      for (const node of nodes) {
        if (seen.has(node)) continue;
        if (node.classList && node.classList.contains(DOTS_CLASS)) continue;
        seen.add(node);
        const issueKey = findIssueKeyForElement(node);
        if (!issueKey) continue;
        out.push({ indicator: node, issueKey });
      }
    }
    return out;
  }

  function findIssueKeyForElement(el) {
    let cursor = el;
    let steps = 0;
    while (cursor && steps < 20) {
      if (cursor.querySelector) {
        const link = cursor.querySelector('a[href*="/browse/"]');
        if (link) {
          const m = ISSUE_KEY_REGEX.exec(link.getAttribute("href") || "");
          if (m) return m[1];
        }
        // Some boards expose the key via a data attribute on the card root.
        if (cursor.getAttribute) {
          const attr = cursor.getAttribute("data-issue-key");
          if (attr && /^[A-Z][A-Z0-9_]+-\d+$/.test(attr)) return attr;
        }
      }
      cursor = cursor.parentElement;
      steps++;
    }
    return null;
  }

  // decision: { hide: true } to suppress, or { count: number } to replace.
  function applyDecision(indicator, decision, settings) {
    if (!indicator || !indicator.parentNode) return;

    if (decision && decision.hide) {
      indicator.classList.add(HIDDEN_CLASS);
      removeReplacement(indicator);
      return;
    }

    indicator.classList.add(HIDDEN_CLASS);
    const replacement = ensureReplacement(indicator);
    renderDotsInto(replacement, decision.count);
  }

  function ensureReplacement(indicator) {
    const next = indicator.nextElementSibling;
    if (next && next.classList && next.classList.contains(DOTS_CLASS)) {
      return next;
    }
    const span = document.createElement("span");
    span.className = DOTS_CLASS;
    span.setAttribute("aria-hidden", "true");
    indicator.parentNode.insertBefore(span, indicator.nextSibling);
    return span;
  }

  function removeReplacement(indicator) {
    const next = indicator.nextElementSibling;
    if (next && next.classList && next.classList.contains(DOTS_CLASS)) {
      next.remove();
    }
  }

  function renderDotsInto(container, count) {
    container.dataset.count = String(count);
    container.title = formatTooltip(count);

    const pattern = getDotPattern(count);
    if (pattern.length === 0) {
      container.replaceChildren();
      container.style.display = "none";
      return;
    }
    container.style.display = "";
    container.innerHTML = pattern
      .map((color) => `<span class="bjd-dot bjd-dot--${color}"></span>`)
      .join("");
  }

  // Returns dot tokens ("grey", "red") matching Jira's documented days-in-column
  // progression: 1d=1g, 2d=2g, 3d=3g, 5d=4g, 8d=2g+2r, 12d=1g+3r, 20+d=4r.
  // Reds appear on the left (oldest dot escalates first).
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

  function resetIndicator(indicator) {
    if (!indicator) return;
    if (indicator.classList) indicator.classList.remove(HIDDEN_CLASS);
    removeReplacement(indicator);
    if (indicator.removeAttribute) indicator.removeAttribute(KEY_ATTR);
  }

  function formatTooltip(count) {
    if (count <= 0) return "Just entered this status";
    return `${count} working day${count === 1 ? "" : "s"} in this status`;
  }

  const ns = (window.BJD = window.BJD || {});
  ns.dots = {
    findIndicators,
    findIssueKeyForElement,
    applyDecision,
    resetIndicator,
    NATIVE_INDICATOR_SELECTORS,
    HIDDEN_CLASS,
    DOTS_CLASS,
    KEY_ATTR,
  };
})();
