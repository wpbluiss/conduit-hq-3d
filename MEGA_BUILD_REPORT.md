# Mega Build Report
Date: March 24, 2026

## Camera & Movement (Phases 1-2)
- GTA-style orbit camera with scroll zoom
- Camera-relative WASD movement
- Smooth acceleration/deceleration
- Walk: 5 u/s, Sprint: 9 u/s

## Visual Floors (Phase 3)
- **Sales (y=50)**: Blue accent (0x3b82f6), custom pipeline display, whiteboard, 3 human NPC models
- **Marketing (y=100)**: Green accent (0x10b981), green wall panel on left wall, presentation board with Q2 campaign plan
- **Engineering (y=150)**: Orange accent (0xf97316), 4 server tower props with orange LEDs, 6 extra monitors near desks
- **Content (y=200)**: Pink accent (0xec4899), camera tripod prop with pink lens, extra ceiling light panels + extra point light
- **Intelligence (y=250)**: Amber accent (0xeab308), central 6x3 conference table, 3 wall charts with line graphs on right wall
- **Operations (y=300)**: Teal/green accent (0x22c55e), 3 filing cabinets with drawer handles, "OPERATIONS CENTER" wall label
- **Monitoring (y=350)**: Red accent (0xef4444) -- changed from gray for dramatic look, 4 server racks with blinking multi-color LEDs, 3x2 monitor wall with red glow insets
- **CEO Suite (y=400)**: Purple accent (0x8b5cf6), glass walls with emissive glow, bookshelf with colored books, seating area, achievement frames, JARVIS NPC

All factory floors share: dark polished floors with clearcoat, accent-colored LED strips along ceiling edges, accent-colored left wall panels, department name signs, elevator door frames, EXIT signs, ceiling light panels, water coolers, coffee mugs, papers on desks.

## NPCs (Phase 4)
- **Sales floor**: 3 human models (female_worker.glb / male_worker.glb), remaining 3 agents as name tags
- **Marketing, Engineering, Content floors**: 2 human models each (first 2 agents), remaining agents as name tags
- **Intelligence, Operations, Monitoring floors**: 2 human models each (first 2 agents), remaining as name tags
- **CEO Suite**: JARVIS has a purple-tinted human model
- **Idle animation**: All human NPCs have breathing (scaleY oscillation, amplitude 0.002) and weight shift (rotation.z oscillation, amplitude 0.01)
- **Sales floor NPC bug fix**: Module-level npcGroups variable was shadowed by local declaration inside createSalesFloor -- fixed so idle animations now work properly
- Animations only update when the floor is visible (floor culling optimization)

## Atmosphere (Phase 5)
- Floor materials: MeshPhysicalMaterial with clearcoat: 0.6, clearcoatRoughness: 0.15
- Ceiling light panels: 6 per factory floor (MeshBasicMaterial, warm white 0xfff8ee)
- Lighting: 3 PointLights per factory floor (1 center 40 intensity + 2 sides 25 intensity, warm white)
- CEO Suite glass walls: Added emissive glow (emissive: 0x88ccff, emissiveIntensity: 0.05) for window glow effect
- CEO Suite glass opacity: 0.12 for clear skyline visibility
- No fog added to floors (performance consideration)

## UI (Phase 6)
- **HUD floor name**: New display row at bottom of HUD showing current floor (e.g., "Floor 3 -- Marketing"). Updates on floor switch via exported `updateFloorName()` function.
- **Agent card animation**: Slide-in from below with 0.3s ease transition (translateY 20px -> 0, opacity 0 -> 1). Slide-out reverses with 300ms delay before display:none.
- **JARVIS chat width**: Increased from 380px to 440px
- **Consistent purple theme (#8b5cf6)**:
  - HUD: border and stat values changed to purple
  - Elevator panel: all borders, accents, floor numbers changed from blue to purple
  - Agent card: border changed to purple, box-shadow uses purple glow
  - Minimap: border and wall stroke changed to purple
  - CEO Dashboard: already used purple (verified)
  - JARVIS Chat: already used purple (verified)

## Files Modified
- `src/interior/departments.js` — Monitoring accentColor changed from gray (0x6b7280) to red (0xef4444), monitor wall glow to red
- `src/interior/floorFactory.js` — Added human model loading for first 2 agents per floor, idle breathing animation, removed unused robot arrays, added modelLoader import
- `src/interior/salesFloor.js` — Fixed npcGroups scope bug (moved to module level)
- `src/interior/ceoSuite.js` — Added emissive glow to glass walls
- `src/ui/hud.js` — Added floor name display with updateFloorName export, purple theme
- `src/ui/agentCard.js` — Added slide-in/out animation, purple border
- `src/ui/jarvisChat.js` — Width 380px -> 440px
- `src/ui/elevatorPanel.js` — All accents changed from blue to purple
- `src/ui/minimap.js` — Border and wall stroke changed to purple
- `src/ui/ceoDashboard.js` — Monitoring department color updated to red
- `src/main.js` — Added updateFloorName import and floor name mapping in switchToFloor

## Files Created
- `MEGA_BUILD_REPORT.md` — This report

## Performance Notes
- Floor culling active: only current floor group is visible, all others hidden via traverse
- Human NPC models limited to 2 per factory floor (total ~12 human models across 6 factory floors + 3 on sales + 1 JARVIS = ~16)
- Model caching via modelLoader.js prevents redundant GLTF loads
- NPC idle animations only run when floor is visible
- Screen texture updates throttled to every ~10 seconds
- Minimap updates at 4Hz only when visible
- Build output: 1,007 kB (282 kB gzip) -- single chunk, passes build
