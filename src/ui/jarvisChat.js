/**
 * JARVIS Chat Panel -- bottom-right overlay
 * Press J near JARVIS to toggle.
 *
 * Connects to Claude API directly with real Supabase data context.
 * Falls back to canned responses when API is unavailable.
 */
import { fetchJarvisContext } from '../data/supabase.js';

export function createJarvisChat() {
  let isOpen = false;

  // Container
  const container = document.createElement('div');
  container.id = 'jarvis-chat';
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 440px;
    height: 480px;
    background: rgba(10, 11, 16, 0.95);
    border: 1px solid rgba(139, 92, 246, 0.4);
    border-radius: 12px;
    display: none;
    flex-direction: column;
    z-index: 150;
    font-family: 'Segoe UI', system-ui, sans-serif;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.1);
    overflow: hidden;
  `;
  document.body.appendChild(container);

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 14px 18px;
    background: rgba(139, 92, 246, 0.12);
    border-bottom: 1px solid rgba(139, 92, 246, 0.25);
    display: flex;
    align-items: center;
    justify-content: space-between;
  `;
  container.appendChild(header);

  const headerTitle = document.createElement('div');
  headerTitle.innerHTML = '<span style="color:#8b5cf6;font-weight:700;font-size:0.95rem;">JARVIS</span> <span style="color:#64748b;font-size:0.75rem;margin-left:8px;">AI Chief of Staff</span>';
  header.appendChild(headerTitle);

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '\u2715';
  closeBtn.style.cssText = `
    background: none; border: none; color: #64748b; font-size: 1.1rem;
    cursor: pointer; padding: 0 4px; line-height: 1;
  `;
  closeBtn.addEventListener('click', () => hide());
  header.appendChild(closeBtn);

  // Messages area
  const messages = document.createElement('div');
  messages.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;
  container.appendChild(messages);

  // Inject typing animation keyframes
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes jarvis-dot-pulse {
      0%, 20% { opacity: 0.3; }
      50% { opacity: 1; }
      80%, 100% { opacity: 0.3; }
    }
    .jarvis-thinking-dots span {
      animation: jarvis-dot-pulse 1.4s infinite;
      font-size: 1.1rem;
    }
    .jarvis-thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
    .jarvis-thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
  `;
  document.head.appendChild(styleEl);

  // Input area
  const inputArea = document.createElement('div');
  inputArea.style.cssText = `
    padding: 12px;
    border-top: 1px solid rgba(139, 92, 246, 0.2);
    display: flex;
    gap: 8px;
  `;
  container.appendChild(inputArea);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Ask JARVIS...';
  input.style.cssText = `
    flex: 1;
    padding: 10px 14px;
    background: rgba(30, 30, 50, 0.8);
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 8px;
    color: #e2e8f0;
    font-size: 0.85rem;
    outline: none;
    font-family: inherit;
  `;
  inputArea.appendChild(input);

  const sendBtn = document.createElement('button');
  sendBtn.textContent = 'Send';
  sendBtn.style.cssText = `
    padding: 10px 18px;
    background: rgba(139, 92, 246, 0.3);
    border: 1px solid rgba(139, 92, 246, 0.5);
    border-radius: 8px;
    color: #8b5cf6;
    font-weight: 600;
    cursor: pointer;
    font-size: 0.85rem;
    font-family: inherit;
    transition: background 0.15s;
  `;
  sendBtn.addEventListener('mouseenter', () => { sendBtn.style.background = 'rgba(139, 92, 246, 0.5)'; });
  sendBtn.addEventListener('mouseleave', () => { sendBtn.style.background = 'rgba(139, 92, 246, 0.3)'; });
  inputArea.appendChild(sendBtn);

  // Conversation history for multi-turn context
  const conversationHistory = [];

  // Send message
  let isSending = false;

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isSending) return;
    isSending = true;
    input.disabled = true;
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.5';

    addMessage(text, 'user');
    conversationHistory.push({ role: 'user', content: text });
    input.value = '';

    const thinkingEl = addThinkingIndicator();

    try {
      const response = await getResponse(text);
      thinkingEl.remove();
      addMessage(response, 'jarvis');
      conversationHistory.push({ role: 'assistant', content: response });
    } catch (err) {
      thinkingEl.remove();
      const fallback = getCannedResponse(text);
      addMessage(fallback, 'jarvis');
      conversationHistory.push({ role: 'assistant', content: fallback });
    } finally {
      isSending = false;
      input.disabled = false;
      sendBtn.disabled = false;
      sendBtn.style.opacity = '1';
      input.focus();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.code === 'Enter') sendMessage();
    e.stopPropagation();
  });
  input.addEventListener('keyup', (e) => e.stopPropagation());

  function addThinkingIndicator() {
    const msg = document.createElement('div');
    msg.style.cssText = `
      padding: 10px 14px;
      background: rgba(139, 92, 246, 0.12);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 0.85rem;
      line-height: 1.5;
      align-self: flex-start;
      max-width: 85%;
    `;

    const label = document.createElement('div');
    label.textContent = 'JARVIS';
    label.style.cssText = 'color: #8b5cf6; font-size: 0.7rem; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.05em;';
    msg.appendChild(label);

    const body = document.createElement('div');
    body.className = 'jarvis-thinking-dots';
    body.style.cssText = 'color: #94a3b8; font-style: italic;';
    body.innerHTML = 'Thinking<span>.</span><span>.</span><span>.</span>';
    msg.appendChild(body);

    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
    return msg;
  }

  function addMessage(text, sender) {
    const msg = document.createElement('div');
    const isUser = sender === 'user';
    msg.style.cssText = `
      padding: 10px 14px;
      background: ${isUser ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.12)'};
      border: 1px solid ${isUser ? 'rgba(59, 130, 246, 0.25)' : 'rgba(139, 92, 246, 0.2)'};
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 0.85rem;
      line-height: 1.5;
      align-self: ${isUser ? 'flex-end' : 'flex-start'};
      max-width: 85%;
    `;
    if (!isUser) {
      const label = document.createElement('div');
      label.textContent = 'JARVIS';
      label.style.cssText = 'color: #8b5cf6; font-size: 0.7rem; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.05em;';
      msg.appendChild(label);
    }
    const body = document.createElement('div');
    body.textContent = text;
    msg.appendChild(body);
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  /**
   * Build system prompt with live Supabase data context.
   */
  async function buildSystemPrompt() {
    const ctx = await fetchJarvisContext();
    let dataSection = '';

    if (ctx) {
      if (ctx.metrics) {
        const m = ctx.metrics;
        dataSection += `\n\nLIVE BUSINESS METRICS (real-time):\n- Active Clients: ${m.activeClients}\n- Messages Today: ${m.messagesToday}\n- Tasks Completed Today: ${m.tasksDoneToday}\n- Calls Today: ${m.callsToday}\n- Pipeline Value: $${m.pipelineTotal?.toLocaleString() || 0} (${m.pipelineProspects} prospects)`;
      }
      if (ctx.recentTasks?.length) {
        dataSection += '\n\nRECENT TASKS:';
        for (const t of ctx.recentTasks.slice(0, 8)) {
          dataSection += `\n- [${t.status}] ${t.assigned_to}: ${t.title} (${t.task_type})`;
        }
      }
      if (ctx.recentActivity?.length) {
        dataSection += '\n\nRECENT AGENT ACTIVITY:';
        for (const a of ctx.recentActivity.slice(0, 6)) {
          dataSection += `\n- ${a.agent_name}: ${a.action} — ${a.description || ''}`;
        }
      }
    }

    return `You are JARVIS, the AI chief of staff at Conduit AI headquarters. You manage a workforce of 32 AI employees across 8 departments: Sales (HUNTER, CLOSER, STRIKER, REX, DEMO, REPLY), Marketing (NOVA, ARIA, LOCAL, REFERRAL, COMMUNITY), Engineering (BYTE, WEBMASTER, CRM, ONBOARD), Content (SAGE, VIBE, SOCIAL, VIRAL, AB TEST), Intelligence (LEARNING, FORECAST, RESEARCH, STRATEGY, BRAND), Operations (OTTO, CFO, BILLING, CS, SMS), and Monitoring (WATCHDOG, ANALYTICS).

You have access to real-time data about the business. Use the data below to answer questions accurately.${dataSection}

Guidelines:
- Be concise and professional. Address the user as Boss or CEO.
- Reference specific agents and real data when answering.
- If asked about something not in the data, say what you know and offer to investigate.
- Keep responses under 3 sentences unless detail is specifically requested.`;
  }

  /**
   * Try Claude API directly, fall back to canned responses.
   */
  async function getResponse(text) {
    const apiKey = import.meta.env.VITE_ANTHROPIC_KEY;

    // Try /api/chat proxy first (if backend exists)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) return data.reply;
      }
    } catch (e) {
      // Proxy not available, try direct API
    }

    // Try direct Claude API if key is configured
    if (apiKey) {
      try {
        const systemPrompt = await buildSystemPrompt();
        // Keep only last 6 messages for context window management
        const recentMessages = conversationHistory.slice(-6);

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 300,
            system: systemPrompt,
            messages: recentMessages.length > 0 ? recentMessages : [{ role: 'user', content: text }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.content?.[0]?.text) return data.content[0].text;
        }
      } catch (e) {
        console.warn('JARVIS direct API failed:', e);
      }
    }

    // Fallback: canned response enriched with live data
    return await getEnrichedCannedResponse(text);
  }

  /**
   * Canned responses enriched with real Supabase data when available.
   */
  async function getEnrichedCannedResponse(text) {
    const ctx = await fetchJarvisContext();
    const lower = text.toLowerCase();

    if (ctx?.metrics) {
      const m = ctx.metrics;
      if (lower.includes('status') || lower.includes('overview') || lower.includes('how')) {
        return `All systems operational, Boss. ${m.activeClients} active clients, ${m.messagesToday} messages processed today, ${m.tasksDoneToday} tasks completed. Pipeline at $${(m.pipelineTotal / 1000).toFixed(1)}k across ${m.pipelineProspects} prospects.`;
      }
      if (lower.includes('today') || lower.includes('team') || lower.includes('did')) {
        const taskSummary = ctx.recentTasks?.slice(0, 3).map(t => `${t.assigned_to}: ${t.title}`).join(', ') || 'No tasks logged yet today';
        return `Today's activity: ${m.tasksDoneToday} tasks completed, ${m.messagesToday} messages. Recent: ${taskSummary}.`;
      }
    }

    if (ctx?.recentActivity?.length && (lower.includes('agent') || lower.includes('what'))) {
      const summary = ctx.recentActivity.slice(0, 3).map(a => `${a.agent_name}: ${a.description || a.action}`).join('. ');
      return `Latest agent activity: ${summary}.`;
    }

    return getCannedResponse(text);
  }

  function getCannedResponse(text) {
    const lower = text.toLowerCase();
    if (lower.includes('status')) return 'All systems operational. 32 agents across 8 departments standing by.';
    if (lower.includes('lead')) return 'HUNTER is actively prospecting. Check the Sales floor for real-time lead data.';
    if (lower.includes('agent')) return 'All 32 agents operational across Sales, Marketing, Engineering, Content, Intelligence, Operations, and Monitoring.';
    if (lower.includes('pipeline')) return 'Pipeline data is tracked in the Sales department. Visit Floor 2 for details.';
    return "I'll look into that for you, CEO. Let me check with the relevant department.";
  }

  // Welcome message
  function addWelcome() {
    addMessage('Good evening, Mr. Garcia. All systems operational. I have live access to your business data. How can I assist you?', 'jarvis');
  }

  function show() {
    if (isOpen) return;
    isOpen = true;
    container.style.display = 'flex';
    if (messages.children.length === 0) {
      addWelcome();
    }
    setTimeout(() => input.focus(), 100);
  }

  function hide() {
    isOpen = false;
    container.style.display = 'none';
  }

  function toggle() {
    if (isOpen) hide(); else show();
  }

  return { show, hide, toggle, isOpen: () => isOpen };
}
