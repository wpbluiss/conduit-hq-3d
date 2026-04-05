import * as THREE from 'three/webgpu';

/**
 * Speech Bubbles — random seated agents get short status updates
 * that float above their heads and fade after 4 seconds.
 * Triggers every 30-60 seconds per floor.
 */

// Department-specific speech lines
const DEPT_SPEECH = {
  Sales: [
    'Closing deal with Smith Corp...',
    'Sending follow-up to Acme Inc.',
    'Pipeline looking strong today!',
    'Demo went great with TechFlow.',
    'New lead from LinkedIn inbound.',
    'Updating CRM for Q2 targets...',
    'Revenue up 12% this week!',
  ],
  Marketing: [
    'Campaign CTR up 3.2%!',
    'New blog post going viral...',
    'Social engagement through the roof.',
    'A/B test shows variant B wins.',
    'Brand guide update complete.',
    'Drafting Q2 report...',
    'Newsletter open rate: 42%.',
  ],
  Engineering: [
    'Deploy succeeded, zero errors.',
    'PR review looks clean.',
    'Latency down to 12ms!',
    'Refactoring the auth module...',
    'All 347 tests passing.',
    'Fixed that edge case bug.',
    'New API endpoint is live.',
  ],
  Content: [
    'Blog post draft v3 ready.',
    'Video edit almost done...',
    'Infographic getting good shares.',
    'Writing the case study now.',
    'Headline A/B test running...',
    'SEO score jumped to 94.',
    'New podcast episode recorded.',
  ],
  Intelligence: [
    'Market analysis complete.',
    'Competitor launched new feature.',
    'Forecast model updated.',
    'Trend report looks promising.',
    'Data pipeline running smoothly.',
    'New insights for the board.',
    'Sentiment analysis is positive.',
  ],
  Operations: [
    'All tickets resolved today.',
    'Client onboarding complete.',
    'Invoice batch processed.',
    'SLA at 99.7% this month.',
    'New workflow automated.',
    'Reconciliation done for Q1.',
    'Support queue is empty!',
  ],
  Monitoring: [
    'All systems green.',
    'Uptime: 99.99% this quarter.',
    'Alert resolved in 2 minutes.',
    'CPU usage nominal at 34%.',
    'No anomalies detected.',
    'Backup completed successfully.',
    'Network latency stable.',
  ],
};

// Fallback lines
const GENERIC_SPEECH = [
  'Working on it...',
  'Almost done here.',
  'Making progress!',
  'Checking the data...',
  'Looks good so far.',
  'One more task to go.',
];

/**
 * Create a speech bubble system for a floor's agents.
 * @param {THREE.Group[]} agentGroups - Array of agent group objects with userData
 * @param {string} department - Department name for speech line selection
 * @returns {{ update: (time: number) => void }}
 */
export function createSpeechBubbles(agentGroups, department) {
  const lines = DEPT_SPEECH[department] || GENERIC_SPEECH;
  const activeBubbles = [];

  let lastTriggerTime = 0;
  let nextInterval = 3 + Math.random() * 5; // first bubble appears quickly (3-8s)

  function spawnBubble(agentGroup, time) {
    const text = lines[Math.floor(Math.random() * lines.length)];

    // Create canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 80;
    const ctx = canvas.getContext('2d');

    // Background pill
    ctx.fillStyle = 'rgba(10,11,16,0.85)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 72, 16);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(4, 4, 504, 72, 16);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 22px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 42);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(3.0, 0.48, 1);
    sprite.position.set(0, 2.6, 0);
    agentGroup.add(sprite);

    activeBubbles.push({
      sprite,
      parent: agentGroup,
      startTime: time,
      duration: 4.0,
    });
  }

  function update(time) {
    // Trigger new bubble periodically
    if (agentGroups.length > 0 && time - lastTriggerTime > nextInterval) {
      lastTriggerTime = time;
      nextInterval = 30 + Math.random() * 30; // 30-60s between bubbles

      // Pick random agent that doesn't already have a bubble
      const busyAgents = new Set(activeBubbles.map(b => b.parent));
      const available = agentGroups.filter(g => !busyAgents.has(g));
      if (available.length > 0) {
        const agent = available[Math.floor(Math.random() * available.length)];
        spawnBubble(agent, time);
      }
    }

    // Update active bubbles
    for (let i = activeBubbles.length - 1; i >= 0; i--) {
      const b = activeBubbles[i];
      const age = time - b.startTime;

      if (age >= b.duration) {
        // Remove
        b.parent.remove(b.sprite);
        b.sprite.material.map?.dispose();
        b.sprite.material.dispose();
        activeBubbles.splice(i, 1);
        continue;
      }

      // Fade in (0.4s), hold, fade out (0.5s)
      if (age < 0.4) {
        b.sprite.material.opacity = age / 0.4;
      } else if (age > b.duration - 0.5) {
        b.sprite.material.opacity = Math.max(0, (b.duration - age) / 0.5);
      } else {
        b.sprite.material.opacity = 1;
      }

      // Gentle float upward
      b.sprite.position.y = 2.6 + (age / b.duration) * 0.3;
    }
  }

  return { update };
}
