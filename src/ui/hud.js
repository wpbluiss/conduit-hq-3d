/**
 * HUD Overlay -- top-right corner, always visible
 * Shows live business metrics from Supabase
 */
import { fetchHUDMetrics } from '../data/supabase.js';

let floorNameEl = null;

export function updateFloorName(name) {
  if (floorNameEl) {
    floorNameEl.textContent = name;
  }
}

export function createHUD() {
  const container = document.createElement('div');
  container.id = 'hud-overlay';
  container.style.cssText = `
    position: fixed;
    top: 12px;
    right: 12px;
    padding: 14px 18px;
    background: rgba(10, 11, 16, 0.8);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 10px;
    z-index: 50;
    pointer-events: none;
    font-family: 'Courier New', 'Consolas', monospace;
    font-size: 0.8rem;
    line-height: 1.8;
    backdrop-filter: blur(6px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    min-width: 180px;
  `;
  document.body.appendChild(container);

  const stats = [
    { id: 'clients',  label: 'Clients',     value: '...',  color: '#8b5cf6' },
    { id: 'messages', label: 'Msgs Today',   value: '...',  color: '#3b82f6' },
    { id: 'tasks',    label: 'Tasks Done',   value: '...',  color: '#10b981' },
    { id: 'pipeline', label: 'Pipeline',     value: '...',  color: '#eab308' },
    { id: 'agents',   label: 'Agents',       value: '32',   color: '#8b5cf6' },
  ];

  const valueEls = {};

  stats.forEach(({ id, label, value, color }) => {
    const row = document.createElement('div');
    row.style.cssText = `display: flex; justify-content: space-between; gap: 20px;`;

    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    labelEl.style.cssText = `color: #64748b; font-weight: 400;`;

    const valueEl = document.createElement('span');
    valueEl.textContent = value;
    valueEl.style.cssText = `color: ${color}; font-weight: 700;`;

    row.appendChild(labelEl);
    row.appendChild(valueEl);
    container.appendChild(row);

    valueEls[id] = valueEl;
  });

  // Floor name display
  const floorRow = document.createElement('div');
  floorRow.style.cssText = `
    margin-top: 8px; padding-top: 8px;
    border-top: 1px solid rgba(139, 92, 246, 0.2);
    color: #8b5cf6; font-weight: 600; font-size: 0.75rem;
    letter-spacing: 0.04em;
  `;
  floorRow.textContent = 'Lobby';
  container.appendChild(floorRow);
  floorNameEl = floorRow;

  // Live status indicator
  const statusRow = document.createElement('div');
  statusRow.style.cssText = `
    margin-top: 4px;
    display: flex; align-items: center; gap: 6px;
    font-size: 0.65rem; color: #475569;
  `;
  const statusDot = document.createElement('span');
  statusDot.style.cssText = `
    width: 6px; height: 6px; border-radius: 50%;
    background: #475569; display: inline-block;
  `;
  const statusText = document.createElement('span');
  statusText.textContent = 'Connecting...';
  statusRow.appendChild(statusDot);
  statusRow.appendChild(statusText);
  container.appendChild(statusRow);

  function formatNumber(n) {
    if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'k';
    if (n > 0) return '$' + n.toFixed(0);
    return '$0';
  }

  async function refreshData() {
    try {
      const metrics = await fetchHUDMetrics();
      if (metrics) {
        valueEls.clients.textContent = String(metrics.activeClients);
        valueEls.messages.textContent = String(metrics.messagesToday);
        valueEls.tasks.textContent = String(metrics.tasksDoneToday);
        valueEls.pipeline.textContent = formatNumber(metrics.pipelineTotal);
        // Green dot = connected
        statusDot.style.background = '#10b981';
        statusDot.style.boxShadow = '0 0 6px rgba(16,185,129,0.5)';
        statusText.textContent = 'Live';
      }
    } catch (e) {
      statusDot.style.background = '#ef4444';
      statusText.textContent = 'Offline';
    }
  }

  // Initial fetch
  refreshData();
  // Refresh every 60 seconds
  setInterval(refreshData, 60000);

  return { element: container };
}
