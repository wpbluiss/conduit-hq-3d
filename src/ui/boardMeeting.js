import * as THREE from 'three/webgpu';
import { createAgentModel } from '../npc/agentModel.js';

/**
 * Board Meeting system — spawns key agents around the conference table
 * with speech bubbles showing department reports.
 */

const BOARD_MEMBERS = [
  {
    name: 'JARVIS', role: 'AI Assistant',
    report: 'All systems operational. 32 employees active. Revenue tracking +12% MoM.',
    color: 0x8b5cf6, skinColor: 0xdebb99, isFemale: false,
    seat: { x: -1.3, z: 0, ry: Math.PI / 2 },
  },
  {
    name: 'OTTO', role: 'CFO',
    report: 'Monthly burn: $280. Revenue: $199 from Growth plan. Runway: 6 months at current rate.',
    color: 0x1a1a3e, skinColor: 0xF1C27D, isFemale: false,
    seat: { x: 1.3, z: 0, ry: -Math.PI / 2 },
  },
  {
    name: 'HUNTER', role: 'Sales Lead',
    report: 'Pipeline: 3 qualified leads. Arturo pending payment. 2 networking events scheduled.',
    color: 0x1e3a5e, skinColor: 0xE0AC69, isFemale: false,
    seat: { x: -0.8, z: -0.85, ry: 0 },
  },
  {
    name: 'NOVA', role: 'Marketing Lead',
    report: 'Social reach: 26K impressions this week. Blog traffic up 40%. TikTok strategy ready.',
    color: 0x1e3028, skinColor: 0xFFDBAC, isFemale: true,
    seat: { x: 0, z: -0.85, ry: 0 },
  },
  {
    name: 'BYTE', role: 'Engineering Lead',
    report: '3D HQ: 98% complete. Website rebuilt. Bot v9.5 stable. QA Manager deployed.',
    color: 0x2a2a2e, skinColor: 0xC68642, isFemale: false,
    seat: { x: 0.8, z: -0.85, ry: 0 },
  },
  {
    name: 'SAGE', role: 'Content Lead',
    report: '5 blog posts live. Content calendar loaded. Video pipeline ready for recording.',
    color: 0x3a2a2a, skinColor: 0x8D5524, isFemale: true,
    seat: { x: 0, z: 0.85, ry: Math.PI },
  },
];

const BOARD_X = 6, BOARD_Z = 4, FLOOR_Y = 400;

export function createBoardMeeting(ceoGroup) {
  let active = false;
  const agentGroups = [];
  const bubbleSprites = [];
  let screenMesh = null;

  // Find the board room screen to update it
  ceoGroup.traverse(child => {
    if (child.isMesh && child.material && child.material.emissive &&
        child.position.y > FLOOR_Y + 2 && child.position.y < FLOOR_Y + 3 &&
        child.position.x > 4 && child.position.z < 2) {
      screenMesh = child;
    }
  });

  // Pre-create agent models (hidden initially)
  for (const member of BOARD_MEMBERS) {
    const { group: agentGroup } = createAgentModel({
      bodyColor: member.color,
      skinColor: member.skinColor,
      accentColor: 0x8b5cf6,
      isFemale: member.isFemale,
      agentIndex: BOARD_MEMBERS.indexOf(member),
    });

    agentGroup.position.set(
      BOARD_X + member.seat.x,
      FLOOR_Y,
      BOARD_Z + member.seat.z
    );
    agentGroup.rotation.y = member.seat.ry;
    agentGroup.visible = false;
    ceoGroup.add(agentGroup);
    agentGroups.push(agentGroup);

    // Name tag
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 512;
    tagCanvas.height = 64;
    const tctx = tagCanvas.getContext('2d');
    tctx.clearRect(0, 0, 512, 64);
    tctx.fillStyle = 'rgba(10,11,16,0.8)';
    tctx.beginPath();
    tctx.roundRect(20, 8, 472, 48, 12);
    tctx.fill();
    tctx.strokeStyle = '#8b5cf6';
    tctx.lineWidth = 2;
    tctx.beginPath();
    tctx.roundRect(20, 8, 472, 48, 12);
    tctx.stroke();
    tctx.fillStyle = '#ffffff';
    tctx.font = 'bold 22px sans-serif';
    tctx.textAlign = 'center';
    tctx.fillText(`${member.name} — ${member.role}`, 256, 38);
    const tagTex = new THREE.CanvasTexture(tagCanvas);
    tagTex.colorSpace = THREE.SRGBColorSpace;
    const tagSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tagTex, transparent: true, depthTest: false,
    }));
    tagSprite.scale.set(2.5, 0.32, 1);
    tagSprite.position.set(0, 2.0, 0);
    tagSprite.visible = false;
    agentGroup.add(tagSprite);

    // Speech bubble with report
    const bubCanvas = document.createElement('canvas');
    bubCanvas.width = 640;
    bubCanvas.height = 96;
    const bctx = bubCanvas.getContext('2d');
    bctx.clearRect(0, 0, 640, 96);
    bctx.fillStyle = 'rgba(10,11,16,0.9)';
    bctx.beginPath();
    bctx.roundRect(4, 4, 632, 88, 16);
    bctx.fill();
    bctx.strokeStyle = 'rgba(139,92,246,0.4)';
    bctx.lineWidth = 1.5;
    bctx.beginPath();
    bctx.roundRect(4, 4, 632, 88, 16);
    bctx.stroke();
    bctx.fillStyle = '#e2e8f0';
    bctx.font = '400 18px "Segoe UI", system-ui, sans-serif';
    bctx.textAlign = 'center';
    // Word wrap
    const words = member.report.split(' ');
    let line = '', y = 38;
    for (const word of words) {
      const test = line + word + ' ';
      if (bctx.measureText(test).width > 600) {
        bctx.fillText(line.trim(), 320, y);
        line = word + ' ';
        y += 24;
      } else {
        line = test;
      }
    }
    bctx.fillText(line.trim(), 320, y);

    const bubTex = new THREE.CanvasTexture(bubCanvas);
    bubTex.colorSpace = THREE.SRGBColorSpace;
    const bubSprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: bubTex, transparent: true, opacity: 0, depthTest: false,
    }));
    bubSprite.scale.set(3.5, 0.54, 1);
    bubSprite.position.set(0, 2.5, 0);
    bubSprite.visible = false;
    agentGroup.add(bubSprite);
    bubbleSprites.push(bubSprite);
  }

  // Notification overlay
  const notifEl = document.createElement('div');
  notifEl.id = 'board-meeting-notif';
  notifEl.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    padding: 16px 32px;
    background: rgba(10,11,16,0.9);
    border: 2px solid rgba(139,92,246,0.6);
    border-radius: 12px;
    color: #e2e8f0;
    font-family: 'Segoe UI', system-ui, sans-serif;
    font-size: 18px; font-weight: 500;
    text-align: center;
    z-index: 160;
    pointer-events: none;
    opacity: 0; transition: opacity 0.5s;
    backdrop-filter: blur(8px);
    box-shadow: 0 0 30px rgba(139,92,246,0.3);
  `;
  document.body.appendChild(notifEl);

  let bubbleAnimTimer = 0;

  function startMeeting() {
    if (active) return;
    active = true;

    // Show agents
    for (const ag of agentGroups) {
      ag.visible = true;
      ag.traverse(c => { c.visible = true; });
    }

    // Animate bubbles appearing with stagger
    bubbleAnimTimer = 0;
    for (let i = 0; i < bubbleSprites.length; i++) {
      const spr = bubbleSprites[i];
      spr.visible = true;
      spr.material.opacity = 0;
    }

    // Update screen
    if (screenMesh && screenMesh.material.map) {
      const canvas = screenMesh.material.map.image;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#080810';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      // Gold pulsing border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
      // Text
      ctx.fillStyle = '#d4af37';
      ctx.font = 'bold 32px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BOARD MEETING', canvas.width / 2, canvas.height / 2 - 20);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('IN PROGRESS', canvas.width / 2, canvas.height / 2 + 20);
      screenMesh.material.map.needsUpdate = true;
      screenMesh.material.emissive.set(0xd4af37);
    }

    // Show notification
    notifEl.textContent = 'Board Meeting in progress — Press E on any member to hear their report';
    notifEl.style.opacity = '1';
    setTimeout(() => { notifEl.style.opacity = '0'; }, 4000);
  }

  function endMeeting() {
    if (!active) return;
    active = false;

    // Hide agents
    for (const ag of agentGroups) {
      ag.visible = false;
      ag.traverse(c => { c.visible = false; });
    }

    // Reset screen
    if (screenMesh && screenMesh.material.map) {
      const canvas = screenMesh.material.map.image;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#080810';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createLinearGradient(100, 0, 412, 0);
      grad.addColorStop(0, '#8b5cf6');
      grad.addColorStop(1, '#06b6d4');
      ctx.fillStyle = grad;
      ctx.font = 'bold 36px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CONDUIT AI', canvas.width / 2, canvas.height / 2 - 15);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('Board Meeting', canvas.width / 2, canvas.height / 2 + 25);
      screenMesh.material.map.needsUpdate = true;
      screenMesh.material.emissive.set(0x8b5cf6);
    }

    notifEl.textContent = 'Board Meeting ended';
    notifEl.style.opacity = '1';
    setTimeout(() => { notifEl.style.opacity = '0'; }, 2000);
  }

  function toggle() {
    if (active) endMeeting();
    else startMeeting();
  }

  function update(time) {
    if (!active) return;

    // Stagger bubble fade-in
    bubbleAnimTimer += 0.016; // approximate 60fps
    for (let i = 0; i < bubbleSprites.length; i++) {
      const delay = i * 0.4;
      const t = bubbleAnimTimer - delay;
      if (t > 0 && t < 0.5) {
        bubbleSprites[i].material.opacity = t / 0.5;
      } else if (t >= 0.5) {
        bubbleSprites[i].material.opacity = 1;
      }
      // Gentle float
      if (t > 0) {
        bubbleSprites[i].position.y = 2.5 + Math.sin(time * 0.5 + i) * 0.05;
      }
    }

    // Pulse screen border (update every ~0.5s for perf)
    if (screenMesh && screenMesh.material.map && Math.floor(time * 2) % 1 === 0) {
      const pulse = 0.7 + Math.sin(time * 3) * 0.3;
      screenMesh.material.emissiveIntensity = 1.0 + pulse;
    }
  }

  function isActive() { return active; }

  return { toggle, startMeeting, endMeeting, update, isActive };
}
