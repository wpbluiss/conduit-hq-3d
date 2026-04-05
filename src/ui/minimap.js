import { LOBBY } from '../constants.js';

/**
 * Minimap — small canvas in bottom-left showing top-down view of current floor.
 * Toggle with M key. Only redraws on toggle or floor change, not every frame.
 */
export function createMinimap(player) {
  const SIZE = 150;
  const hw = LOBBY.width / 2;
  const hd = LOBBY.depth / 2;

  const scaleX = SIZE / (LOBBY.width + 4);
  const scaleZ = SIZE / (LOBBY.depth + 4);

  const container = document.createElement('div');
  container.id = 'minimap';
  container.style.cssText = `
    position: fixed; bottom: 12px; left: 12px;
    width: ${SIZE}px; height: ${SIZE}px;
    border: 1px solid rgba(139,92,246,0.4);
    border-radius: 8px; overflow: hidden;
    z-index: 50; pointer-events: none;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    background: rgba(10,11,16,0.85);
    backdrop-filter: blur(4px);
    display: none;
  `;
  document.body.appendChild(container);

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let visible = false;
  let agentDots = [];
  let deskRects = [];
  let walkingNpcRefs = []; // array of { group } with live position
  let updateTimer = null;

  function worldToMap(wx, wz) {
    const mx = (wx + hw + 2) * scaleX;
    const mz = (wz + hd + 2) * scaleZ;
    return [mx, mz];
  }

  function draw() {
    ctx.clearRect(0, 0, SIZE, SIZE);

    ctx.fillStyle = 'rgba(10,11,16,0.9)';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Walls
    ctx.strokeStyle = 'rgba(139,92,246,0.5)';
    ctx.lineWidth = 1.5;
    const [tlx, tly] = worldToMap(-hw, -hd);
    const [brx, bry] = worldToMap(hw, hd);
    ctx.strokeRect(tlx, tly, brx - tlx, bry - tly);

    // Desks
    ctx.fillStyle = 'rgba(100,116,139,0.5)';
    for (const d of deskRects) {
      const [dx, dz] = worldToMap(d.x - d.w / 2, d.z - d.d / 2);
      const dw = d.w * scaleX;
      const dd = d.d * scaleZ;
      ctx.fillRect(dx, dz, dw, dd);
    }

    // Agent dots
    for (const a of agentDots) {
      const [ax, az] = worldToMap(a.x, a.z);
      ctx.fillStyle = a.color || '#10b981';
      ctx.beginPath();
      ctx.arc(ax, az, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Walking NPC dots (moving, smaller, cyan)
    ctx.fillStyle = '#06b6d4';
    for (const npc of walkingNpcRefs) {
      if (npc.group) {
        const [nx, nz] = worldToMap(npc.group.position.x, npc.group.position.z);
        ctx.beginPath();
        ctx.arc(nx, nz, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Player dot
    const [px, pz] = worldToMap(player.position.x, player.position.z);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, pz, 4, 0, Math.PI * 2);
    ctx.fill();

    // Player direction indicator
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    const angle = player.rotation.y;
    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.lineTo(px + Math.sin(angle) * 8, pz + Math.cos(angle) * 8);
    ctx.stroke();
  }

  function startUpdating() {
    if (updateTimer) return;
    draw();
    // Update player position on minimap at 4Hz while visible
    updateTimer = setInterval(draw, 250);
  }

  function stopUpdating() {
    if (updateTimer) {
      clearInterval(updateTimer);
      updateTimer = null;
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      visible = !visible;
      container.style.display = visible ? 'block' : 'none';
      if (visible) {
        startUpdating();
      } else {
        stopUpdating();
      }
    }
  });

  function setFloorData(agents, desks, walkingNpcs) {
    agentDots = agents || [];
    deskRects = desks || [];
    walkingNpcRefs = walkingNpcs || [];
    if (visible) draw();
  }

  // No update() needed in render loop — self-manages via interval when visible

  return { setFloorData };
}
