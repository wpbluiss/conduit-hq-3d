/**
 * Notification toast system — periodic activity updates
 * that slide in from the right, stack up to 3, and auto-dismiss.
 */

const NOTIFICATIONS = [
  '📊 Diana generated weekly revenue report',
  '📞 Ava answered inbound call from +1 (561) 555-0147',
  '✉️ Nina sent 5 outreach emails',
  '💰 Marcus moved deal to "Proposal" stage',
  '🔧 Kai deployed website update',
  '📈 Hunter qualified new enterprise lead',
  '🎯 Nova launched social campaign #42',
  '📝 Sage published "AI in Sales" blog post',
  '🤖 JARVIS resolved 3 support tickets',
  '📊 Otto reconciled monthly accounts',
  '📞 Rex completed client onboarding call',
  '✅ Byte merged PR #847 — performance fix',
  '📋 Demo prepared pitch deck for Arturo',
  '🔔 Watchdog detected pricing anomaly — resolved',
  '💬 Reply drafted follow-up for Smith Corp',
  '📊 Forecast updated: Q2 target on track',
  '🎨 Content team uploaded 3 new graphics',
  '📧 Closer sent 12 personalized proposals',
  '🔍 Intel analyzed 5 competitor updates',
  '⚡ Ops automated invoice workflow',
];

export function createNotifications() {
  const container = document.createElement('div');
  container.id = 'notif-container';
  container.style.cssText = `
    position: fixed; bottom: 16px; right: 16px;
    display: flex; flex-direction: column-reverse; gap: 8px;
    z-index: 80; pointer-events: none;
    max-width: 380px;
  `;
  document.body.appendChild(container);

  const activeToasts = [];
  let lastTime = 0;
  let nextInterval = 8 + Math.random() * 12; // first one sooner
  let usedIndices = new Set();

  function pickNotification() {
    if (usedIndices.size >= NOTIFICATIONS.length) usedIndices.clear();
    let idx;
    do {
      idx = Math.floor(Math.random() * NOTIFICATIONS.length);
    } while (usedIndices.has(idx));
    usedIndices.add(idx);
    return NOTIFICATIONS[idx];
  }

  function showToast(text) {
    // Limit to 3 visible
    while (activeToasts.length >= 3) {
      const oldest = activeToasts.shift();
      if (oldest.el.parentNode) oldest.el.remove();
    }

    const el = document.createElement('div');
    el.style.cssText = `
      padding: 10px 16px;
      background: rgba(10,11,16,0.9);
      border: 1px solid rgba(59,130,246,0.3);
      border-radius: 8px;
      color: #e2e8f0;
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 13px;
      line-height: 1.4;
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      transform: translateX(120%);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s;
      opacity: 1;
      pointer-events: none;
    `;
    el.textContent = text;
    container.appendChild(el);

    // Slide in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transform = 'translateX(0)';
      });
    });

    const toast = { el, born: performance.now() };
    activeToasts.push(toast);

    // Auto dismiss after 3s
    setTimeout(() => {
      el.style.transform = 'translateX(120%)';
      el.style.opacity = '0';
      setTimeout(() => {
        if (el.parentNode) el.remove();
        const idx = activeToasts.indexOf(toast);
        if (idx >= 0) activeToasts.splice(idx, 1);
      }, 400);
    }, 3000);
  }

  function update(time) {
    if (time - lastTime > nextInterval) {
      lastTime = time;
      nextInterval = 20 + Math.random() * 10; // 20-30s
      showToast(pickNotification());
    }
  }

  return { update, showToast };
}
