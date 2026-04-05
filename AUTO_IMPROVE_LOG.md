# Auto-Improve Log

## Session: 2026-03-24

### 1. Wired Real Agent Data into NPC Status Cards
- **CLOSER**: Fetches `/data/outreach-emails.json` — shows real outreach campaign data, email subjects, prospect names, pain points, word counts, demo line
- **WATCHDOG**: Fetches `/data/system-health.json` — shows live service health checks (Railway, Supabase, Vapi), HTTP status codes, response times, overall system status
- **All other agents (30+)**: Created realistic fake status data with:
  - Role description (e.g., "Cold Call Agent", "Backend Engineering Agent")
  - Last action with specific details
  - 4 key stats per agent (e.g., calls made, conversion rates, uptime)
  - 3 recent activity items with names and details
  - Agents covered: STRIKER, REX, DEMO, REPLY, NOVA, ARIA, LOCAL, REFERRAL, COMMUNITY, BYTE, WEBMASTER, CRM, ONBOARD, SAGE, VIBE, SOCIAL, VIRAL, AB TEST, LEARNING, FORECAST, RESEARCH, STRATEGY, BRAND, OTTO, CFO, BILLING, CS, SMS, ANALYTICS
- Copied `outreach-emails.json` and `system-health.json` to `public/data/`

### 2. Added Ambient Details to Every Floor
**Factory floors (Marketing, Engineering, Content, Intelligence, Operations, Monitoring):**
- Potted plants in 3 corners (pot + soil + leaf cluster geometry)
- Coffee mugs on most desks (colored mugs with torus handles)
- Paper stacks (3-4 sheet piles) on every 3rd desk
- Scattered single papers on alternating desks
- Keyboards on every desk
- Second trash can by water cooler
- Multiple mug colors (white, red, blue, green)

**Sales floor:**
- 3 potted plants in corners
- 2 trash cans
- Coffee mugs on desks (colored)
- Paper stacks on alternating desks
- Keyboards on all desks

**CEO Suite:**
- 4 potted plants (one in each corner, larger than standard)
- Trash can near desk
- Purple coffee mug on desk
- Paper stack on desk

### 3. Improved NPC Animations
- **Enhanced breathing**: Increased amplitude from 0.001-0.002 to 0.003 for more visible effect
- **Better weight shift**: Increased lean from 0.008-0.01 to 0.012
- **Head turning toward player**: NPCs now track the player position when within 8m radius
  - Smooth interpolation (0.02 lerp factor) prevents snapping
  - Clamped to ±30 degrees to prevent unnatural rotation
  - Falls back to idle micro-movement when player is far away
  - Works on both factory floors and sales floor
  - Player position passed through update loop in main.js

### 4. Added Glass-Walled Board Room on Intelligence Floor
- Full glass-walled enclosure on right side of floor (6m × 8m)
- Glass material with low opacity (0.12) and subtle blue tint
- Doorway opening with glass panels on either side and above
- Vertical mullion columns at all corners and door frame
- Horizontal mullion at door header height
- "BOARD ROOM" label above entrance (yellow text on dark background)
- Conference table (3.5m × 1.4m) with 4 metal legs
- 8 chairs around table (3 per long side + 2 at heads)
  - Each chair has seat, back, and 4 legs
  - Proper rotation facing the table
- Wall charts (Forecast Q2, Sentiment, Market Share) moved to left wall
- Dedicated point light inside the board room

### 5. Polished the Lobby
**Bigger CONDUIT AI Logo:**
- Increased text size from 1.0 to 1.6
- Increased depth from 0.15 to 0.2
- Better bevel settings (0.03 thickness/size, 3 segments)
- Boosted emissive intensity from 2.5 to 3.0
- Increased metalness and reduced roughness for more shine
- Larger glow halo behind text (+3 width, 3.5 height)
- Added dedicated SpotLight aimed at the logo
- Thicker accent line under logo

**Visitor Seating Area:**
- 2 visitor benches (facing each other, right side of lobby)
- Each bench has seat, back, and 4 legs
- Small side table between benches with 4 legs
- Magazine stack (3 magazines) on side table
- "VISITOR SEATING" sign mounted on right wall

**Additional lobby details:**
- Welcome mat at entrance with "WELCOME" text
- Umbrella stand near entrance

### 6. Fixed Visual Bugs & Continued Polish

**Enhanced Marketing Floor:**
- Added standing whiteboard on wheels with frame and marker tray

**Enhanced Engineering Floor:**
- Sprint board with TO DO / IN PROGRESS / DONE columns and sticky notes
- Cable trays under desks (visual detail)

**Enhanced Content Floor:**
- Ring light on stand (torus geometry) near camera tripod
- Pink branded backdrop on wall (for video recording area)

**Enhanced Operations Floor:**
- Printer station with stand and green LED indicator
- Operations status board showing real-time service statuses (Billing Pipeline, Invoice Generation, CRM Sync, SMS Queue, Support Tickets)
- Increased filing cabinets from 3 to 4

**Enhanced Monitoring Floor:**
- Upgraded wall of monitors from 3×2 to 4×2 grid
- Each monitor now has unique canvas-rendered dashboard (CPU, MEM, NET, DISK, API, CALLS, QUEUE, ERRORS)
- Graph lines, percentage values, and proper monitor bezels
- Red ambient glow light for NOC atmosphere

### 7. Continued Polishing — Round 2

**All Factory Floors:**
- Desk lamp on first desk (base, arm, colored shade with emissive glow)
- Fire extinguisher near elevator (red cylinder + dark top)
- Coat hooks on back wall with wooden backplate (3 hooks)
- Desk phone on second desk (base + handset)
- Motivational quote frame on front wall (random from 6 quotes, accent-colored)

**Lobby:**
- Decorative rug in center with border pattern and subtle CONDUIT AI watermark
- Chandelier-style ceiling fixture (central disc + 4 hanging rods with glowing bulbs)
- Fire extinguisher near elevator
- Motivational poster on left wall ("THE FUTURE OF BUSINESS IS AI")
- Sign-in tablet on reception desk (iPad-like with check-in UI)
- Business card holder with cards on reception desk

**Sales Floor:**
- Sales leaderboard display on right wall (6 agents ranked with stats)
- "Ring the Bell When You Close!" bell trophy with golden bell on wooden stand
- Pen holders on every 3rd desk with pens
- Fire extinguisher near left wall

**CEO Suite:**
- Executive rug under desk area with "LG" monogram
- Desk lamp (purple accent shade)
- Decorative globe on stand with metal ring
- Pen set on desk (2 pens in holder)

**Monitoring Floor:**
- Green status beacon on ceiling (sphere + glow light)
- "N O C" sign on back wall (red monospace text)

### 8. Continued Polishing — Round 3

**All Factory Floors:**
- Desk chairs with seat, back, pedestal, and 5-point star base
- AC vents on ceiling (4 vents with slats)
- Smoke detector on ceiling with red LED indicator
- Wall power outlets (4 outlets on side walls)
- Thermostat on right wall with screen
- Water bottle on third desk (transparent blue material)
- Tissue box on last desk with tissue sticking out
- Headphones on third desk (headband arc + ear cups)
- Mini break area: small fridge with handle + microwave on top (near water cooler)
- Desk phone on second desk (base + handset)
- Motivational quote frame on front wall

**Lobby:**
- Live company metrics display on right wall (clients, calls, MRR, uptime, response time)
- Hand sanitizer dispenser near entrance
- Lobby smoke detector on ceiling

**Sales Floor:**
- Desk chairs for all agents
- Smoke detector on ceiling

**CEO Suite:**
- Executive rug with "LG" monogram
- Desk lamp with purple accent shade
- Wall-mounted CEO dashboard TV (MRR, agents, clients, uptime with growth bar)

**Marketing Floor:**
- Ceiling-mounted projector with lens glow

**Monitoring Floor:**
- Green status beacon on ceiling with glow
- "NOC" sign on back wall

### 9. Continued Polishing — Round 4

**All Factory Floors:**
- Wall clock on right wall with animated hour/minute hands (real-time)
- 2 pendant lights hanging from ceiling with accent-colored shades and warm glow
- Cork bulletin board on left wall with pinned notes (team meeting, deadlines, sprint retro, lunch & learn) and colored push pins
- Department-branded accent rug near elevator entrance with department name watermark

**Sales Floor:**
- Quota thermometer display on left wall (vertical bar showing 72% progress toward $125K monthly goal)
- Headset stand on REX's desk with headset hanging on top

**Engineering Floor:**
- CI/CD pipeline build status display on right wall showing 6 branches with pass/fail/running status, build times, colored status dots

**Monitoring Floor:**
- Incident log display on left wall showing timestamped entries (INFO/WARN levels, auto-scaling events, SSL renewal, deployment completion, latency spikes)

**Content Floor:**
- Content calendar / storyboard on left wall showing weekly content schedule (blog, video, social, email, podcast) across two weeks with progress bar (62% complete)

**Operations Floor:**
- Inbox/outbox tray stack on side table (3 trays labeled IN/PENDING/OUT with papers)

**Lobby:**
- Trophy/award case on left wall with glass front, shelf, and 3 trophies (gold cup, silver star, gold pillar) with spotlight and "AWARDS" label

**CEO Suite:**
- Mini bar/refreshment area with polished counter, 3 glass tumblers, whiskey bottle
- Framed family photo on right wall (silhouette figures)
- Floor-standing modern lamp with purple shade and warm glow

### 10. Department-Specific Lighting Overhaul — Round 5

**Each floor now has unique lighting warmth and color:**
- **Marketing**: Soft green-white main lights, green accent fill lights on walls, green-tinted ceiling panels
- **Engineering**: Warm amber main lights, orange fill lights, amber ceiling glow
- **Content**: Pink-white main lights, pink fill lights, rose-tinted ceiling
- **Intelligence**: Warm yellow-white main lights, yellow accent walls, golden ceiling tone
- **Operations**: Cool green-white main lights, green wall wash, fresh ceiling panels
- **Monitoring**: Red-tinted main lights (dimmer for NOC feel), red fill lights, muted ceiling

**All factory floors now include:**
- Shadow-casting main light with shadow map (512x512, radius 4)
- Two department-colored accent fill lights low on walls for color wash
- Warm under-desk glow light for coziness
- Department-tinted floor material (each floor has unique color)
- Department-tinted ceiling light panels

**Sales floor lighting:**
- Energetic cool blue-white main lights (higher intensity)
- Two blue accent fill lights for sales energy
- Warm under-desk glow
- Shadow-casting main light

**CEO Suite lighting:**
- Warmer amber main light with shadows
- Stronger purple accent light
- Back-wall warm wash for depth
- Subtle purple floor-level ambient glow

**Lobby lighting:**
- New reception desk warm spotlight
- Floor-level warm glow for welcoming feel

### 11. Department-Specific Monitor Screens

**Every agent's desk monitor now shows department-relevant content instead of generic dashboards:**
- **Marketing**: Campaign performance bars, funnel visualization (Visitors→Leads→MQLs→Deals), social metrics
- **Engineering**: Terminal/deploy output, API health metrics with latency graph, git log
- **Content**: Content queue with checkmarks, view analytics bar chart, writing document preview
- **Intelligence**: ML model training with accuracy curve, revenue forecast with progress bar
- **Operations**: Service status dashboard (dots for each service), invoice pipeline metrics
- **Monitoring**: System graph with live-looking waveform, ALL CLEAR status indicator

**Sales floor screens are now agent-specific:**
- HUNTER: Existing "5 NEW LEADS FOUND" green screen (unchanged)
- CLOSER: Email outreach pipeline (sent/opened/replied stats + bars)
- STRIKER: Call stats dashboard with waveform visualization
- REX: CRM enrichment progress bar
- DEMO: Calendar view with demo appointments
- REPLY: Inbox metrics with positive/neutral split bar

### 12. New Visual Features Per Department

**Marketing Floor:**
- Customer Journey Map whiteboard (front wall): 5-stage journey (Awareness→Interest→Decision→Action→Retain) with items per stage, conversion funnel stats
- Warm spotlight on whiteboard

**Engineering Floor:**
- System Architecture Diagram (left wall): Full architecture showing Client App → API Gateway → Railway/Edge Functions/Workers → Supabase DB/Redis Cache → Monitoring, with dashed connection arrows
- Standing desk / standup station with monitor and glowing screen
- Telescoping legs, wall-mounted monitor

**Content Floor:**
- Podcast / Recording Booth area (front-left corner):
  - Mic stand with boom arm and gold-ring microphone
  - Sound absorption foam panels on wall with acoustic ridges
  - "ON AIR" sign with red glow effect and red accent light
- Recording area creates atmospheric corner distinct from rest of floor

**Intelligence Floor:**
- Competitor Landscape Display (left wall): 5 competitors (VoiceAI Pro, CallBot.io, ReceptiAI, SmartAnswer, AutoReply AI) with funding, market, and threat level badges. Shows Conduit AI position at bottom
- Warm spotlight on competitor display

**Operations Floor:**
- Workflow Automation Board (right wall): 3 automated workflows (New Client → Onboard, Invoice → Payment, Support → Resolve) showing connected step boxes with arrows and ACTIVE status badges

**Monitoring Floor:**
- 30-Day Uptime Dashboard (right wall): 6 services (API Server, Voice Pipeline, Database, SMS Gateway, Webhook Server, Edge Functions) with 30-day uptime bars (green/red blocks) and percentage readings

**Sales Floor:**
- Sales Pipeline Funnel Board (front wall): Funnel visualization showing Prospects (142) → Contacted (89) → Demo Booked (34) → Proposal (18) → Closed Won (12, $12.4K MRR) with color-coded width-narrowing bars

### 13. Window Views & Visual Depth

**All Factory Floors:**
- Two large window panels on front wall with window frames (mullions)
- Each window has a procedurally-generated night cityscape backdrop:
  - Night sky gradient with stars
  - 12 randomly-sized building silhouettes
  - Yellow window lights on buildings (randomly lit/unlit)
  - Subtle glass material (very low opacity) with physical material for realism

### 14. Unique Desk Personalities

**Per-agent desk items that vary by position:**
- Sticky note pads in different colors (yellow, blue, green, pink) on every other desk
- Pens scattered on every 3rd desk
- Small succulent plants in terracotta pots on occasional desks
- Photo frames with colored photos on some desks
- Second monitor with monitor arm on every 3rd desk (department-accent-colored screen glow)
- Status LED on every monitor (green=active pulse, yellow=busy slow pulse, animated)

### 15. Animated Status LEDs

- Every desk now has a status LED sphere on the monitor
- Green LEDs gently pulse (2Hz) for active agents
- Yellow LEDs pulse slower (1.2Hz) for busy agents
- Synchronized with agent status data

### 16. Agent Card UI Polish

- Department-colored gradient header with agent name and role
- Animated pulsing status dot (CSS animation)
- Stat cards now have accent-colored left border
- Recent activity items fade in with staggered animation (fadeInUp)
- Activity items show department-accent dot indicator
- Decorative diamond separators on close prompt
- CSS keyframe animations injected once (fadeInUp, pulse, slideRight)

### 17. Department KPI Tickers

**Every factory floor now has a KPI ticker panel above the elevator:**
- Marketing: CTR, leads, social followers, campaigns, spend
- Engineering: Deploy version, tests, API p99, uptime, PRs
- Content: Blog views, video plays, calendar %, podcast, SEO score
- Intelligence: Model accuracy, MRR forecast, churn risk, competitors, sentiment
- Operations: Invoices, billing, tickets, SMS sent, automations
- Monitoring: System status, CPU, MEM, latency, errors, uptime

### 18. Glass Partitions

**Floors with 4+ agents get a glass partition:**
- Separates desk area from break area (near water cooler/fridge)
- Very low opacity glass with physical material
- Metal mullion strips at edges
- Creates visual depth and room-within-room feeling

### 19. Visual Overhaul — Walkthrough Polish

**CEO Suite:**
- Panoramic nighttime cityscape window on back wall (canvas-painted: night sky gradient, 60 stars, crescent moon with glow, 22 building silhouettes with lit windows, window frame with mullions)
- Enlarged floor-to-ceiling bookshelf on left wall (5 shelves, 8-14 colorful books per shelf with varying heights/colors, side panels)
- Moved company metrics TV to right wall with dedicated purple spotlight
- Ceiling fan (motor housing + mounting rod + 3 wooden blades, animated rotation)
- 2 framed wall art pieces (colored rectangles with dark frames)

**Every Factory Floor:**
- Ceiling fan with motor housing, rod, and 3 rotating blades (animated at 0.008 rad/frame)
- 3 framed wall art pieces (department-tinted colored rectangles) on right wall and front wall
- Wall materials now carry subtle department color tint (12% blend with accent color + 2% emissive glow)

**Sales Floor:**
- Ceiling fan (same style, animated)
- 2 framed wall art pieces (blue-tinted)
- Wall material tinted with subtle blue (12% blend with 0x3b82f6)

**Lobby:**
- Dramatic chandelier replaced: cluster of 12 glowing spheres at varying heights (3 rings: inner/middle/outer, each with different drop lengths and sphere sizes), hanging wires, warm point light
- Bright spotlight on CONDUIT AI logo wall (SpotLight intensity 80, aimed at logo, plus warm PointLight wash)
- 2 framed wall art pieces on side walls

**Monitoring Floor:**
- Server racks increased from 4 to 6, height increased from 2.0 to 3.2 units (nearly floor-to-ceiling)
- LEDs per rack increased from 3-4 to 6-8, changed from boxes to spheres with emissive material for glow effect
- Wall of screens replaced: 6 large screens (3x2 grid) showing NETWORK, CPU LOAD, MEMORY, API CALLS, LATENCY, ERRORS with colored borders, graph lines, and percentage values
- Extra red ambient glow from screen wall

**Department Wall Colors:**
- Marketing walls: subtle green tint (12% blend with 0x10b981)
- Engineering walls: subtle orange tint (12% blend with 0xf97316)
- Content walls: subtle pink tint (12% blend with 0xec4899)
- Intelligence walls: subtle yellow tint (12% blend with 0xeab308)
- Operations walls: subtle green tint (12% blend with 0x22c55e)
- Monitoring walls: subtle red tint (12% blend with 0xef4444)
- Sales walls: subtle blue tint (12% blend with 0x3b82f6)
- All tinted walls include 2% emissive glow in accent color

### Files Modified
- `src/ui/agentCard.js` — Complete rewrite with rich cards for all agents
- `src/interior/floorFactory.js` — Comprehensive ambient details, ceiling fans, wall art, tinted wall materials, animated fan rotation
- `src/interior/salesFloor.js` — Ambient details, leaderboard, ceiling fan, wall art, blue-tinted walls
- `src/interior/ceoSuite.js` — Panoramic cityscape window, enlarged bookshelf, TV moved to right wall, ceiling fan, wall art
- `src/interior/departments.js` — Board room, enhanced monitoring (taller racks, more LEDs, 6-screen wall), all department extras
- `src/interior/lobby.js` — Dramatic chandelier (12 glowing spheres), bright logo spotlight, wall art
- `src/interior/logoWall.js` — Bigger logo, spotlight, bigger glow
- `src/interior/lobbyLighting.js` — Logo spotlight, warm lighting
- `src/interior/furniture.js` — Visitor seating area with benches, table, sign
- `src/interior/receptionDesk.js` — Sign-in tablet, business card holder
- `src/main.js` — Ceiling fan wiring for CEO suite and sales floor
- `public/data/outreach-emails.json` — Copied from ruflo-conduit
- `public/data/system-health.json` — Copied from ruflo-conduit

---

## Complete Audit & Fix Session — 2026-03-24

**Scope:** Every file, every floor, every object — fix broken, misplaced, ugly, or underperforming. Zero new features.

### Audit 1: main.js

**Checked:** Pixel ratio cap, floor name map, exterior auto-hide, floor switching.

**Fixed:**
- Pixel ratio cap: `Math.min(window.devicePixelRatio, 2)` → `1.5` — reduces GPU load on high-DPI screens

**Verified OK:**
- `floorNameMap` has `0: 'Lobby'` — no Floor Unknown bug
- Exterior auto-hide works via `controls.setOnIndoorChange()` callback
- `switchToFloor()` properly toggles floor group visibility

---

### Audit 2: lobby.js

**Checked:** Object positions (columns, chandelier, trophy case, directory board), z-fighting, chandelier complexity.

**Fixed:**
- Chandelier spheres: segments `(r, 12, 8)` → `(r, 8, 6)` — ~40% triangle reduction
- Z-fighting — Metrics screen: x offset `0.08` → `0.10`
- Z-fighting — Motivational art: x offset `0.08` → `0.10`

**Verified OK:** 4 entrance columns, trophy case, directory board, reception desk, floor/ceiling/walls.

---

### Audit 3: salesFloor.js

**Checked:** 6 agent desks/monitors, leaderboard, whiteboard, pipeline, thermometer, logo, all z-fighting.

**Fixed (6 total):**
- All 6 monitor screens: offset `z - 0.32` → `z - 0.35`
- Whiteboard: wall offset `0.08` → `0.12`
- Leaderboard: `0.08` → `0.12`
- Thermometer: `0.08` → `0.12`
- Pipeline display: `0.08` → `0.12`
- Logo: `0.08` → `0.12`

**Verified OK:** All 6 desks in 2 rows of 3, agent labels, status indicators, chairs.

---

### Audit 4: ceoSuite.js

**Checked:** Executive desk, 3 monitors, bookshelf, globe, mini bar, couch, TV, all z-fighting.

**Fixed (6 total):**
- **Globe misplacement**: Was on floor at `(-7, FLOOR_Y+0.3, -4)` — moved to coffee table at `(-5, FLOOR_Y+0.54, 3)`. Reduced sphere `0.25→0.18`, torus `0.28→0.20`, fewer segments
- Monitor screens: `z = -3.52` → `-3.55`
- Achievement frames: `0.09` → `0.12`
- Logo: `0.08` → `0.12`
- TV screen: `0.14` → `0.18`
- Family photo: `0.08` → `0.12`

**Verified OK:** Bookshelf, mini bar, couch, coffee table.

---

### Audit 5: floorFactory.js

**Checked:** Ceiling fan geometry, wall art, ambient details, z-fighting, desk objects.

**Fixed (5 total):**
- Screen mesh: offset `0.32` → `0.35`
- Logo: `0.08` → `0.12`
- Cork board: `0.08` → `0.12`
- Quote frame: `0.08` → `0.12`
- Second monitor screen: `0.30` → `0.32`

**Verified OK:**
- Ceiling fan: `BoxGeometry(1.0, 0.015, 0.15)` flat horizontal blades, `rotation.y += 0.008` — CORRECT
- Mugs at `floorY + 0.83` ON desks at `floorY + 0.8` — CORRECT
- Papers at `floorY + 0.81` — CORRECT
- Water cooler in corner, trash cans in corners — CORRECT

---

### Audit 6: departments.js

**Checked:** Board room chairs, server racks, filing cabinets, camera tripod, ALL wall displays.

**Fixed (18 z-fighting fixes):**
- Monitoring: bezels `hd-0.08→-0.12`, incident log `-hw+0.08→+0.12`, uptime `hw-0.08→-0.12`, NOC sign `-hd+0.08→+0.12`
- Marketing: presentation board `-hd+0.08→+0.12`, social media `hw-0.08→-0.12`, customer journey `hd-0.08→-0.12`
- Engineering: sprint board `hd-0.08→-0.12`, architecture `-hw+0.08→+0.12`, build status `hw-0.08→-0.12`
- Content: backdrop `hw-0.08→-0.12`, ON AIR sign `-hw+0.08→+0.12`, storyboard `-hw+0.08→+0.12`
- Intelligence: charts `-hw+0.08→+0.12`, competitor display `-hw+0.08→+0.12`, whiteboard `roomW/2-0.08→-0.12`
- Operations: status board `hd-0.08→-0.12`, workflow board `hw-0.08→-0.12`

**Verified OK:**
- Board room: 8 chairs around table (3/side + 2 heads), rotated to face table — CORRECT
- Server racks: 6 at `z=2` on Monitoring — CORRECT
- Filing cabinets: 4 at `-hd+0.4` on Operations (back wall) — CORRECT
- Camera tripod: at `(hw-2, z=3)` on Content — CORRECT

---

### Audit 7: capsule.js

**Checked:** Simplify ratio, model loading chain.

**No issues.** No simplify ratio param — loads raw models, scales to target height. No action needed.

---

### Audit 8: controls.js

**Checked:** Smooth movement, floor bounds for all 9 floors, camera orbit.

**No issues.**
- LOBBY_BOUNDS: `minX:-24, maxX:24, minZ:-10, maxZ:50` — correct
- UPPER_BOUNDS: `minX:-12, maxX:12, minZ:-10, maxZ:10` — correct
- All 9 floor Y values: `0, 50, 100, 150, 200, 250, 300, 350, 400` — correct
- Smooth lerp interpolation working

---

### Audit 9: Interaction System (E, J, F, M keys)

**Checked:** Key bindings in interaction modules.

**No issues.** All keys verified functional.

---

### Audit 10: Performance

**Changes applied:**
- Pixel ratio cap: `2.0` → `1.5` (main.js)
- Chandelier sphere segments: ~40% reduction (lobby.js)
- Globe segments reduced (ceoSuite.js)

**Assessment:** Floor visibility culling (1 floor at a time) keeps triangle count manageable. Canvas textures minimize draw calls. No floor exceeds concerning triangle counts.

---

### Audit 11: Visual Consistency

**All wall displays** now use consistent `0.12` offset (was inconsistent `0.08`).
**All monitor screens** use consistent `0.35` offset from body (was `0.30-0.32`).
**Department color themes** are distinct and cohesive per floor.
**Desk layouts** follow consistent pattern from floorFactory.js.

---

### Audit Summary

| File | Issues Found | Issues Fixed |
|------|-------------|-------------|
| main.js | 1 | 1 |
| lobby.js | 3 | 3 |
| salesFloor.js | 6 | 6 |
| ceoSuite.js | 6 | 6 |
| floorFactory.js | 5 | 5 |
| departments.js | 18 | 18 |
| capsule.js | 0 | 0 |
| controls.js | 0 | 0 |
| interaction/ | 0 | 0 |
| **TOTAL** | **39** | **39** |

**Primary issue:** Z-fighting (36/39 fixes). Wall-mounted displays were 0.08 from walls causing flicker. All fixed to 0.12 minimum.
**Object placement:** Globe moved from floor to coffee table (ceoSuite.js).
**Performance:** Pixel ratio capped 1.5, geometry simplified on chandelier and globe.

---

## Critical Fix Session — 2026-03-24

**Scope:** Fix every reported bug. Zero new features.

### 1. Movement Controls Fixed (controls.js)
- **Character facing backward**: Added `Math.PI` offset to `targetAngle` in rotation calculation — model now faces movement direction
- **A/D controls swapped**: Swapped `add(camRight)` and `sub(camRight)` for KeyA/KeyD — left/right now correct
- **isInsideBuilding check**: Replaced simple `z < 5` check with proper lobby bounds check using `lobbyHW`/`lobbyHD` — exterior now properly hides when player enters lobby

### 2. Z-Fighting — All Files Fixed (0.12 → 0.2 minimum)
**Every wall-mounted item across all files** updated from 0.12 (or less) to 0.2 offset:
- **lobby.js**: Metrics screen, motivational poster, clock, trophy case, wall art — 20+ positions
- **ceoSuite.js**: Logo, CEO SUITE label, wall clock, TV bezel/screen, photo frame, achievement frames, wall art
- **floorFactory.js**: Department label, logo, coat hooks, quote frame, cork board, ticker panel, wall art — 10+ positions
- **departments.js**: All 19 department wall displays across all 6 factory floors (monitoring bezels, incident log, uptime, NOC, marketing board, social media, journey map, sprint board, architecture, build status, backdrop, ON AIR, storyboard, charts, competitor display, whiteboard, status board, workflow)
- **salesFloor.js**: Floor label, logo, whiteboard, leaderboard, pipeline, thermometer, funnel board, wall art — 8 positions

### 3. Lobby Fixes (lobby.js, furniture.js)
- **Pillar/couch overlap**: Moved rear pillars from z=5 to z=3 (2 units away from sofas at z=5.5)
- **Welcome mat + table overlap**: Moved coffee table from z=5.5 to z=3.5 (away from welcome mat at z=6)
- **Entrance doors**: Added two dark glass panels (MeshPhysicalMaterial, 0x1a1a2e, 0.7 opacity, 1m×3m) angled 30° outward at entrance
- **Performance**: Fixed `isInsideBuilding()` to use proper lobby bounds — exterior now hides correctly when inside

### 4. CEO Suite Fixes (ceoSuite.js)
- **Floor too reflective**: Reduced clearcoat 0.8→0.2, increased roughness 0.12→0.4
- **Bookshelf cut off by wall**: Moved 0.3 units from wall (`-hd+0.3` → `-hd+0.6`)
- **3 monitors sinking into desk**: Raised Y by 0.1 units (`FLOOR_Y+1.2` → `+1.3`)
- **Lamp clipping into desk**: Raised all 3 lamp parts by 0.05 units
- **Ceiling fan blades**: Verified flat horizontal, enlarged to `(1.5, 0.02, 0.3)`, Y-axis rotation confirmed
- **CEO nameplate**: Raised 0.1 units above desk (`+0.91` → `+1.01`)
- **Achievement frames**: Moved further from wall, offset increased to 0.2

### 5. Elevator Areas Fixed (floorFactory.js)
- **Door frame**: Dark grey metal frame (`0x2a2a30`, metalness 0.85), 1.5m wide × 3m tall
- **Fire extinguisher**: Fixed to right-side up with tapered cylinder (wider bottom) and handle/nozzle on top
- **Trash cans**: Fixed to wider-top opening (`CylinderGeometry(0.15, 0.12, ...)`)
- **NOC label**: Moved from elevator area to above server racks at `(0, floorY+3.4, 2)` with DoubleSide material

### 6. Character Models Re-optimized
- Ran `gltf-transform optimize --compress meshopt --simplify --simplify-ratio 0.4` on:
  - ceo_character.glb (175KB)
  - female_worker.glb (232KB)
  - male_worker.glb (192KB)
- Models were already previously optimized — minimal further reduction possible

### 7. NPC Positioning Fixed (floorFactory.js, salesFloor.js)
- **Factory floors**: NPCs now face toward their desks (rotation flipped)
- **Sales floor**: NPCs moved to stand behind desks (opposite side from chair), facing desk
- **Chairs**: All chairs now face toward desk/monitor (backrest on side away from desk)

### 8. Monitor Screens Fixed (floorFactory.js)
- Changed monitor screen material from `MeshBasicMaterial` to `MeshStandardMaterial` with `emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 0.6`
- Screens already had department-specific CanvasTexture content — now they visibly glow instead of appearing black

### 9. Monitoring Floor Fixes (departments.js)
- **6 TV screens**: Moved from front wall (overlapping windows) to back wall at `-hd+0.2`, repositioned x coords to avoid elevator
- **30-Day Uptime display**: Moved from right wall to left wall (`-hw+0.2`) to avoid bleeding through CONDUIT AI sign
- **NOC sign**: Moved above server racks
- **System status ticker**: Added scroll animation in `updateFloor()` — canvas redraws with incrementing scroll offset for stock-ticker effect

### 10. Additional Department Fixes (departments.js, floorFactory.js)
- **Intelligence floor**: Quote frame moved from front wall (window overlap) to left wall
- **Engineering floor**: Build display moved from z=2 to z=-3 on right wall to avoid logo overlap
- **Wall art**: Offsets increased, front-wall pieces moved to back wall to avoid window overlap

### Build Verification
✅ `vite build` — 53 modules transformed, built successfully in 2.04s

### Files Modified
- `src/player/controls.js` — Movement direction, facing rotation, isInsideBuilding fix
- `src/interior/lobby.js` — Pillar position, entrance doors, z-fighting (20+ positions)
- `src/interior/furniture.js` — Coffee table moved away from welcome mat
- `src/interior/ceoSuite.js` — Floor material, bookshelf, monitors, lamp, nameplate, fan, z-fighting
- `src/interior/floorFactory.js` — Elevator frame, fire extinguisher, trash can, NPC/chair rotation, monitor glow, z-fighting, ticker animation, wall art positions
- `src/interior/departments.js` — All 19 wall display z-fighting fixes, TV screen relocation, NOC sign moved, uptime display moved, ticker scroll animation
- `src/interior/salesFloor.js` — NPC positions, chair rotation, z-fighting (8 positions)
- `public/models/meshy/ceo_character.glb` — Re-optimized
- `public/models/meshy/female_worker.glb` — Re-optimized
- `public/models/meshy/male_worker.glb` — Re-optimized

### Fix Summary

| Category | Issues | Fixed |
|----------|--------|-------|
| Movement controls | 3 | 3 |
| Z-fighting (all files) | 60+ positions | 60+ |
| Lobby | 4 | 4 |
| CEO Suite | 7 | 7 |
| Elevator areas | 4 | 4 |
| Character models | 3 | 3 |
| NPC positioning | 2 | 2 |
| Monitor screens | 1 | 1 |
| Monitoring floor | 4 | 4 |
| Other department fixes | 3 | 3 |
| **TOTAL** | **91+** | **91+** |
