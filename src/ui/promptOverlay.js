export function createPromptOverlay() {
  const el = document.createElement('div');
  el.id = 'prompt-overlay';
  el.style.cssText = `
    position: fixed;
    bottom: 22%;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 28px;
    background: rgba(10, 11, 16, 0.85);
    border: 1px solid rgba(59, 130, 246, 0.5);
    border-radius: 8px;
    color: #e2e8f0;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 0.95rem;
    letter-spacing: 0.03em;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 50;
    text-align: center;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  `;
  document.body.appendChild(el);

  let hideTimeout = null;

  function show(text, duration = 0) {
    if (hideTimeout) clearTimeout(hideTimeout);
    el.textContent = text;
    el.style.opacity = '1';
    if (duration > 0) {
      hideTimeout = setTimeout(hide, duration);
    }
  }

  function hide() {
    el.style.opacity = '0';
  }

  return { show, hide, element: el };
}
