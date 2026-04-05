/**
 * Live Agent Status — Bridges Supabase data to the 3D scene.
 *
 * Polls for agent tasks on floor switch and updates:
 * - Status LED colors on desk monitors
 * - Name tag status dots
 * - Floating action text
 *
 * Also listens for realtime task changes.
 */
import { fetchAgentTasks, onTaskChange, AGENT_DEPARTMENT } from './supabase.js';

// Department ID → floor Y mapping
const DEPT_FLOOR_Y = {
  sales: 50,
  marketing: 100,
  engineering: 150,
  content: 200,
  intelligence: 250,
  operations: 300,
  monitoring: 350,
};

// Floor Y → department ID
const FLOOR_Y_DEPT = {};
for (const [dept, y] of Object.entries(DEPT_FLOOR_Y)) {
  FLOOR_Y_DEPT[y] = dept;
}

// Store latest task data per agent
const agentTaskData = new Map();

// Registered listeners for visual updates
const updateCallbacks = [];

/**
 * Register a callback that will be called when agent data changes.
 * callback(agentName, taskInfo) where taskInfo = { status, title, taskType }
 */
export function onAgentUpdate(callback) {
  updateCallbacks.push(callback);
}

function notifyListeners(agentName, taskInfo) {
  for (const cb of updateCallbacks) {
    try {
      cb(agentName, taskInfo);
    } catch (e) {
      console.warn('[LiveAgent] callback error:', e);
    }
  }
}

/**
 * Fetch and cache live task data for all agents on a given floor.
 * Call this when switching floors.
 */
export async function refreshFloorAgents(floorY) {
  const department = FLOOR_Y_DEPT[floorY];
  if (!department) return;

  const tasks = await fetchAgentTasks(department);
  if (!tasks) return;

  for (const task of tasks) {
    agentTaskData.set(task.agentName, task);
    notifyListeners(task.agentName, task);
  }
}

/**
 * Get the current task info for an agent.
 * Returns: { status, title, taskType, createdAt, completedAt } or null
 */
export function getAgentTask(agentName) {
  return agentTaskData.get(agentName) || null;
}

/**
 * Map task status to a visual state for the 3D scene.
 * Returns: 'active' | 'idle' | 'completed'
 */
export function getAgentVisualState(agentName) {
  const task = agentTaskData.get(agentName);
  if (!task) return 'idle';
  if (task.status === 'in_progress') return 'active';
  if (task.status === 'completed') return 'completed';
  if (task.status === 'pending') return 'idle';
  return 'idle';
}

/**
 * Get the LED color for an agent's current state.
 * Returns: hex color number
 */
export function getAgentLEDColor(agentName) {
  const state = getAgentVisualState(agentName);
  switch (state) {
    case 'active': return 0x10b981; // green
    case 'completed': return 0x10b981; // green (flash handled elsewhere)
    case 'idle': return 0xeab308; // yellow
    default: return 0xeab308;
  }
}

/**
 * Get display text for an agent's current task (for floating text / monitor).
 */
export function getAgentDisplayText(agentName) {
  const task = agentTaskData.get(agentName);
  if (!task) return null;
  if (task.status === 'in_progress') return task.title;
  if (task.status === 'completed') return `\u2713 ${task.title}`;
  if (task.status === 'pending') return `Queued: ${task.title}`;
  return task.title;
}

// Subscribe to realtime task changes
onTaskChange((data) => {
  agentTaskData.set(data.agentName, data);
  notifyListeners(data.agentName, data);
});

// Auto-refresh current floor every 30 seconds
let currentFloorY = 0;

export function setCurrentFloor(floorY) {
  currentFloorY = floorY;
  refreshFloorAgents(floorY);
}

setInterval(() => {
  if (currentFloorY > 0) {
    refreshFloorAgents(currentFloorY);
  }
}, 30_000);
