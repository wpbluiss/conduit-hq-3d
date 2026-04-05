export function createElevatorPanel() {
  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.id = 'elevator-backdrop';
  backdrop.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: none; z-index: 200;
    backdrop-filter: blur(4px);
  `;
  document.body.appendChild(backdrop);

  // Panel
  const panel = document.createElement('div');
  panel.id = 'elevator-panel';
  panel.style.cssText = `
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 340px;
    max-height: 80vh;
    overflow-y: auto;
    background: #0a0b10;
    border: 1px solid rgba(139, 92, 246, 0.4);
    border-radius: 16px;
    padding: 28px;
    display: none;
    z-index: 201;
    box-shadow: 0 8px 48px rgba(0, 0, 0, 0.7), 0 0 60px rgba(139, 92, 246, 0.1);
    font-family: 'Segoe UI', system-ui, sans-serif;
  `;
  document.body.appendChild(panel);

  // Title
  const title = document.createElement('div');
  title.textContent = 'SELECT FLOOR';
  title.style.cssText = `
    color: #94a3b8; font-size: 0.75rem; letter-spacing: 0.2em;
    text-align: center; margin-bottom: 20px; font-weight: 600;
  `;
  panel.appendChild(title);

  // Floor definitions (top to bottom)
  const floors = [
    { id: 'ceo',          label: 'CEO Suite',    floor: 15, y: 400, num: '15' },
    { id: 'monitoring',   label: 'Monitoring',   floor: 8,  y: 350, num: '8' },
    { id: 'operations',   label: 'Operations',   floor: 7,  y: 300, num: '7' },
    { id: 'intelligence', label: 'Intelligence', floor: 6,  y: 250, num: '6' },
    { id: 'content',      label: 'Content',      floor: 5,  y: 200, num: '5' },
    { id: 'engineering',  label: 'Engineering',  floor: 4,  y: 150, num: '4' },
    { id: 'marketing',    label: 'Marketing',    floor: 3,  y: 100, num: '3' },
    { id: 'sales',        label: 'Sales',        floor: 2,  y: 50,  num: '2' },
    { id: 'lobby',        label: 'Lobby',        floor: 1,  y: 0,   num: '1' },
  ];

  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = `display: flex; flex-direction: column; gap: 6px;`;
  panel.appendChild(btnContainer);

  let onSelectCallback = null;
  const btnMap = {};

  floors.forEach(({ label, floor, num }) => {
    const btn = document.createElement('button');
    btn.innerHTML = `<span style="color:#8b5cf6;font-weight:700;min-width:24px;display:inline-block">${num}</span> <span>${label}</span>`;
    btn.style.cssText = `
      padding: 12px 18px;
      background: rgba(30, 30, 45, 0.8);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 10px;
      color: #e2e8f0;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      font-family: inherit;
      text-align: left;
      letter-spacing: 0.04em;
      display: flex; align-items: center; gap: 12px;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(139, 92, 246, 0.2)';
      btn.style.borderColor = '#8b5cf6';
      btn.style.boxShadow = '0 0 15px rgba(59,130,246,0.15)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'rgba(30, 30, 45, 0.8)';
      btn.style.borderColor = 'rgba(139, 92, 246, 0.2)';
      btn.style.boxShadow = 'none';
    });
    btn.addEventListener('click', () => {
      if (onSelectCallback) onSelectCallback(floor);
      close();
    });
    btnContainer.appendChild(btn);
    btnMap[floor] = btn;
  });

  // Close hint
  const hint = document.createElement('div');
  hint.textContent = 'ESC to cancel';
  hint.style.cssText = `
    color: #4b5563; font-size: 0.7rem; text-align: center;
    margin-top: 16px; letter-spacing: 0.1em;
  `;
  panel.appendChild(hint);

  function open(onSelect) {
    onSelectCallback = onSelect;
    panel.style.display = 'block';
    backdrop.style.display = 'block';
    document.exitPointerLock();
  }

  function close() {
    panel.style.display = 'none';
    backdrop.style.display = 'none';
    onSelectCallback = null;
  }

  // ESC to close
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && panel.style.display === 'block') {
      close();
    }
  });

  backdrop.addEventListener('click', close);

  return { open, close, isOpen: () => panel.style.display === 'block' };
}
