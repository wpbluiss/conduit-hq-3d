/**
 * Receptionist check-in panel — interactive UI with floor directory,
 * elevator shortcut, and activity summary.
 */

const FLOOR_DIRECTORY = [
  { num: '1',  name: 'Lobby',        desc: 'Reception & Main Entrance', color: '#3b82f6' },
  { num: '2',  name: 'Sales',        desc: 'Pipeline Management & Deal Closing', color: '#3b82f6' },
  { num: '3',  name: 'Marketing',    desc: 'Campaign Strategy & Brand Growth', color: '#10b981' },
  { num: '4',  name: 'Engineering',  desc: 'Product Development & Infrastructure', color: '#f97316' },
  { num: '5',  name: 'Content',      desc: 'Creative Production & Publishing', color: '#ec4899' },
  { num: '6',  name: 'Intelligence', desc: 'Data Analytics & Market Research', color: '#eab308' },
  { num: '7',  name: 'Operations',   desc: 'Finance, Billing & Business Ops', color: '#6B7B3A' },
  { num: '8',  name: 'Monitoring',   desc: 'System Health & Incident Response', color: '#ef4444' },
  { num: '15', name: 'CEO Suite',    desc: 'Executive Office & Board Room', color: '#8b5cf6' },
];

export function createReceptionPanel(goToFloorCallback) {
  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.6); display: none; z-index: 240;
    backdrop-filter: blur(4px);
  `;
  document.body.appendChild(backdrop);

  // Panel container
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 420px; max-height: 85vh; overflow-y: auto;
    background: rgba(10,11,16,0.97);
    border: 2px solid rgba(6,182,212,0.5);
    border-radius: 16px; padding: 0;
    display: none; z-index: 241;
    box-shadow: 0 8px 48px rgba(0,0,0,0.7), 0 0 40px rgba(6,182,212,0.1);
    font-family: 'Segoe UI', system-ui, sans-serif;
  `;
  document.body.appendChild(panel);

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 24px 28px 16px; border-bottom: 1px solid rgba(6,182,212,0.2);
  `;
  header.innerHTML = `
    <div style="font-size: 11px; color: #06b6d4; letter-spacing: 0.2em; font-weight: 600; margin-bottom: 6px;">RECEPTION DESK</div>
    <div style="font-size: 20px; color: #e2e8f0; font-weight: 600;">Welcome, Mr. Garcia</div>
    <div style="font-size: 13px; color: #64748b; margin-top: 4px;">How can I help you today?</div>
  `;
  panel.appendChild(header);

  // Button container
  const btnBox = document.createElement('div');
  btnBox.style.cssText = `padding: 16px 28px; display: flex; flex-direction: column; gap: 8px;`;
  panel.appendChild(btnBox);

  // Content area (for sub-views)
  const contentArea = document.createElement('div');
  contentArea.style.cssText = `padding: 0 28px 20px; display: none;`;
  panel.appendChild(contentArea);

  let _open = false;
  let currentView = 'menu';

  function makeBtn(label, icon, onClick) {
    const btn = document.createElement('button');
    btn.innerHTML = `<span style="margin-right:10px">${icon}</span> ${label}`;
    btn.style.cssText = `
      padding: 14px 18px; background: rgba(30,30,45,0.8);
      border: 1px solid rgba(6,182,212,0.2); border-radius: 10px;
      color: #e2e8f0; font-size: 14px; font-weight: 500;
      cursor: pointer; transition: all 0.15s; font-family: inherit;
      text-align: left; display: flex; align-items: center;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(6,182,212,0.15)';
      btn.style.borderColor = '#06b6d4';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(30,30,45,0.8)';
      btn.style.borderColor = 'rgba(6,182,212,0.2)';
    });
    btn.addEventListener('click', onClick);
    return btn;
  }

  function showMenu() {
    currentView = 'menu';
    btnBox.style.display = 'flex';
    contentArea.style.display = 'none';
    btnBox.innerHTML = '';

    btnBox.appendChild(makeBtn('View Floor Directory', '🏢', showDirectory));
    btnBox.appendChild(makeBtn('Go to my office', '🔑', () => {
      close();
      if (goToFloorCallback) goToFloorCallback(15); // CEO Suite
    }));
    btnBox.appendChild(makeBtn("View today's activity", '📊', showActivity));
  }

  function showDirectory() {
    currentView = 'directory';
    btnBox.style.display = 'none';
    contentArea.style.display = 'block';
    contentArea.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back';
    backBtn.style.cssText = `
      background: none; border: none; color: #06b6d4; font-size: 13px;
      cursor: pointer; font-family: inherit; margin-bottom: 12px; padding: 0;
    `;
    backBtn.addEventListener('click', showMenu);
    contentArea.appendChild(backBtn);

    const title = document.createElement('div');
    title.textContent = 'FLOOR DIRECTORY';
    title.style.cssText = `font-size: 11px; color: #64748b; letter-spacing: 0.15em; font-weight: 600; margin-bottom: 12px;`;
    contentArea.appendChild(title);

    for (const floor of FLOOR_DIRECTORY) {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex; align-items: center; gap: 12px;
        padding: 10px 12px; border-radius: 8px;
        border-left: 3px solid ${floor.color};
        background: rgba(30,30,45,0.5); margin-bottom: 6px;
      `;
      row.innerHTML = `
        <div style="min-width:28px; font-size:16px; font-weight:700; color:${floor.color}">${floor.num}</div>
        <div>
          <div style="font-size:14px; color:#e2e8f0; font-weight:600">${floor.name}</div>
          <div style="font-size:11px; color:#64748b">${floor.desc}</div>
        </div>
      `;
      contentArea.appendChild(row);
    }
  }

  function showActivity() {
    currentView = 'activity';
    btnBox.style.display = 'none';
    contentArea.style.display = 'block';
    contentArea.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.textContent = '← Back';
    backBtn.style.cssText = `
      background: none; border: none; color: #06b6d4; font-size: 13px;
      cursor: pointer; font-family: inherit; margin-bottom: 12px; padding: 0;
    `;
    backBtn.addEventListener('click', showMenu);
    contentArea.appendChild(backBtn);

    const title = document.createElement('div');
    title.textContent = "TODAY'S ACTIVITY";
    title.style.cssText = `font-size: 11px; color: #64748b; letter-spacing: 0.15em; font-weight: 600; margin-bottom: 12px;`;
    contentArea.appendChild(title);

    const activities = [
      { time: '9:15 AM', text: 'Diana generated weekly revenue report', icon: '📊' },
      { time: '9:32 AM', text: 'Hunter qualified new enterprise lead', icon: '📈' },
      { time: '10:01 AM', text: 'Byte merged PR #847 — performance fix', icon: '✅' },
      { time: '10:18 AM', text: 'Nova launched social campaign #42', icon: '🎯' },
      { time: '10:45 AM', text: 'Sage published "AI in Sales" blog post', icon: '📝' },
      { time: '11:02 AM', text: 'Otto reconciled monthly accounts', icon: '📊' },
      { time: '11:30 AM', text: 'JARVIS resolved 3 support tickets', icon: '🤖' },
      { time: '11:55 AM', text: 'Kai deployed website update', icon: '🔧' },
    ];

    for (const act of activities) {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex; align-items: flex-start; gap: 10px;
        padding: 8px 0; border-bottom: 1px solid rgba(100,116,139,0.1);
      `;
      row.innerHTML = `
        <span style="font-size:14px">${act.icon}</span>
        <div>
          <div style="font-size:13px; color:#e2e8f0">${act.text}</div>
          <div style="font-size:11px; color:#475569; margin-top:2px">${act.time}</div>
        </div>
      `;
      contentArea.appendChild(row);
    }
  }

  function open() {
    _open = true;
    panel.style.display = 'block';
    backdrop.style.display = 'block';
    document.exitPointerLock();
    showMenu();
  }

  function close() {
    _open = false;
    panel.style.display = 'none';
    backdrop.style.display = 'none';
  }

  function isOpen() { return _open; }

  // ESC or E to close
  document.addEventListener('keydown', (e) => {
    if ((e.code === 'Escape' || e.code === 'KeyE') && _open) {
      close();
    }
  });
  backdrop.addEventListener('click', close);

  // Close hint
  const hint = document.createElement('div');
  hint.textContent = 'Press E or ESC to close';
  hint.style.cssText = `
    color: #4b5563; font-size: 11px; text-align: center;
    padding: 12px 28px 20px; letter-spacing: 0.1em;
  `;
  panel.appendChild(hint);

  return { open, close, isOpen };
}
