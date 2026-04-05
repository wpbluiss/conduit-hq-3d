# Conduit AI HQ — Demo Walkthrough Script

**Prepared for:** Wednesday Client/Investor Demo
**Duration:** 10-15 minutes
**Requirements:** Chrome or Edge (WebGPU-enabled), mouse + keyboard

---

## Setup

1. Open a terminal in the project root.
2. Run `npm run dev` to start the Vite dev server.
3. Open the provided localhost URL in a WebGPU-capable browser (Chrome 113+ or Edge 113+).
4. Wait for the loading bar to complete. The scene will appear once all assets are ready.

---

## Controls Reference

| Key / Input | Action |
|---|---|
| W / A / S / D | Move forward / left / back / right |
| Mouse | Look around (click the window first to capture pointer) |
| E | Enter/use elevator (when near elevator doors) |
| J | Open JARVIS AI chat (works from any floor) |

---

## Walkthrough Steps

### 1. Exterior Approach (0:00 - 1:30)

- You spawn outside facing the Conduit AI tower.
- **Talking point:** "This is the Conduit AI headquarters — a full 3D, real-time WebGPU experience running in the browser. No plugins, no downloads."
- Walk forward (W) toward the building entrance. Notice the signage, palm trees, and surrounding skyline.
- **Talking point:** "Every element — the lighting, the reflections, the fog — is rendered in real time using Three.js on WebGPU, the successor to WebGL."

### 2. Lobby (1:30 - 3:00)

- Walk through the entrance into the lobby.
- Approach the receptionist robot near the front desk.
- A greeting prompt appears: *"Welcome to Conduit AI, Mr. Garcia."*
- **Talking point:** "Our AI receptionist greets visitors automatically. In the full product, this integrates with calendar and CRM data to personalize each interaction."
- Look around the lobby — note the logo wall, furniture, and elevator bank.

### 3. Elevator to Sales Floor (3:00 - 4:00)

- Walk toward the elevator doors at the back of the lobby.
- When you see *"Press E to enter elevator"*, press **E**.
- The elevator panel appears. Select **Sales Floor**.
- **Talking point:** "The elevator system lets you navigate between floors — just like a real office. Each floor is a different department."

### 4. Sales Floor (4:00 - 7:00)

- You arrive on the Sales Floor at the 2nd level.
- Six AI sales agents are seated at their desks, each with a floating name tag and status indicator:
  - **HUNTER** (green) — Lead generation
  - **CLOSER** (green) — Deal closing
  - **STRIKER** (yellow) — Outbound outreach
  - **REX** (green) — Account management
  - **DEMO** (yellow) — Demo scheduling
  - **REPLY** (green) — Email follow-up
- **Talking point:** "Each of these agents represents a real AI worker in our system. Green means active and operational. Yellow means processing or queued. Right now we have 35 agents running across 8 engine types."
- **Talking point:** "HUNTER found 8 new prospects today. CLOSER detected a warm email reply. These agents work 24/7 — no breaks, no sick days, no missed follow-ups."
- Walk around to see the agents at their workstations with monitors glowing blue.
- When ready, head back to the elevator zone and press **E** to go to the CEO Suite.

### 5. CEO Suite (7:00 - 10:00)

- You arrive on the top floor — the CEO Suite.
- Notice the glass walls with skyline views, the executive desk with a nameplate reading *"LUIS GARCIA — CEO"*, and the purple accent lighting.
- Walk toward the purple-tinted robot on the right side — this is **JARVIS**, the AI assistant.
- JARVIS has a floating name tag with a green status dot.
- **Talking point:** "This is JARVIS — our central AI command interface. Think of it as the brain that orchestrates all 35 agents."

### 6. JARVIS Chat Demo (10:00 - 13:00)

- Press **J** to open the JARVIS chat panel (bottom-right corner).
- JARVIS greets you: *"Good evening, Mr. Garcia. All systems operational."*
- Try these demo queries:
  - Type **"status"** — JARVIS reports: all systems operational, 8 engines, 35 agents, pipeline at $89,895.
  - Type **"leads"** — JARVIS reports: HUNTER found 8 prospects, CLOSER detected 1 warm reply, 3 pending.
  - Type **"schedule"** — JARVIS reports: Wednesday meeting with Christian, Monday walk-in to Lux Nail Lounge.
  - Type **"olivia"** — JARVIS reports on the Olivia/livsbookkeeping.com deal status.
  - Type **"encanta"** — JARVIS reports on Encanta Beauty Nails proposal status.
  - Type **"pipeline"** — JARVIS reports $89,895 pipeline, up 12%.
- **Talking point:** "JARVIS gives me a real-time command center. I can check on any deal, any agent, any client — all from one interface. This is what running a business with AI looks like."
- Close the chat by pressing **J** again or clicking the X.

### 7. HUD Overlay (13:00 - 14:00)

- Notice the FPS counter in the top-left corner showing real-time performance stats.
- **Talking point:** "Everything you see runs at 60 FPS in the browser. WebGPU gives us desktop-grade 3D performance with zero installation."

### 8. Closing (14:00 - 15:00)

- **Talking point:** "What you just saw is a fully interactive 3D headquarters for an AI-powered sales automation company. Every agent, every desk, every conversation — it all maps to real systems running real outreach for real clients."
- **Talking point:** "We are building the future of autonomous business operations. The HQ you just walked through is not just a visualization — it is the control center."

---

## Troubleshooting

- **Black screen on load:** Ensure your browser supports WebGPU. Use Chrome 113+ or Edge 113+. Check `chrome://flags` and enable "Unsafe WebGPU" if needed.
- **Low FPS:** Close other GPU-intensive tabs. Reduce browser window size if necessary.
- **Elevator not working:** Make sure you are close enough to the elevator doors. The prompt "Press E" must be visible before pressing E.
- **JARVIS chat not opening:** Press J (not case-sensitive). If typing in another input field, click the 3D scene first.

---

## Key Metrics to Mention

- 35 AI agents across 8 engine types
- Pipeline: $89,895
- Active prospects: 8 new today
- Clients in progress: Olivia (livsbookkeeping.com), Encanta Beauty Nails (Elian)
- Pricing: $499 setup + $199/mo per client
- Custom builds: $1,500 - $3,000
