// Jira REST API helpers + caching. Exposed at window.BJD.api.
// Uses the user's existing Jira session cookies (same-origin fetch).

(function () {
  "use strict";

  // Cache shape: { [key]: { fetchedAt: number, value: IssueInfo, error: any|null } }
  const cache = new Map();
  // In-flight requests, keyed by issue key, deduped to avoid bursts on the same card.
  const inflight = new Map();

  // Returns { statusCategory: "new"|"indeterminate"|"done", statusEnteredAt: Date, statusName: string }
  // or rejects with an error.
  async function getIssueAging(issueKey, { ttlMs = 5 * 60 * 1000 } = {}) {
    if (!issueKey) throw new Error("issueKey required");

    const now = Date.now();
    const cached = cache.get(issueKey);
    if (cached && now - cached.fetchedAt < ttlMs && !cached.error) {
      return cached.value;
    }

    if (inflight.has(issueKey)) {
      return inflight.get(issueKey);
    }

    const promise = fetchIssue(issueKey)
      .then((value) => {
        cache.set(issueKey, { fetchedAt: Date.now(), value, error: null });
        return value;
      })
      .catch((err) => {
        // Cache failures briefly so we don't hammer on a 404 or auth issue.
        cache.set(issueKey, { fetchedAt: Date.now(), value: null, error: err });
        throw err;
      })
      .finally(() => {
        inflight.delete(issueKey);
      });

    inflight.set(issueKey, promise);
    return promise;
  }

  async function fetchIssue(issueKey) {
    const url = `/rest/api/3/issue/${encodeURIComponent(issueKey)}?expand=changelog&fields=status,created`;
    const response = await fetch(url, {
      method: "GET",
      credentials: "same-origin",
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Jira API ${response.status} for ${issueKey}`);
    }

    const data = await response.json();
    return parseIssue(data);
  }

  function parseIssue(data) {
    const status = data && data.fields && data.fields.status;
    const statusCategory = status && status.statusCategory && status.statusCategory.key;
    const statusName = status && status.name ? String(status.name) : "";

    const histories = data && data.changelog && Array.isArray(data.changelog.histories)
      ? data.changelog.histories
      : [];

    let lastStatusChange = null;
    for (const h of histories) {
      if (!h || !Array.isArray(h.items)) continue;
      const hasStatusItem = h.items.some((it) => it && it.field === "status");
      if (!hasStatusItem) continue;
      const ts = h.created ? new Date(h.created) : null;
      if (!ts || isNaN(ts.getTime())) continue;
      if (!lastStatusChange || ts > lastStatusChange) lastStatusChange = ts;
    }

    // Fall back to issue creation if there's never been a status change.
    if (!lastStatusChange && data.fields && data.fields.created) {
      const created = new Date(data.fields.created);
      if (!isNaN(created.getTime())) lastStatusChange = created;
    }

    return {
      statusCategory: statusCategory || null,
      statusName,
      statusEnteredAt: lastStatusChange,
    };
  }

  function clearCache() {
    cache.clear();
    inflight.clear();
  }

  const ns = (window.BJD = window.BJD || {});
  ns.api = { getIssueAging, clearCache };
})();
