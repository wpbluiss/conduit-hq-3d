# CHANGELOG v2 — Conduit AI HQ 3D

## Atmosphere & Life

### 1. Ambient Office Sounds (`src/audio/ambience.js`)
- Procedural AC hum (60Hz + 120Hz harmonics, very quiet)
- Periodic keyboard typing sounds (noise bursts every 2-5s with bandpass filter)
- Starts on first user click/keypress (AudioContext requirement)
- Wired into `main.js` after loading screen dismissal

### 2. Animated Screens on Sales Floor Desks
- Each of the 6 agent desks has a CanvasTexture screen
- Screens redraw every ~2.5 seconds with randomized data dashboard bars
- Colors: blues, greens, cyans — simulating data dashboards
- Update function called from render loop via `updateSalesFloor()`

### 3. Robot Agent Idle Animation
- Subtle vertical bob (0.01 units amplitude, sinusoidal)
- Slight rotation oscillation (~0.05 radians left/right)
- Each robot has a unique phase offset (1.3 * index) so they don't sync
- Driven from render loop via `updateSalesFloor()`

### 4. Wall Clocks (All Floors)
- Circular clock face (CylinderGeometry) with dark rim
- Hour and minute hands (BoxGeometry) driven by real `Date()`
- Placed on right side wall of each floor:
  - Lobby: right wall near ceiling
  - Sales Floor: right wall near ceiling
  - CEO Suite: right wall near ceiling
- Updated each frame from render loop

### 5. Conduit AI Logo on Walls
- CanvasTexture with gradient "CONDUIT AI" text
- Sales Floor: back wall (blue gradient)
- CEO Suite: back wall (purple-to-cyan gradient)
- Lobby: existing `createLogoWall` with enhanced spotlight (see #15)

---

## Sales Floor Upgrades

### 6. Additional Furniture
- **Whiteboard**: Canvas texture with colored scribbles/boxes on left side wall
- **Water cooler**: Cylinder stack (white base, blue top) in back-left corner
- **Filing cabinets**: 2 dark metal box stacks near back wall
- **Printer**: Dark box with green LED dot, near filing cabinets

### 7. Partition Walls
- Low partition wall (1.3m height) running along z=0 between desk rows
- Dark fabric color (0x2a2a3a), full floor width minus 2m margin

### 8. Ceiling Light Panels
- 6 flat white emissive panels (MeshBasicMaterial, warm white)
- Evenly distributed in a 3x2 grid across the ceiling

### 9. Pipeline Display
- Large wall-mounted screen on front wall
- Shows: "PIPELINE: $89,895", "LEADS TODAY: 8", "AGENTS ACTIVE: 35/35"
- Green text on dark background with green border
- CanvasTexture on PlaneGeometry

---

## CEO Suite Upgrades

### 10. Bookshelf
- Tall dark wood frame (3m wide, 3.5m tall) on back-right area
- Side panels, back panel, 4 shelf levels
- Randomly colored book boxes on 3 shelves (reds, blues, greens, purples, golds)

### 11. Multiple Monitors
- Replaced single monitor with 3 screens on CEO desk
- Slightly angled outward (0.3 rad spread)
- Different screen glows: purple, blue, green

### 12. Seating Area
- Dark couch (box geometry with back and armrests) in front-left area
- Small coffee table with 4 legs
- Positioned at (-5, y, 3-4)

### 13. Achievement Frames
- 3 framed items on left side wall:
  - "FOUNDED 2026"
  - "FIRST 100 CLIENTS"
  - "$1M ARR"
- Each has dark frame box + CanvasTexture with purple border

### 14. Skyline View
- Glass wall opacity reduced to 0.1 (from 0.15) for clearer skyline visibility
- Front and side glass walls are nearly transparent

---

## Lobby Upgrades

### 15. Illuminated Logo Wall
- Added SpotLight (0x4488ff, intensity 60) pointing at logo wall
- Spotlight targets the back wall where the 3D text logo sits

### 16. Digital Directory Board
- Standing display near elevator bank (x=3.5, z near back wall)
- Dark frame with pole stand
- Canvas texture showing:
  - "CONDUIT AI HEADQUARTERS"
  - "L — Lobby & Reception"
  - "13 — Sales Floor"
  - "26 — CEO Suite"
  - Footer: "Please check in at reception"

### 17. Lobby Ambient Lighting
- Additional warm PointLight (0xffeebb, intensity 20) at ceiling center
- 3 warm recessed visual ceiling panels (center, left, right)
- Supplements existing lobby lighting system

---

## General (All Floors)

### 18. Baseboards
- Thin dark strips (0.08m height) along base of every wall
- Applied to all 3 floors (Lobby, Sales Floor, CEO Suite)
- Material: dark color (0x0f0f18)

### 19. Elevator Door Frames
- Dark metal frames (0x444455, metallic) around elevator area
- Sales Floor: frame at back wall center (2.2m wide, 3.2m tall)
- CEO Suite: frame at back wall center (matching dimensions)
- Lobby: already has frames from `elevatorBank.js`

### 20. Emergency Exit Signs
- 2 per floor (opposite corners), 6 total
- Small green boxes with "EXIT" text (CanvasTexture)
- Positioned near ceiling (MeshBasicMaterial for glow effect)

---

## Wiring

- `main.js` imports and calls `updateSalesFloor(elapsedTime)` in render loop
- `main.js` imports and calls `updateWallClocks()` for sales floor clocks
- `main.js` imports and calls `updateCeoClocks()` for CEO suite clocks
- Lobby clock updated directly in render loop
- Ambient sound starts on first user click/keydown event
- All updates gated by floor visibility (`salesResult.group.visible`, etc.)

---

## Files Modified
- `src/main.js` — Added imports, ambience wiring, render loop updates
- `src/interior/salesFloor.js` — Complete rewrite with all sales floor features
- `src/interior/ceoSuite.js` — Complete rewrite with all CEO suite features
- `src/interior/lobby.js` — Added directory board, baseboards, exit signs, wall clock
- `src/interior/lobbyLighting.js` — Added logo spotlight, warm ceiling lights

## Files Created
- `src/audio/ambience.js` — Procedural ambient office sounds
- `CHANGELOG_v2.md` — This file
