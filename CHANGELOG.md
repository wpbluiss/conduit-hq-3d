# CHANGELOG

## 2026-03-24 — Multi-Floor Office with Elevator, Sales Floor, CEO Suite, JARVIS Chat, and HUD

### 1. Working Elevator System
- Rewrote `src/ui/elevatorPanel.js` — panel now shows three named floors: Lobby, Sales Floor, CEO Suite (instead of 15 generic floor buttons)
- Rewrote `src/interaction/elevatorSystem.js` — teleports player to y=0 (Lobby), y=50 (Sales Floor), or y=100 (CEO Suite) with fade-to-black transition
- Added `setFloorY(y)` and `getCurrentFloorY()` to `src/player/controls.js` for direct Y-level teleportation
- Added elevator proximity zones on Sales Floor and CEO Suite so player can travel between floors from any level
- Press E near elevator doors on any floor to open the floor selector panel

### 2. Sales Floor (y=50)
- New file: `src/interior/salesFloor.js`
- Full floor geometry: floor plane, ceiling, 4 walls
- 6 desks with monitors (box geometry) arranged in two rows
- 6 robot.glb clones seated at desks with idle animations
- Floating name tags with status dots: HUNTER, CLOSER, STRIKER (green/yellow), REX, DEMO, REPLY
- Three point lights for ambient illumination
- "SALES FLOOR" wall label

### 3. CEO Suite (y=100)
- New file: `src/interior/ceoSuite.js`
- Executive floor with dark polished floor, solid back wall, transparent glass walls on front and sides
- Glass mullion frames for visual effect
- Large executive desk with "LUIS GARCIA — CEO" nameplate
- Monitor, chair, and desk accessories
- JARVIS robot.glb with purple material tint (color lerp + emissive glow) and idle animation
- "JARVIS" name tag in purple
- Purple accent lighting + warm main light
- "CEO SUITE" wall label

### 4. JARVIS Chat Panel
- New file: `src/ui/jarvisChat.js`
- Dark themed HTML overlay, positioned bottom-right (380x480px)
- Press J near JARVIS (CEO Suite) to toggle open/close
- Pre-loaded welcome message from JARVIS
- User can type messages; input stops key propagation so WASD doesn't move player while typing
- Canned response system:
  - "agent" → agent status report
  - "pipeline" → pipeline financials
  - "lead" → hot leads info
  - "revenue"/"mrr" → MRR status
  - Default → "all systems nominal" response
- Visual: purple accent borders, message bubbles, JARVIS label on bot messages

### 5. HUD Overlay
- New file: `src/ui/hud.js`
- Fixed top-right corner, always visible, pointer-events: none
- Semi-transparent dark background with green (#10b981) accent border
- Monospace font (Courier New / Consolas)
- Displays: MRR $0, Pipeline $89.9k, Agents 35/35, Engines 8

### 6. Proximity System Fix
- Updated `src/interaction/proximity.js` to support Y-axis tolerance (`yTolerance` parameter)
- Zones now check vertical distance so proximity triggers only fire on the correct floor
- Default yTolerance of 5 units prevents cross-floor activation

### 7. Player Controls Updates
- `isInsideLobby()` now returns `true` for all upper floors (y > 10) so camera uses indoor distance/height
- Added `setFloorY(y)` for direct Y positioning (used by elevator system)
- Added `getCurrentFloorY()` getter

### Files Modified
- `src/main.js` — wired in all new systems, floors, UI, proximity zones, JARVIS key handler, extra animation mixers
- `src/player/controls.js` — added setFloorY, getCurrentFloorY, updated isInsideLobby
- `src/interaction/elevatorSystem.js` — complete rewrite with named floors and fade transitions
- `src/interaction/proximity.js` — Y-axis aware proximity detection
- `src/ui/elevatorPanel.js` — complete rewrite with named floor buttons

### Files Created
- `src/interior/salesFloor.js`
- `src/interior/ceoSuite.js`
- `src/ui/jarvisChat.js`
- `src/ui/hud.js`
