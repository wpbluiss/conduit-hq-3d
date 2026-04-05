# Conduit HQ 3D -- Overnight Build Report

**Date:** March 24, 2026
**Session:** Stage 4 (Supabase Live Data) Implementation

---

## Session Summary

Implemented Stage 4: Live Supabase data integration for the Conduit HQ 3D office building. The project now connects to the Supabase backend (project: mvuslmfjkkuizixjpkgl) to fetch real-time pipeline stats, agent activity logs, and call counts. A new activity feed overlay was added, and the HUD was upgraded to show live data with automatic refresh.

---

## Files Created

| File | Description |
|------|-------------|
| `src/data/supabase.js` | Data fetching module -- fetchPipelineStats, fetchRecentActivity, fetchTodayCalls |
| `src/ui/activityFeed.js` | Activity feed overlay -- toggle with F key, shows last 10 agent actions |
| `OVERNIGHT_BUILD_REPORT.md` | This report |
| `NEXT_STEPS.md` | Future development roadmap |

## Files Modified

| File | Changes |
|------|---------|
| `vite.config.js` | Added Supabase REST proxy at `/api/supabase`, refactored both proxies into single `apiProxies()` plugin |
| `src/ui/hud.js` | Imports Supabase functions, fetches live pipeline/calls data, auto-refreshes every 30s, falls back to defaults |
| `src/main.js` | Added import and initialization of `createActivityFeed` |

---

## Features Implemented (Stage 4)

### 4a. Supabase Proxy
- GET `/api/supabase?table=TABLE&select=COLS&limit=N&order=COL.desc` route in Vite dev server
- Reads `SUPABASE_SERVICE_KEY` from environment
- Forwards requests to `https://mvuslmfjkkuizixjpkgl.supabase.co/rest/v1/`
- Supports `table`, `select`, `limit`, `order`, and `filter` query params
- Filter param converts `column.operator.value` format to Supabase PostgREST syntax

### 4b. Data Fetching Module (`src/data/supabase.js`)
- `fetchPipelineStats()` -- queries `sales_pipeline` table, returns total estimated value and prospect count
- `fetchRecentActivity(limit)` -- queries `workforce_activity_log` table, returns latest agent actions
- `fetchTodayCalls()` -- queries `calls` table filtered by today's date, returns count
- All functions have try/catch with graceful fallback to null

### 4c. HUD Live Data
- Pipeline value and prospect count update from Supabase on load and every 30 seconds
- Calls count shown in engines slot
- Defaults remain visible if fetch fails

### 4d. Activity Feed Overlay
- Press F to toggle a scrollable activity feed on the left side of the screen
- Shows last 10 entries from `workforce_activity_log`
- Each entry displays: timestamp, agent name, action type, and details (truncated to 120 chars)
- Dark themed with green accent matching HUD
- Auto-refreshes every 30 seconds while open
- Cleans up interval when closed

### 4e. Agent Last Action on Sales Floor
- Skipped -- matching agent names from DB to scene NPCs requires name normalization logic that may not align. Marked for future work.

---

## Pre-existing Features (Stages 1-3)

### Stage 1: Exterior
- WebGPU renderer with ACES filmic tone mapping
- Procedural sky, HDR environment, warm fog
- Tower building with glass facade
- Animated "CONDUIT AI" signage with glow pulsing
- Skyline with surrounding buildings
- Palm trees, ground plane with models

### Stage 2: Interior (Lobby)
- Lobby with reception desk, furniture
- Elevator bank with proximity-triggered UI
- Logo wall, lobby lighting
- Receptionist NPC with greeting
- Elevator system to travel between floors

### Stage 3: Upper Floors
- Sales floor with agent NPCs and wall clocks
- CEO Suite at y=400 with JARVIS hologram
- Factory-built department floors (Marketing, Engineering, Content, Intelligence, Operations, Monitoring)
- JARVIS chat panel (J key) backed by Claude API
- HUD overlay, agent inspection cards, CEO dashboard
- Minimap with agent/desk positions
- Floor visibility culling for performance
- Ambient audio system

---

## Known Issues

1. **Chunk size warning:** Production bundle is ~994KB (Three.js is the bulk). Could be addressed with code splitting.
2. **Supabase proxy is dev-only:** The Vite middleware proxy only works during `npx vite` dev server. For production deployment, a server-side API or edge function would be needed.
3. **4e skipped:** Agent name matching between DB and scene is not implemented.
4. **MRR field:** Still shows $0 hardcoded -- no MRR table identified in Supabase schema.

---

## Performance Notes

- Build completes in ~2 seconds
- 53 modules transformed
- WebGPU renderer with shadow maps (PCFSoftShadowMap)
- Floor visibility culling: only the current floor renders animation mixers and updates
- FPS counter in top-left shows real-time triangle count and draw calls
- Pixel ratio capped at 2x to prevent GPU overload on HiDPI displays

---

## Architecture Overview

```
conduit-hq-3d/
  index.html              -- Entry point with loading screen
  vite.config.js          -- Dev server + API proxies (Anthropic, Supabase)
  src/
    main.js               -- App init, scene assembly, render loop
    constants.js          -- Shared constants (ELEVATOR, NPC, LOBBY)
    buildings/            -- Tower, signage, skyline
    scene/                -- Sky, lighting, environment, postprocessing
    world/                -- Ground, palms
    interior/             -- Lobby, floors, furniture, departments
    player/               -- Capsule (player model), controls, footsteps
    npc/                  -- Receptionist, humanoid factory, name tags
    interaction/          -- Proximity system, elevator system
    audio/                -- Ambient audio
    data/                 -- Supabase data fetching (NEW)
    ui/                   -- HUD, JARVIS chat, activity feed, agent card,
                             CEO dashboard, minimap, elevator panel, prompt overlay
    utils/                -- Texture helpers, model loader
  public/                 -- Static assets (models, textures, fonts, audio)
```
