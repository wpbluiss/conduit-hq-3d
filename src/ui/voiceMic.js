/**
 * Voice Microphone UI — "Press V to talk" overlay with pulsing waveform.
 * Foundation for ElevenLabs voice integration.
 */

export function createVoiceMic() {
  // Container
  const overlay = document.createElement('div');
  overlay.id = 'voice-mic-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(10,11,16,0.75);
    z-index: 200; display: none;
    align-items: center; justify-content: center; flex-direction: column;
    backdrop-filter: blur(6px);
  `;
  document.body.appendChild(overlay);

  // Mic circle
  const micCircle = document.createElement('div');
  micCircle.style.cssText = `
    width: 120px; height: 120px; border-radius: 50%;
    background: rgba(139,92,246,0.15);
    border: 2px solid rgba(139,92,246,0.6);
    display: flex; align-items: center; justify-content: center;
    position: relative;
    animation: voicePulse 1.5s ease-in-out infinite;
  `;
  overlay.appendChild(micCircle);

  // Mic icon (SVG)
  micCircle.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="1" width="6" height="11" rx="3"/>
      <path d="M19 10v1a7 7 0 01-14 0v-1"/>
      <line x1="12" y1="19" x2="12" y2="23"/>
      <line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  `;

  // Waveform canvas
  const waveCanvas = document.createElement('canvas');
  waveCanvas.width = 280;
  waveCanvas.height = 60;
  waveCanvas.style.cssText = `margin-top: 24px;`;
  overlay.appendChild(waveCanvas);
  const wCtx = waveCanvas.getContext('2d');

  // Label
  const label = document.createElement('div');
  label.style.cssText = `
    margin-top: 16px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 18px; color: #8b5cf6; font-weight: 500;
    letter-spacing: 0.05em;
  `;
  label.textContent = 'Listening...';
  overlay.appendChild(label);

  // Hint
  const hint = document.createElement('div');
  hint.style.cssText = `
    margin-top: 8px;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 13px; color: #64748b;
  `;
  hint.textContent = 'Press V or Escape to close';
  overlay.appendChild(hint);

  // CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes voicePulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4); transform: scale(1); }
      50% { box-shadow: 0 0 0 20px rgba(139,92,246,0); transform: scale(1.05); }
    }
  `;
  document.head.appendChild(style);

  let isOpen = false;
  let waveAnim = null;
  let wavePhase = 0;

  function drawWaveform() {
    wavePhase += 0.08;
    wCtx.clearRect(0, 0, 280, 60);

    const bars = 32;
    const barW = 280 / bars - 2;

    for (let i = 0; i < bars; i++) {
      const h = 8 + Math.abs(Math.sin(wavePhase + i * 0.4)) * 35 +
                Math.sin(wavePhase * 1.3 + i * 0.7) * 10;
      const x = i * (barW + 2);
      const y = (60 - h) / 2;

      // Gradient purple to cyan
      const t = i / bars;
      const r = Math.round(139 * (1 - t) + 6 * t);
      const g = Math.round(92 * (1 - t) + 182 * t);
      const b = Math.round(246 * (1 - t) + 212 * t);

      wCtx.fillStyle = `rgba(${r},${g},${b},0.8)`;
      wCtx.beginPath();
      wCtx.roundRect(x, y, barW, h, 2);
      wCtx.fill();
    }

    waveAnim = requestAnimationFrame(drawWaveform);
  }

  function show() {
    isOpen = true;
    overlay.style.display = 'flex';
    drawWaveform();
    console.log(
      '%c[ELEVENLABS HOOK] READY FOR ELEVENLABS: would send audio to wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream',
      'color: #8b5cf6; font-weight: bold'
    );
    console.log('[ELEVENLABS HOOK] Integration point: capture mic via navigator.mediaDevices.getUserMedia(), stream PCM to ElevenLabs WebSocket, play back TTS response');
  }

  function hide() {
    isOpen = false;
    overlay.style.display = 'none';
    if (waveAnim) {
      cancelAnimationFrame(waveAnim);
      waveAnim = null;
    }
  }

  function toggle() {
    if (isOpen) hide();
    else show();
  }

  return { show, hide, toggle, isOpen: () => isOpen };
}
