/**
 * Supabase Live Data Module
 * Connects directly to Supabase using @supabase/supabase-js.
 * Provides real-time agent status, activity feed, HUD metrics,
 * and monitor screen content from live business data.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('[SUPABASE] Connected to', SUPABASE_URL);
} else {
  console.warn('[SUPABASE] Missing env vars — running in offline mode');
}

// ============================================================
// Role → HQ Agent Name Mapping
// Maps client_tasks.assigned_to (role names) to 3D HQ agent names
// ============================================================
const ROLE_TO_AGENT = {
  // Sales
  'Hunter': 'HUNTER',
  'Closer': 'CLOSER',
  'Negotiator': 'STRIKER',
  'Pipeline Manager': 'REX',
  'Qualifier': 'DEMO',
  'Outreach Specialist': 'REPLY',
  // Marketing
  'Ad Manager': 'NOVA',
  'Brand Strategist': 'ARIA',
  'Content Creator': 'LOCAL',
  'SEO Specialist': 'REFERRAL',
  'Social Media Manager': 'COMMUNITY',
  // Engineering
  'Backend Dev': 'BYTE',
  'Frontend Dev': 'WEBMASTER',
  'DevOps': 'CRM',
  'QA Tester': 'ONBOARD',
  'Mobile Dev': 'BYTE',
  // Content
  'Writer': 'SAGE',
  'Graphic Designer': 'VIBE',
  'Copywriter': 'SOCIAL',
  'Video Producer': 'VIRAL',
  'Editor': 'AB TEST',
  // Intelligence
  'Data Analyst': 'LEARNING',
  'Report Generator': 'FORECAST',
  'Market Researcher': 'RESEARCH',
  'Trend Scout': 'STRATEGY',
  'Competitor Tracker': 'BRAND',
  // Operations
  'Onboarding': 'OTTO',
  'Invoicing': 'CFO',
  'Changelog Manager': 'BILLING',
  'Client Success': 'CS',
  'Scheduler': 'SMS',
  'HR Manager': 'OTTO',
  'Receptionist': 'CS',
};

// Department lookup for agent names
const AGENT_DEPARTMENT = {};
const deptAgents = {
  sales: ['HUNTER', 'CLOSER', 'STRIKER', 'REX', 'DEMO', 'REPLY'],
  marketing: ['NOVA', 'ARIA', 'LOCAL', 'REFERRAL', 'COMMUNITY'],
  engineering: ['BYTE', 'WEBMASTER', 'CRM', 'ONBOARD'],
  content: ['SAGE', 'VIBE', 'SOCIAL', 'VIRAL', 'AB TEST'],
  intelligence: ['LEARNING', 'FORECAST', 'RESEARCH', 'STRATEGY', 'BRAND'],
  operations: ['OTTO', 'CFO', 'BILLING', 'CS', 'SMS'],
  monitoring: ['WATCHDOG', 'ANALYTICS'],
};
for (const [dept, agents] of Object.entries(deptAgents)) {
  for (const a of agents) AGENT_DEPARTMENT[a] = dept;
}

export function resolveAgentName(assignedTo) {
  if (!assignedTo) return null;
  // Direct match (workforce_activity_log uses agent names directly)
  const upper = assignedTo.toUpperCase();
  if (AGENT_DEPARTMENT[upper]) return upper;
  // Role mapping (client_tasks uses role names)
  return ROLE_TO_AGENT[assignedTo] || null;
}

// ============================================================
// Response Cache — avoids hammering API
// ============================================================
const cache = new Map();
const CACHE_TTL = 30_000; // 30 seconds

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

// ============================================================
// PRIORITY 1: Live Agent Status from client_tasks
// ============================================================

/**
 * Fetch recent tasks for agents, optionally filtered by department.
 * Returns: [{ agentName, status, title, taskType, createdAt, completedAt }]
 */
export async function fetchAgentTasks(department = null) {
  if (!supabase) return null;
  const cacheKey = `agent-tasks-${department || 'all'}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    let query = supabase
      .from('client_tasks')
      .select('assigned_to, status, title, task_type, created_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(50);

    const { data, error } = await query;
    if (error) throw error;

    // Also fetch from workforce_activity_log for richer data
    const { data: activityData } = await supabase
      .from('workforce_activity_log')
      .select('agent_name, action, description, created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    // Merge into a unified agent status map
    const agentStatus = {};

    // Process client_tasks
    if (data) {
      for (const task of data) {
        const agentName = resolveAgentName(task.assigned_to);
        if (!agentName) continue;
        if (department && AGENT_DEPARTMENT[agentName] !== department) continue;
        if (!agentStatus[agentName]) {
          agentStatus[agentName] = {
            agentName,
            status: task.status,
            title: task.title,
            taskType: task.task_type,
            createdAt: task.created_at,
            completedAt: task.completed_at,
          };
        }
      }
    }

    // Process workforce_activity_log (fills in agents not in client_tasks)
    if (activityData) {
      for (const entry of activityData) {
        const agentName = entry.agent_name?.toUpperCase();
        if (!agentName || !AGENT_DEPARTMENT[agentName]) continue;
        if (department && AGENT_DEPARTMENT[agentName] !== department) continue;
        if (!agentStatus[agentName]) {
          agentStatus[agentName] = {
            agentName,
            status: 'completed',
            title: entry.description || entry.action,
            taskType: entry.action,
            createdAt: entry.created_at,
            completedAt: entry.created_at,
          };
        }
      }
    }

    const result = Object.values(agentStatus);
    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.warn('[SUPABASE] fetchAgentTasks failed:', e);
    return null;
  }
}

// ============================================================
// PRIORITY 2: Activity Feed (real completed tasks + activity)
// ============================================================

/**
 * Fetch recent activity for the feed sidebar.
 * Returns: [{ agentName, action, details, createdAt }]
 */
export async function fetchRecentActivity(limit = 15) {
  if (!supabase) return null;
  const cached = getCached('recent-activity');
  if (cached) return cached;

  try {
    // Get completed tasks
    const { data: tasks } = await supabase
      .from('client_tasks')
      .select('assigned_to, title, status, task_type, completed_at')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit);

    // Get workforce activity log
    const { data: activity } = await supabase
      .from('workforce_activity_log')
      .select('agent_name, action, description, category, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Merge and sort by time
    const merged = [];

    if (tasks) {
      for (const t of tasks) {
        const agentName = resolveAgentName(t.assigned_to) || t.assigned_to;
        merged.push({
          agent_name: agentName,
          action: `completed: ${t.title}`,
          details: `Task type: ${t.task_type}`,
          created_at: t.completed_at || t.created_at,
        });
      }
    }

    if (activity) {
      for (const a of activity) {
        merged.push({
          agent_name: a.agent_name,
          action: a.action,
          details: a.description,
          created_at: a.created_at,
        });
      }
    }

    // Sort by date descending, take top N
    merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const result = merged.slice(0, limit);

    setCache('recent-activity', result);
    return result;
  } catch (e) {
    console.warn('[SUPABASE] fetchRecentActivity failed:', e);
    return null;
  }
}

// ============================================================
// PRIORITY 3: HUD Real Metrics
// ============================================================

/**
 * Fetch live HUD metrics.
 * Returns: { activeClients, messagesToday, tasksDoneToday, callsToday, pipelineTotal, pipelineProspects }
 */
export async function fetchHUDMetrics() {
  if (!supabase) return null;
  const cached = getCached('hud-metrics');
  if (cached) return cached;

  try {
    const today = new Date().toISOString().split('T')[0];

    const [clientsRes, msgsRes, tasksRes, callsRes, pipelineRes] = await Promise.all([
      supabase
        .from('client_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('onboarding_complete', true)
        .neq('role', 'ceo'),
      supabase
        .from('client_conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today),
      supabase
        .from('client_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('completed_at', today),
      supabase
        .from('calls')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', today),
      supabase
        .from('sales_pipeline')
        .select('estimated_value'),
    ]);

    const pipelineTotal = pipelineRes.data
      ? pipelineRes.data.reduce((sum, r) => sum + (parseFloat(r.estimated_value) || 0), 0)
      : 0;

    const result = {
      activeClients: clientsRes.count || 0,
      messagesToday: msgsRes.count || 0,
      tasksDoneToday: tasksRes.count || 0,
      callsToday: callsRes.count || 0,
      pipelineTotal,
      pipelineProspects: pipelineRes.data?.length || 0,
    };

    setCache('hud-metrics', result);
    return result;
  } catch (e) {
    console.warn('[SUPABASE] fetchHUDMetrics failed:', e);
    return null;
  }
}

// Legacy compat exports used by existing code
export async function fetchPipelineStats() {
  const metrics = await fetchHUDMetrics();
  if (!metrics) return null;
  return { total: metrics.pipelineTotal, prospects: metrics.pipelineProspects };
}

export async function fetchTodayCalls() {
  const metrics = await fetchHUDMetrics();
  return metrics?.callsToday ?? null;
}

// ============================================================
// PRIORITY 5: Monitor Screen Data (per-department)
// ============================================================

/**
 * Fetch real data for department monitor screens.
 * Returns department-specific data object.
 */
export async function fetchMonitorData(department) {
  if (!supabase) return null;
  const cacheKey = `monitor-${department}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    let result = null;

    switch (department) {
      case 'sales': {
        const { data } = await supabase
          .from('sales_pipeline')
          .select('business_name, stage, estimated_value, assigned_agent, last_action')
          .order('updated_at', { ascending: false })
          .limit(10);
        result = { leads: data || [] };
        break;
      }
      case 'marketing': {
        const { data } = await supabase
          .from('client_tasks')
          .select('title, status, task_type, completed_at')
          .in('task_type', ['content', 'social_media', 'seo', 'advertising', 'brand_strategy'])
          .order('created_at', { ascending: false })
          .limit(8);
        result = { tasks: data || [] };
        break;
      }
      case 'engineering': {
        const { data } = await supabase
          .from('client_tasks')
          .select('title, status, task_type, completed_at')
          .in('task_type', ['website', 'backend', 'deployment', 'testing', 'mobile'])
          .order('created_at', { ascending: false })
          .limit(8);
        result = { tasks: data || [] };
        break;
      }
      case 'operations': {
        const { data } = await supabase
          .from('client_tasks')
          .select('title, status, task_type, completed_at')
          .in('task_type', ['invoicing', 'client_success', 'scheduling', 'onboarding_help', 'changelog'])
          .order('created_at', { ascending: false })
          .limit(8);
        result = { tasks: data || [] };
        break;
      }
      case 'content': {
        const { data } = await supabase
          .from('client_tasks')
          .select('title, status, task_type, completed_at')
          .in('task_type', ['writing', 'design', 'copywriting', 'video', 'editing'])
          .order('created_at', { ascending: false })
          .limit(8);
        result = { tasks: data || [] };
        break;
      }
      case 'intelligence': {
        const { data } = await supabase
          .from('client_tasks')
          .select('title, status, task_type, completed_at')
          .in('task_type', ['analysis', 'reporting', 'market_research', 'trends', 'competitor_analysis'])
          .order('created_at', { ascending: false })
          .limit(8);
        result = { tasks: data || [] };
        break;
      }
      case 'monitoring': {
        const { data } = await supabase
          .from('workforce_activity_log')
          .select('agent_name, action, description, created_at')
          .eq('agent_name', 'WATCHDOG')
          .order('created_at', { ascending: false })
          .limit(10);
        result = { checks: data || [] };
        break;
      }
    }

    if (result) setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.warn('[SUPABASE] fetchMonitorData failed:', e);
    return null;
  }
}

// ============================================================
// Realtime Subscriptions
// ============================================================

const realtimeListeners = [];

/**
 * Subscribe to realtime changes on client_tasks.
 * Callback receives: { agentName, status, title, taskType, createdAt, completedAt }
 */
export function onTaskChange(callback) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('hq-tasks')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'client_tasks' }, (payload) => {
      const row = payload.new;
      if (!row) return;
      const agentName = resolveAgentName(row.assigned_to);
      if (!agentName) return;
      // Invalidate caches
      cache.delete(`agent-tasks-${AGENT_DEPARTMENT[agentName]}`);
      cache.delete('agent-tasks-all');
      cache.delete('recent-activity');
      cache.delete('hud-metrics');
      callback({
        agentName,
        status: row.status,
        title: row.title,
        taskType: row.task_type,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        eventType: payload.eventType,
      });
    })
    .subscribe();

  realtimeListeners.push(channel);
  return () => supabase.removeChannel(channel);
}

/**
 * Subscribe to realtime changes on workforce_activity_log.
 * Callback receives: { agentName, action, description, createdAt }
 */
export function onActivityChange(callback) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('hq-activity')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'workforce_activity_log' }, (payload) => {
      const row = payload.new;
      if (!row) return;
      cache.delete('recent-activity');
      callback({
        agentName: row.agent_name,
        action: row.action,
        description: row.description,
        createdAt: row.created_at,
      });
    })
    .subscribe();

  realtimeListeners.push(channel);
  return () => supabase.removeChannel(channel);
}

/**
 * Fetch JARVIS context: recent tasks + activity for system prompt enrichment.
 */
export async function fetchJarvisContext() {
  if (!supabase) return null;
  const cached = getCached('jarvis-context');
  if (cached) return cached;

  try {
    const [tasksRes, activityRes, metricsRes] = await Promise.all([
      supabase
        .from('client_tasks')
        .select('assigned_to, title, status, task_type, created_at')
        .order('created_at', { ascending: false })
        .limit(15),
      supabase
        .from('workforce_activity_log')
        .select('agent_name, action, description, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      fetchHUDMetrics(),
    ]);

    const result = {
      recentTasks: tasksRes.data || [],
      recentActivity: activityRes.data || [],
      metrics: metricsRes,
    };

    setCache('jarvis-context', result);
    return result;
  } catch (e) {
    console.warn('[SUPABASE] fetchJarvisContext failed:', e);
    return null;
  }
}

export { supabase, AGENT_DEPARTMENT };
