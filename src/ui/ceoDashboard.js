/**
 * CEO Dashboard — HTML overlay shown when pressing E near CEO desk.
 */
export function createCeoDashboard() {
  const el = document.createElement('div');
  el.id = 'ceo-dashboard';
  el.style.cssText = `
    display: none; position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(10,11,16,0.96); border: 2px solid #8b5cf6;
    border-radius: 16px; padding: 32px 40px; color: white;
    font-family: 'Segoe UI', system-ui, sans-serif; z-index: 250;
    min-width: 560px; max-width: 640px;
    box-shadow: 0 12px 60px rgba(0,0,0,0.8), 0 0 60px rgba(139,92,246,0.15);
    backdrop-filter: blur(10px);
    max-height: 85vh; overflow-y: auto;
  `;
  document.body.appendChild(el);

  let _isOpen = false;

  const card = (label, value, color = '#10b981') => `
    <div style="background:rgba(30,30,45,0.6);border:1px solid rgba(139,92,246,0.3);border-radius:10px;padding:14px">
      <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px">${label}</div>
      <div style="font-size:26px;font-weight:bold;color:${color}">${value}</div>
    </div>`;

  const pill = (text) => `<span style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.35);border-radius:6px;padding:4px 10px;font-size:12px;font-weight:600">${text}</span>`;

  function show() {
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:20px">
        <div>
          <div style="font-size:11px;letter-spacing:0.2em;color:#8b5cf6;font-weight:600">CONDUIT AI LLC</div>
          <div style="font-size:24px;font-weight:bold;margin-top:2px">CEO Dashboard</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;color:#94a3b8">Luis Garcia</div>
          <div style="font-size:11px;color:#64748b">Chief Executive Officer</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:18px">
        ${card('Pipeline', '$89,895')}
        ${card('MRR', '$0', '#eab308')}
        ${card('Agents', '35/35')}
        ${card("Today's Calls", '12')}
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
        ${card('Departments', '8')}
        ${card('Active Prospects', '505')}
      </div>

      <div style="background:rgba(30,30,45,0.6);border:1px solid rgba(139,92,246,0.3);border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Active Prospects</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${pill('Encanta Beauty Nails — $499+$199/mo')}
          ${pill('Olivia / LivBookkeeping — $1.5-3K')}
          ${pill('Christian / The G Room — Meeting Wed')}
          ${pill('Bar 9 Fire Detection')}
        </div>
      </div>

      <div style="background:rgba(30,30,45,0.6);border:1px solid rgba(139,92,246,0.3);border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Infrastructure</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;color:#cbd5e1">
          <div>RuFlow v3.5 <span style="color:#64748b">— 60 parallel agents</span></div>
          <div>n8n <span style="color:#64748b">— 7 workflows</span></div>
          <div>Supabase <span style="color:#64748b">— DB + Auth</span></div>
          <div>Task Engine <span style="color:#64748b">— AI Workforce</span></div>
        </div>
      </div>

      <div style="background:rgba(30,30,45,0.6);border:1px solid rgba(139,92,246,0.3);border-radius:10px;padding:14px">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">Departments</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:13px;color:#cbd5e1">
          <div><span style="color:#3b82f6">●</span> Sales (6 agents)</div>
          <div><span style="color:#10b981">●</span> Marketing (5 agents)</div>
          <div><span style="color:#f97316">●</span> Engineering (4 agents)</div>
          <div><span style="color:#ec4899">●</span> Content (5 agents)</div>
          <div><span style="color:#eab308">●</span> Intelligence (5 agents)</div>
          <div><span style="color:#22c55e">●</span> Operations (5 agents)</div>
          <div><span style="color:#ef4444">●</span> Monitoring (2 agents)</div>
          <div><span style="color:#8b5cf6">●</span> Executive (JARVIS + CEO)</div>
        </div>
      </div>

      <div style="color:#4b5563;font-size:11px;text-align:center;margin-top:16px;letter-spacing:0.05em">Press ESC to close</div>
    `;
    el.style.display = 'block';
    _isOpen = true;
  }

  function hide() {
    el.style.display = 'none';
    _isOpen = false;
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && _isOpen) hide();
  });

  return { show, hide, isOpen: () => _isOpen };
}
