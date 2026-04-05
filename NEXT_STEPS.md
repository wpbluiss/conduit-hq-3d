# Conduit HQ 3D -- Next Steps

---

## Priority Items for Next Session

### 1. Production Deployment
- The Supabase and Anthropic proxies only work in Vite dev mode
- Options: deploy a small Express/Hono server, use Vercel serverless functions, or Supabase Edge Functions
- Environment variables need secure handling in production

### 2. Agent Last Action Tags (4e)
- Match `workforce_activity_log.agent_name` to NPC name tags on the sales floor
- Update name tag sprites to show last action and timestamp
- Requires a name normalization/mapping layer between DB agent names and scene agent names

### 3. MRR Data Source
- HUD currently shows hardcoded $0 for MRR
- Need to identify or create a revenue/MRR table in Supabase
- Could aggregate from `sales_pipeline` where status = 'closed_won' or similar

### 4. CEO Dashboard Live Data
- Wire the CEO dashboard overlay to pull real stats from Supabase
- Department performance, agent utilization, revenue charts

---

## Nice-to-Have Improvements

### UI/UX
- Notification toasts when new activity appears (e.g., "HUNTER found a new lead")
- Click-to-inspect agents from the activity feed
- Sound effects for elevator arrival, agent greetings
- Loading screen with actual asset progress percentages
- Mobile/touch controls for tablet viewing

### Visual Polish
- Animated elevator doors opening/closing
- Window reflections on the tower exterior
- Day/night cycle tied to real time
- Weather effects (rain, clouds) based on real weather API
- Particle effects for JARVIS hologram

### Data Integration
- Real-time Supabase subscriptions (Realtime channels) instead of polling
- WebSocket connection for instant activity feed updates
- Historical charts in CEO dashboard (pipeline over time, calls per day)
- Agent status indicators (green/yellow/red) from live heartbeat data

---

## Performance Optimization Opportunities

### Code Splitting
- Dynamic `import()` for upper floor modules -- only load when player rides elevator
- Separate Three.js into its own chunk via Rollup manualChunks
- This would reduce initial bundle from ~994KB to ~400KB initial + lazy chunks

### Rendering
- Implement LOD (Level of Detail) for distant buildings in skyline
- Frustum culling awareness for NPC animations -- skip mixer updates for off-screen agents
- Consider instanced meshes for repeated desk/chair geometry
- Reduce shadow map resolution on lower-end GPUs

### Memory
- Dispose Three.js geometries and materials when floors become invisible
- Texture atlas for NPC name tags instead of individual canvas textures
- Pool and reuse materials across similar objects

---

## Ideas for Future Features

### Collaboration
- Multi-user mode: see other viewers walking around the office in real time
- Shared whiteboard in conference rooms
- Voice chat proximity zones

### AI Integration
- JARVIS could trigger actual Supabase mutations (assign leads, update pipeline)
- Natural language floor navigation ("take me to Engineering")
- AI-generated daily briefing when entering the CEO Suite
- Voice input for JARVIS (Web Speech API)

### Gamification
- Achievement system (visit all floors, talk to all agents)
- Daily challenge board in the lobby
- Leaderboard wall showing top-performing agents

### Analytics
- Heatmap of where the CEO spends time in the building
- Track which agents get inspected most often
- Dashboard usage analytics

### Extended World
- Parking garage / exterior courtyard
- Conference rooms with meeting scheduling
- Break room / kitchen area with ambient NPC animations
- Rooftop observation deck with city panorama
