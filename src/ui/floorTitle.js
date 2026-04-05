/**
 * Floor Title — cinematic department name that fades in/out on elevator arrival.
 * "FLOOR 2 — SALES DEPARTMENT"
 */

export function createFloorTitle() {
  const el = document.createElement('div');
  el.id = 'floor-title';
  el.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center; flex-direction: column;
    pointer-events: none; z-index: 150;
    opacity: 0; transition: opacity 0.5s ease;
  `;
  document.body.appendChild(el);

  const floorNum = document.createElement('div');
  floorNum.style.cssText = `
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 56px; font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    text-shadow: 0 0 40px currentColor, 0 2px 20px rgba(0,0,0,0.5);
  `;
  el.appendChild(floorNum);

  const deptName = document.createElement('div');
  deptName.style.cssText = `
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 22px; font-weight: 400;
    letter-spacing: 0.12em;
    margin-top: 8px;
    text-transform: uppercase;
    opacity: 0.7;
    color: #94a3b8;
  `;
  el.appendChild(deptName);

  // Decorative line
  const line = document.createElement('div');
  line.style.cssText = `
    width: 80px; height: 2px; margin-top: 16px;
    transition: width 0.6s ease, background 0.3s;
  `;
  el.appendChild(line);

  let hideTimer = null;

  /**
   * Show the floor title.
   * @param {number} floor - Floor number (1-15)
   * @param {string} department - Department name
   * @param {string} accentColor - CSS color for accent (hex string like '#3b82f6')
   */
  function show(floor, department, accentColor = '#3b82f6') {
    if (hideTimer) clearTimeout(hideTimer);

    floorNum.textContent = `Floor ${floor}`;
    floorNum.style.color = accentColor;
    deptName.textContent = `${department} Department`;
    line.style.background = accentColor;
    line.style.width = '0px';

    // Fade in
    el.style.opacity = '1';

    // Animate line
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        line.style.width = '80px';
      });
    });

    // Hold 2s, then fade out
    hideTimer = setTimeout(() => {
      el.style.opacity = '0';
      hideTimer = null;
    }, 2500);
  }

  return { show };
}

// Map floor Y positions to display info
export const FLOOR_DISPLAY = {
  0:   { floor: 1,  department: 'Lobby',        accent: '#8b5cf6' },
  50:  { floor: 2,  department: 'Sales',         accent: '#3b82f6' },
  100: { floor: 3,  department: 'Marketing',     accent: '#10b981' },
  150: { floor: 4,  department: 'Engineering',   accent: '#f97316' },
  200: { floor: 5,  department: 'Content',       accent: '#ec4899' },
  250: { floor: 6,  department: 'Intelligence',  accent: '#06b6d4' },
  300: { floor: 7,  department: 'Operations',    accent: '#eab308' },
  350: { floor: 8,  department: 'Monitoring',    accent: '#ef4444' },
  400: { floor: 15, department: 'CEO Suite',     accent: '#8b5cf6' },
};
