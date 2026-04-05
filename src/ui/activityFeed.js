/**
 * Activity Feed Overlay -- left side of screen
 * Press F to toggle. Shows real agent activity from Supabase.
 * Auto-refreshes every 30 seconds + realtime updates.
 */
import { fetchRecentActivity, onActivityChange, onTaskChange, resolveAgentName } from '../data/supabase.js';

export function createActivityFeed() {
  let isOpen = false;
  let refreshTimer = null;

  // Container
  const container = document.createElement('div');
  container.id = 'activity-feed';
  container.style.cssText = `
    position: fixed;
    top: 60px;
    left: 12px;
    width: 340px;
    max-height: calc(100vh - 120px);
    background: rgba(10, 11, 16, 0.88);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: 10px;
    display: none;
    flex-direction: column;
    z-index: 60;
    font-family: 'Segoe UI', system-ui, sans-serif;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    overflow: hidden;
  `;
  document.body.appendChild(container);

  // Inject slide-in animation
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes feed-slide-in {
      from { opacity: 0; transform: translateY(-20px); max-height: 0; }
      to { opacity: 1; transform: translateY(0); max-height: 120px; }
    }
    .feed-entry-new {
      animation: feed-slide-in 0.4s ease-out;
    }
  `;
  document.head.appendChild(styleEl);

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 12px 16px;
    background: rgba(16, 185, 129, 0.1);
    border-bottom: 1px solid rgba(16, 185, 129, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  `;
  container.appendChild(header);

  const title = document.createElement('div');
  title.innerHTML = '<span style="color:#10b981;font-weight:700;font-size:0.85rem;">LIVE ACTIVITY</span> <span style="color:#64748b;font-size:0.7rem;margin-left:8px;">Press F to close</span>';
  header.appendChild(title);

  const statusDot = document.createElement('span');
  statusDot.style.cssText = `
    width: 8px; height: 8px; border-radius: 50%;
    background: #10b981; display: inline-block;
    box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
  `;
  header.appendChild(statusDot);

  // Entries area
  const entriesEl = document.createElement('div');
  entriesEl.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
  `;
  container.appendChild(entriesEl);

  function formatTime(isoString) {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffMs = now - d;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  function createEntryEl(entry, animate = false) {
    const row = document.createElement('div');
    row.style.cssText = `
      padding: 10px 8px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      transition: background 0.15s;
    `;
    if (animate) row.className = 'feed-entry-new';

    const topLine = document.createElement('div');
    topLine.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;';

    const agentName = document.createElement('span');
    agentName.textContent = entry.agent_name || 'Unknown';
    agentName.style.cssText = 'color: #3b82f6; font-weight: 600; font-size: 0.8rem;';

    const time = document.createElement('span');
    time.textContent = formatTime(entry.created_at);
    time.style.cssText = 'color: #475569; font-size: 0.7rem; font-family: monospace;';

    topLine.appendChild(agentName);
    topLine.appendChild(time);

    const action = document.createElement('div');
    action.textContent = entry.action || '';
    action.style.cssText = 'color: #10b981; font-size: 0.75rem; font-weight: 500; margin-bottom: 2px;';

    const details = document.createElement('div');
    const detailText = entry.details || '';
    details.textContent = detailText.length > 120 ? detailText.substring(0, 120) + '...' : detailText;
    details.style.cssText = 'color: #94a3b8; font-size: 0.72rem; line-height: 1.4;';

    row.appendChild(topLine);
    row.appendChild(action);
    if (detailText) row.appendChild(details);
    return row;
  }

  function renderEntries(activities) {
    entriesEl.innerHTML = '';

    if (!activities || activities.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'color: #64748b; font-size: 0.8rem; padding: 20px 0; text-align: center;';
      empty.textContent = 'No recent activity';
      entriesEl.appendChild(empty);
      return;
    }

    activities.forEach((entry) => {
      entriesEl.appendChild(createEntryEl(entry, false));
    });
  }

  /** Prepend a new realtime entry at the top with slide-in animation */
  function prependEntry(entry) {
    if (!isOpen) return;
    const el = createEntryEl(entry, true);
    entriesEl.insertBefore(el, entriesEl.firstChild);
    // Limit visible entries to 20
    while (entriesEl.children.length > 20) {
      entriesEl.removeChild(entriesEl.lastChild);
    }
  }

  async function refresh() {
    const data = await fetchRecentActivity(15);
    renderEntries(data);
  }

  // Realtime subscriptions
  onActivityChange((data) => {
    prependEntry({
      agent_name: data.agentName,
      action: data.action,
      details: data.description,
      created_at: data.createdAt,
    });
  });

  onTaskChange((data) => {
    if (data.status === 'completed') {
      prependEntry({
        agent_name: data.agentName,
        action: `completed: ${data.title}`,
        details: `Task type: ${data.taskType}`,
        created_at: data.completedAt || data.createdAt,
      });
    }
  });

  function show() {
    if (isOpen) return;
    isOpen = true;
    container.style.display = 'flex';
    refresh();
    refreshTimer = setInterval(refresh, 30000);
  }

  function hide() {
    if (!isOpen) return;
    isOpen = false;
    container.style.display = 'none';
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function toggle() {
    if (isOpen) hide(); else show();
  }

  // Listen for F key
  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      toggle();
    }
  });

  return { show, hide, toggle, isOpen: () => isOpen };
}
