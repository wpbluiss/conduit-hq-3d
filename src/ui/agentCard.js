/**
 * Agent Status Card — HTML overlay shown when pressing E near an agent.
 * HUNTER gets enriched prospect data from /data/prospects.json.
 * CLOSER gets real outreach email data from /data/outreach-emails.json.
 * WATCHDOG gets real system health data from /data/system-health.json.
 * All other agents get realistic fake status data.
 * Live task data from Supabase is shown when available.
 */
import { getAgentTask } from '../data/liveAgentStatus.js';

let hunterProspects = null;
let closerEmails = null;
let watchdogHealth = null;

// Fetch real data once at startup
fetch('/data/prospects.json')
  .then(r => r.json())
  .then(data => { hunterProspects = data; })
  .catch(() => {});

fetch('/data/outreach-emails.json')
  .then(r => r.json())
  .then(data => { closerEmails = data; })
  .catch(() => {});

fetch('/data/system-health.json')
  .then(r => r.json())
  .then(data => { watchdogHealth = data; })
  .catch(() => {});

// Realistic fake status data for every other agent
const AGENT_STATUS_DATA = {
  // Sales
  STRIKER: {
    role: 'Cold Call Agent',
    lastAction: 'Completed 14 outreach calls to SaaS prospects in South Florida',
    stats: [
      { label: 'Calls Today', value: '14' },
      { label: 'Connected', value: '9 (64%)' },
      { label: 'Demos Booked', value: '3' },
      { label: 'Avg Call Duration', value: '2m 18s' },
    ],
    recentItems: [
      { name: 'Luxe Nails & Spa', detail: 'Demo booked for 3/25 at 2pm' },
      { name: 'Diamond Nails', detail: 'Callback requested — owner busy' },
      { name: 'CloudSync Labs', detail: 'Voicemail left, follow-up queued' },
    ],
  },
  REX: {
    role: 'CRM Enrichment Agent',
    lastAction: 'Enriched 28 prospect records with Google Business data',
    stats: [
      { label: 'Records Enriched', value: '28' },
      { label: 'Missing Phones Found', value: '12' },
      { label: 'Ratings Updated', value: '28' },
      { label: 'Duplicates Merged', value: '4' },
    ],
    recentItems: [
      { name: 'Avalon Nails & Spa', detail: 'Added phone: (561) 555-0142' },
      { name: 'Happy Nails WPB', detail: 'Updated rating: 4.2 → 4.5' },
      { name: 'Sunshine Beauty', detail: 'Merged duplicate — kept highest-rated' },
    ],
  },
  DEMO: {
    role: 'Demo Scheduling Agent',
    lastAction: 'Scheduled 5 product demos for this week',
    stats: [
      { label: 'Demos This Week', value: '5' },
      { label: 'Show Rate', value: '82%' },
      { label: 'Avg Demo Length', value: '18 min' },
      { label: 'Follow-ups Sent', value: '11' },
    ],
    recentItems: [
      { name: 'DataVault Inc', detail: 'Demo confirmed: Wed 3/25 10am' },
      { name: 'Palm Beach Hair Co.', detail: 'Rescheduled to Thu 3/26 3pm' },
      { name: 'Anushka Spa', detail: 'No-show — auto follow-up sent' },
    ],
  },
  REPLY: {
    role: 'Email Response Agent',
    lastAction: 'Processed 19 inbound email replies in the last hour',
    stats: [
      { label: 'Replies Processed', value: '19' },
      { label: 'Positive Intent', value: '7 (37%)' },
      { label: 'Unsubscribes', value: '2' },
      { label: 'Auto-Responded', value: '14' },
    ],
    recentItems: [
      { name: 'Luxe Nails', detail: '"Interested, send more info" — routed to CLOSER' },
      { name: 'Diamond Nails', detail: '"Not right now" — tagged for 30-day follow-up' },
      { name: 'Glow Beauty', detail: '"How much?" — pricing deck auto-sent' },
    ],
  },
  // Marketing
  NOVA: {
    role: 'Ad Campaign Agent',
    lastAction: 'Launched 3 new ad campaigns targeting SaaS companies in South FL',
    stats: [
      { label: 'Active Campaigns', value: '7' },
      { label: 'Daily Spend', value: '$142.50' },
      { label: 'CTR', value: '3.2%' },
      { label: 'Leads Generated', value: '12 today' },
    ],
    recentItems: [
      { name: 'FB: SaaS Founders', detail: 'CTR 4.1% — top performer' },
      { name: 'IG: Beauty Biz Pain Points', detail: '2,400 impressions, 8 leads' },
      { name: 'Google: AI Receptionist', detail: 'CPC $2.80 — optimizing bids' },
    ],
  },
  ARIA: {
    role: 'SEO & Content Agent',
    lastAction: 'Published 2 blog posts and optimized 5 landing pages',
    stats: [
      { label: 'Posts Published', value: '2' },
      { label: 'Pages Optimized', value: '5' },
      { label: 'Organic Traffic', value: '+18% WoW' },
      { label: 'Keywords Ranked', value: '34' },
    ],
    recentItems: [
      { name: '"AI Business Automation"', detail: 'Ranked #4 → #2 on Google' },
      { name: 'Blog: "5 Signs Your Business..."', detail: 'Published — 340 views in 6hrs' },
      { name: 'Landing page /automation', detail: 'Conversion rate 4.2% → 5.8%' },
    ],
  },
  LOCAL: {
    role: 'Local SEO Agent',
    lastAction: 'Updated 12 Google Business profiles with new review responses',
    stats: [
      { label: 'Profiles Managed', value: '12' },
      { label: 'Reviews Responded', value: '8' },
      { label: 'Citations Built', value: '15' },
      { label: 'Map Pack Rank', value: '#2 avg' },
    ],
    recentItems: [
      { name: 'Conduit AI GBP', detail: 'New 5-star review — auto-responded' },
      { name: 'Yelp Profile', detail: 'Updated hours and service list' },
      { name: 'Apple Maps', detail: 'Listing claimed and verified' },
    ],
  },
  REFERRAL: {
    role: 'Referral Program Agent',
    lastAction: 'Sent 23 referral invites to satisfied customers',
    stats: [
      { label: 'Invites Sent', value: '23' },
      { label: 'Referrals Received', value: '4' },
      { label: 'Conversion Rate', value: '17%' },
      { label: 'Revenue from Refs', value: '$2,400' },
    ],
    recentItems: [
      { name: 'TechFlow (referrer)', detail: 'Referred 2 companies — both signed up' },
      { name: 'Glow Beauty', detail: 'Referral link shared on Instagram' },
      { name: 'Auto-reward', detail: '$50 credit applied to 3 referrers' },
    ],
  },
  COMMUNITY: {
    role: 'Community Management Agent',
    lastAction: 'Engaged with 45 posts in entrepreneur Facebook groups',
    stats: [
      { label: 'Groups Monitored', value: '8' },
      { label: 'Engagements Today', value: '45' },
      { label: 'DMs Generated', value: '6' },
      { label: 'Brand Mentions', value: '12' },
    ],
    recentItems: [
      { name: 'FB: Startup Founders WPB', detail: 'Answered question about AI — 14 likes' },
      { name: 'FB: Beauty Biz Tips', detail: 'Shared case study — 3 DMs received' },
      { name: 'Reddit r/smallbusiness', detail: 'Commented on AI tools thread' },
    ],
  },
  // Engineering
  BYTE: {
    role: 'Backend Engineering Agent',
    lastAction: 'Deployed task pipeline latency fix — p99 dropped from 820ms to 340ms',
    stats: [
      { label: 'Deploys Today', value: '3' },
      { label: 'Open PRs', value: '2' },
      { label: 'Tests Passing', value: '347/347' },
      { label: 'API Uptime', value: '99.98%' },
    ],
    recentItems: [
      { name: 'PR #482: Latency fix', detail: 'Merged — task response 2.4x faster' },
      { name: 'PR #484: Rate limiter', detail: 'In review — prevents abuse spikes' },
      { name: 'Incident #12', detail: 'Resolved — DB connection pool exhaustion' },
    ],
  },
  WEBMASTER: {
    role: 'Frontend Engineering Agent',
    lastAction: 'Shipped new dashboard analytics page with real-time charts',
    stats: [
      { label: 'Pages Shipped', value: '1' },
      { label: 'Bundle Size', value: '142kb (-12%)' },
      { label: 'Lighthouse Score', value: '94' },
      { label: 'Bugs Fixed', value: '5' },
    ],
    recentItems: [
      { name: 'Analytics Dashboard', detail: 'Shipped with live call volume chart' },
      { name: 'Mobile Nav Bug', detail: 'Fixed — hamburger menu z-index issue' },
      { name: 'Performance', detail: 'Lazy-loaded route chunks, saved 18kb' },
    ],
  },
  CRM: {
    role: 'CRM Integration Agent',
    lastAction: 'Synced 142 records between Supabase and external CRMs',
    stats: [
      { label: 'Records Synced', value: '142' },
      { label: 'Sync Errors', value: '0' },
      { label: 'Integrations Active', value: '4' },
      { label: 'Last Sync', value: '2 min ago' },
    ],
    recentItems: [
      { name: 'Supabase → HubSpot', detail: '89 contacts synced' },
      { name: 'Calendly → Pipeline', detail: '12 new demo bookings imported' },
      { name: 'Stripe → Revenue', detail: '$4,200 in new MRR tracked' },
    ],
  },
  ONBOARD: {
    role: 'Client Onboarding Agent',
    lastAction: 'Onboarded 2 new clients — configured AI employees and workflows',
    stats: [
      { label: 'Active Onboardings', value: '2' },
      { label: 'Avg Setup Time', value: '18 min' },
      { label: 'Success Rate', value: '96%' },
      { label: 'Clients This Week', value: '7' },
    ],
    recentItems: [
      { name: 'Luxe Nails & Spa', detail: 'AI team deployed — initial tests passed' },
      { name: 'Diamond Nails', detail: 'Knowledge base configured — 42 FAQs loaded' },
      { name: 'Palm Beach Hair', detail: 'Appointment booking integration complete' },
    ],
  },
  // Content
  SAGE: {
    role: 'Long-Form Content Agent',
    lastAction: 'Wrote 3,200-word guide: "How Virtual Teams Scale Operations"',
    stats: [
      { label: 'Articles Written', value: '2' },
      { label: 'Total Words', value: '5,800' },
      { label: 'Avg Read Time', value: '8 min' },
      { label: 'SEO Score', value: '92/100' },
    ],
    recentItems: [
      { name: 'Guide: Virtual Business Teams', detail: '3,200 words — ready for review' },
      { name: 'Case Study: Luxe Nails', detail: '2,600 words — published' },
      { name: 'Email Sequence Draft', detail: '5-email nurture series for SaaS' },
    ],
  },
  VIBE: {
    role: 'Brand Strategy Agent',
    lastAction: 'Reviewed and refined tone for 8 outbound email templates',
    stats: [
      { label: 'Templates Reviewed', value: '8' },
      { label: 'Tone Adjustments', value: '14' },
      { label: 'Brand Score', value: '94%' },
      { label: 'A/B Tests Active', value: '3' },
    ],
    recentItems: [
      { name: 'Cold email template v3', detail: 'Warmer tone — open rate +12%' },
      { name: 'Follow-up sequence', detail: 'Shortened, more conversational' },
      { name: 'Landing page copy', detail: 'Headline A/B test launched' },
    ],
  },
  SOCIAL: {
    role: 'Social Media Agent',
    lastAction: 'Scheduled 12 posts across Instagram, LinkedIn, and X',
    stats: [
      { label: 'Posts Scheduled', value: '12' },
      { label: 'Engagement Rate', value: '4.8%' },
      { label: 'Followers Gained', value: '+34 today' },
      { label: 'DMs Received', value: '7' },
    ],
    recentItems: [
      { name: 'IG Reel: Demo clip', detail: '1,200 views, 45 likes — boosting' },
      { name: 'LinkedIn: Founder post', detail: '890 impressions, 12 comments' },
      { name: 'X thread: AI for SMBs', detail: '340 impressions, 3 reposts' },
    ],
  },
  VIRAL: {
    role: 'Viral Content Agent',
    lastAction: 'Testing 5 short-form video concepts for TikTok/Reels',
    stats: [
      { label: 'Videos in Testing', value: '5' },
      { label: 'Best Performer', value: '4,200 views' },
      { label: 'Avg Watch Time', value: '12.4s' },
      { label: 'Shares', value: '28' },
    ],
    recentItems: [
      { name: '"AI runs your business operations"', detail: '4,200 views — going viral' },
      { name: '"Before/After AI receptionist"', detail: '1,800 views — good retention' },
      { name: '"Stop losing calls" hook', detail: 'Testing — 6hr mark' },
    ],
  },
  'AB TEST': {
    role: 'A/B Testing Agent',
    lastAction: 'Analyzed 3 landing page experiments — declared winner on /pricing',
    stats: [
      { label: 'Active Tests', value: '4' },
      { label: 'Tests Completed', value: '3' },
      { label: 'Conversion Lift', value: '+22% avg' },
      { label: 'Statistical Power', value: '95%' },
    ],
    recentItems: [
      { name: '/pricing page', detail: 'Variant B won — 28% higher conversion' },
      { name: '/demo CTA color', detail: 'Purple > Blue — +8% clicks' },
      { name: 'Email subject lines', detail: 'Still collecting data — 72% power' },
    ],
  },
  // Intelligence
  LEARNING: {
    role: 'Model Training Agent',
    lastAction: 'Fine-tuned task classification model on 2,400 new workflow patterns',
    stats: [
      { label: 'Training Samples', value: '2,400' },
      { label: 'Model Accuracy', value: '97.2%' },
      { label: 'Intents Covered', value: '24' },
      { label: 'Training Time', value: '14 min' },
    ],
    recentItems: [
      { name: 'Intent: "book_appointment"', detail: 'Accuracy 98.8% — best class' },
      { name: 'Intent: "pricing_inquiry"', detail: 'Improved 91% → 96%' },
      { name: 'New intent: "reschedule"', detail: 'Added — 94% accuracy' },
    ],
  },
  FORECAST: {
    role: 'Revenue Forecasting Agent',
    lastAction: 'Updated Q2 revenue forecast — projected $48K MRR by June',
    stats: [
      { label: 'Current MRR', value: '$12,400' },
      { label: 'Projected Q2 End', value: '$48,000' },
      { label: 'Growth Rate', value: '32% MoM' },
      { label: 'Churn Risk', value: '2 accounts' },
    ],
    recentItems: [
      { name: 'Q2 Forecast Model', detail: 'Updated with March actuals' },
      { name: 'Churn Alert: Glow Beauty', detail: 'Usage dropped 60% — flagged CS' },
      { name: 'Upsell Opportunity', detail: '4 clients ready for premium tier' },
    ],
  },
  RESEARCH: {
    role: 'Market Research Agent',
    lastAction: 'Compiled competitive analysis of 8 AI workforce competitors',
    stats: [
      { label: 'Competitors Tracked', value: '8' },
      { label: 'Reports Generated', value: '2' },
      { label: 'Market Size Est.', value: '$2.1B' },
      { label: 'New Trends Found', value: '3' },
    ],
    recentItems: [
      { name: 'Competitor: AgentStack AI', detail: 'Raised Series A — $12M. Weak in SMB.' },
      { name: 'Trend: Multi-language', detail: 'Spanish support becoming table stakes' },
      { name: 'Report: TAM Analysis', detail: '2.1M SMBs in US — 4% AI workforce adoption' },
    ],
  },
  STRATEGY: {
    role: 'Strategy Planning Agent',
    lastAction: 'Drafted Q2 GTM playbook with 4 new vertical expansion targets',
    stats: [
      { label: 'Strategies Active', value: '3' },
      { label: 'OKRs On Track', value: '7/9' },
      { label: 'Next Milestone', value: '100 clients' },
      { label: 'Days to Target', value: '42' },
    ],
    recentItems: [
      { name: 'GTM Playbook v2', detail: 'Expanding to agencies and consultancies' },
      { name: 'Pricing Strategy', detail: 'Testing $299/mo tier — 40% take rate' },
      { name: 'Partnership Pipeline', detail: '3 business tool integrations in progress' },
    ],
  },
  BRAND: {
    role: 'Brand Intelligence Agent',
    lastAction: 'Analyzed brand sentiment across 240 social mentions this week',
    stats: [
      { label: 'Mentions Tracked', value: '240' },
      { label: 'Sentiment Score', value: '8.4/10' },
      { label: 'Positive %', value: '78%' },
      { label: 'Response Time', value: '< 2 hrs' },
    ],
    recentItems: [
      { name: 'Twitter mention spike', detail: '+45 mentions after demo video post' },
      { name: 'Negative review', detail: 'Setup complexity — routed to ONBOARD' },
      { name: 'Brand health report', detail: 'Weekly digest sent to CEO dashboard' },
    ],
  },
  // Operations
  OTTO: {
    role: 'Workflow Automation Agent',
    lastAction: 'Automated 6 manual processes — saved 4.2 hours/day of team work',
    stats: [
      { label: 'Automations Active', value: '18' },
      { label: 'Tasks Automated/Day', value: '142' },
      { label: 'Time Saved/Day', value: '4.2 hrs' },
      { label: 'Error Rate', value: '0.3%' },
    ],
    recentItems: [
      { name: 'Invoice auto-generation', detail: 'Triggers on new subscription — zero manual' },
      { name: 'Lead routing', detail: 'Auto-assigns to CLOSER based on score' },
      { name: 'Slack alerts', detail: 'New signup → #wins channel notification' },
    ],
  },
  CFO: {
    role: 'Financial Operations Agent',
    lastAction: 'Reconciled March transactions — all accounts balanced',
    stats: [
      { label: 'Monthly Revenue', value: '$12,400' },
      { label: 'Expenses', value: '$8,200' },
      { label: 'Burn Rate', value: '$5,800/mo' },
      { label: 'Runway', value: '14 months' },
    ],
    recentItems: [
      { name: 'March P&L', detail: 'Net margin 34% — improving from 28%' },
      { name: 'Stripe payouts', detail: '$4,200 deposited — all reconciled' },
      { name: 'Tax prep', detail: 'Q1 estimated tax calculated: $1,840' },
    ],
  },
  BILLING: {
    role: 'Billing & Invoicing Agent',
    lastAction: 'Processed 24 subscription renewals — 0 failed payments',
    stats: [
      { label: 'Active Subscriptions', value: '24' },
      { label: 'Failed Payments', value: '0' },
      { label: 'Dunning Emails Sent', value: '2' },
      { label: 'Revenue Collected', value: '$7,176' },
    ],
    recentItems: [
      { name: 'Luxe Nails renewal', detail: '$299/mo — auto-renewed successfully' },
      { name: 'Diamond Nails', detail: 'Card expiring — reminder sent' },
      { name: 'New signup: Apex Digital', detail: 'First invoice: $199/mo' },
    ],
  },
  CS: {
    role: 'Customer Success Agent',
    lastAction: 'Resolved 8 support tickets — avg response time 12 minutes',
    stats: [
      { label: 'Open Tickets', value: '3' },
      { label: 'Resolved Today', value: '8' },
      { label: 'CSAT Score', value: '4.8/5' },
      { label: 'Avg Response', value: '12 min' },
    ],
    recentItems: [
      { name: 'Ticket #89: Task latency', detail: 'Resolved — optimized pipeline' },
      { name: 'Ticket #91: Booking sync', detail: 'Fixed — calendar API token refreshed' },
      { name: 'Ticket #93: Spanish support', detail: 'Escalated — feature request logged' },
    ],
  },
  SMS: {
    role: 'Notification Agent',
    lastAction: 'Sent 186 appointment confirmations and 42 follow-up texts',
    stats: [
      { label: 'Notifications Today', value: '228' },
      { label: 'Delivery Rate', value: '99.1%' },
      { label: 'Response Rate', value: '34%' },
      { label: 'Opt-outs', value: '1' },
    ],
    recentItems: [
      { name: 'Appointment confirmations', detail: '186 sent — 92% confirmed' },
      { name: 'Post-visit follow-ups', detail: '42 sent — 8 reviews collected' },
      { name: 'Re-engagement', detail: '24 "We miss you" texts — 6 rebooked' },
    ],
  },
  // Monitoring
  ANALYTICS: {
    role: 'Analytics & Reporting Agent',
    lastAction: 'Generated daily KPI report — all metrics green except churn watch',
    stats: [
      { label: 'Dashboards Active', value: '6' },
      { label: 'Reports Generated', value: '3 today' },
      { label: 'Anomalies Detected', value: '1' },
      { label: 'Data Freshness', value: '< 5 min' },
    ],
    recentItems: [
      { name: 'Daily KPI Report', detail: 'Sent to #metrics — all green' },
      { name: 'Anomaly: Call volume spike', detail: '+40% at 2pm — investigated, normal' },
      { name: 'Weekly Trends', detail: 'MRR growth accelerating — 32% vs 28% prior' },
    ],
  },
};

export function createAgentCard() {
  const el = document.createElement('div');
  el.id = 'agent-card';
  el.style.cssText = `
    display: none; position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%) translateY(20px);
    background: rgba(10,11,16,0.95); border: 2px solid #8b5cf6;
    border-radius: 12px; padding: 24px; color: white;
    font-family: 'Segoe UI', system-ui, sans-serif; z-index: 250;
    min-width: 340px; max-width: 520px; max-height: 80vh; overflow-y: auto;
    box-shadow: 0 8px 48px rgba(0,0,0,0.7), 0 0 40px rgba(139,92,246,0.15);
    backdrop-filter: blur(8px);
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  `;
  document.body.appendChild(el);

  let _isOpen = false;

  function show(agent) {
    const borderColor = agent.accentHex || '#3b82f6';
    el.style.borderColor = borderColor;

    if (agent.name === 'HUNTER' && hunterProspects) {
      showHunterCard(agent);
    } else if (agent.name === 'CLOSER' && closerEmails) {
      showCloserCard(agent);
    } else if (agent.name === 'WATCHDOG' && watchdogHealth) {
      showWatchdogCard(agent);
    } else if (AGENT_STATUS_DATA[agent.name]) {
      showRichCard(agent);
    } else {
      showGenericCard(agent);
    }

    el.style.display = 'block';
    void el.offsetHeight;
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%, -50%) translateY(0)';
    _isOpen = true;
  }

  function showHunterCard(agent) {
    const p = hunterProspects;
    const prospects = p.prospects || [];

    const prospectRows = prospects.map((pr, i) => {
      const pain = pr.review_complaint.split('.')[0];
      return `
        <div style="background:rgba(30,30,50,0.5);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:10px 12px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <span style="font-weight:600;font-size:14px">${i + 1}. ${pr.name}</span>
            <span style="color:#eab308;font-size:13px">${pr.google_rating}★</span>
          </div>
          <div style="color:#94a3b8;font-size:12px;margin-top:4px">${pain}</div>
          ${pr.phone && pr.phone !== 'Not listed publicly (booking via website palmbeachhair.co or email PalmBeachHairCo@gmail.com)'
            ? `<div style="color:#64748b;font-size:11px;margin-top:3px">${pr.phone}</div>` : ''}
        </div>`;
    }).join('');

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
        <div style="font-size:22px;font-weight:bold">HUNTER</div>
        <div style="color:#10b981;font-size:13px;font-weight:600">● Active</div>
      </div>
      <div style="color:#3b82f6;font-size:13px;font-weight:600;margin-bottom:14px">Lead Generation Agent — Sales Department</div>

      <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:8px;padding:10px 12px;margin-bottom:14px">
        <div style="color:#10b981;font-size:12px;font-weight:600;margin-bottom:2px">LAST ACTION</div>
        <div style="color:#e2e8f0;font-size:14px">Found ${prospects.length} ${p.target_vertical} prospects in ${p.search_area}</div>
      </div>

      <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Prospects Found</div>
      ${prospectRows}

      <div style="color:#64748b;font-size:11px;margin-top:10px">
        Pain point: <span style="color:#94a3b8">${p.pain_point}</span>
      </div>
      <div style="color:#64748b;font-size:11px;margin-top:2px">
        Generated: <span style="color:#94a3b8">${p.generated_at}</span>
      </div>
      <div style="color:#4b5563;font-size:11px;text-align:center;margin-top:14px;letter-spacing:0.05em">Press E or ESC to close</div>
    `;
  }

  function showCloserCard(agent) {
    const data = closerEmails;
    const emails = data.emails || [];

    const emailRows = emails.slice(0, 5).map((em, i) => `
      <div style="background:rgba(30,30,50,0.5);border:1px solid rgba(59,130,246,0.2);border-radius:8px;padding:10px 12px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span style="font-weight:600;font-size:14px">${i + 1}. ${em.prospect}</span>
          <span style="color:#94a3b8;font-size:11px">${em.word_count} words</span>
        </div>
        <div style="color:#3b82f6;font-size:12px;margin-top:4px;font-style:italic">"${em.subject}"</div>
        <div style="color:#64748b;font-size:11px;margin-top:4px">${em.pain_point_referenced.split(',')[0]}</div>
      </div>
    `).join('');

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
        <div style="font-size:22px;font-weight:bold">CLOSER</div>
        <div style="color:#10b981;font-size:13px;font-weight:600">● Active</div>
      </div>
      <div style="color:#3b82f6;font-size:13px;font-weight:600;margin-bottom:14px">Outreach Email Agent — Sales Department</div>

      <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:10px 12px;margin-bottom:14px">
        <div style="color:#3b82f6;font-size:12px;font-weight:600;margin-bottom:2px">LAST ACTION</div>
        <div style="color:#e2e8f0;font-size:14px">Generated ${emails.length} personalized outreach emails for ${data.campaign}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        <div style="background:rgba(30,30,50,0.5);border-radius:6px;padding:8px 10px">
          <div style="color:#64748b;font-size:10px;text-transform:uppercase">Campaign</div>
          <div style="color:#e2e8f0;font-size:13px;font-weight:600">${data.campaign.split(' ').slice(0, 3).join(' ')}</div>
        </div>
        <div style="background:rgba(30,30,50,0.5);border-radius:6px;padding:8px 10px">
          <div style="color:#64748b;font-size:10px;text-transform:uppercase">Demo Line</div>
          <div style="color:#e2e8f0;font-size:13px;font-weight:600">${data.demo_line}</div>
        </div>
        <div style="background:rgba(30,30,50,0.5);border-radius:6px;padding:8px 10px">
          <div style="color:#64748b;font-size:10px;text-transform:uppercase">Emails Generated</div>
          <div style="color:#e2e8f0;font-size:13px;font-weight:600">${emails.length}</div>
        </div>
        <div style="background:rgba(30,30,50,0.5);border-radius:6px;padding:8px 10px">
          <div style="color:#64748b;font-size:10px;text-transform:uppercase">Sender</div>
          <div style="color:#e2e8f0;font-size:13px;font-weight:600">${data.sender.name}</div>
        </div>
      </div>

      <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Outreach Emails</div>
      ${emailRows}

      <div style="color:#64748b;font-size:11px;margin-top:10px">
        Generated: <span style="color:#94a3b8">${data.generated_at}</span>
      </div>
      <div style="color:#4b5563;font-size:11px;text-align:center;margin-top:14px;letter-spacing:0.05em">Press E or ESC to close</div>
    `;
  }

  function showWatchdogCard(agent) {
    const data = watchdogHealth;
    const checks = data.checks || [];

    const statusIcon = (s) => s === 'healthy'
      ? '<span style="color:#10b981">●</span>'
      : '<span style="color:#ef4444">●</span>';

    const checkRows = checks.map(c => `
      <div style="background:rgba(30,30,50,0.5);border:1px solid rgba(${c.status === 'healthy' ? '16,185,129' : '239,68,68'},0.2);border-radius:8px;padding:10px 12px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:600;font-size:14px">${statusIcon(c.status)} ${c.service}</span>
          <span style="color:${c.status === 'healthy' ? '#10b981' : '#ef4444'};font-size:12px;font-weight:600">${c.status.toUpperCase()}</span>
        </div>
        <div style="color:#64748b;font-size:11px;margin-top:4px">
          HTTP ${c.http_status} · ${(c.response_time_seconds * 1000).toFixed(0)}ms
        </div>
        ${c.notes ? `<div style="color:#94a3b8;font-size:11px;margin-top:3px;font-style:italic">${c.notes.substring(0, 80)}...</div>` : ''}
      </div>
    `).join('');

    const allHealthy = data.overall_status === 'all_healthy';

    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
        <div style="font-size:22px;font-weight:bold">WATCHDOG</div>
        <div style="color:#10b981;font-size:13px;font-weight:600">● Active</div>
      </div>
      <div style="color:#ef4444;font-size:13px;font-weight:600;margin-bottom:14px">System Health Monitor — Monitoring Department</div>

      <div style="background:rgba(${allHealthy ? '16,185,129' : '239,68,68'},0.1);border:1px solid rgba(${allHealthy ? '16,185,129' : '239,68,68'},0.3);border-radius:8px;padding:10px 12px;margin-bottom:14px">
        <div style="color:${allHealthy ? '#10b981' : '#ef4444'};font-size:12px;font-weight:600;margin-bottom:2px">SYSTEM STATUS</div>
        <div style="color:#e2e8f0;font-size:14px">${allHealthy ? 'All systems operational — ' + checks.length + ' services healthy' : 'Issues detected — check below'}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
        <div style="background:rgba(30,30,50,0.5);border-radius:6px;padding:8px 10px;text-align:center">
          <div style="color:#10b981;font-size:20px;font-weight:bold">${checks.filter(c => c.status === 'healthy').length}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase">Healthy</div>
        </div>
        <div style="background:rgba(30,30,50,0.5);border-radius:6px;padding:8px 10px;text-align:center">
          <div style="color:#ef4444;font-size:20px;font-weight:bold">${checks.filter(c => c.status !== 'healthy').length}</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase">Down</div>
        </div>
        <div style="background:rgba(30,30,50,0.5);border-radius:6px;padding:8px 10px;text-align:center">
          <div style="color:#eab308;font-size:20px;font-weight:bold">${Math.round(checks.reduce((a, c) => a + c.response_time_seconds * 1000, 0) / checks.length)}ms</div>
          <div style="color:#64748b;font-size:10px;text-transform:uppercase">Avg Latency</div>
        </div>
      </div>

      <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Service Checks</div>
      ${checkRows}

      <div style="color:#64748b;font-size:11px;margin-top:10px">
        Last check: <span style="color:#94a3b8">${new Date(data.generated_at).toLocaleString()}</span>
      </div>
      <div style="color:#4b5563;font-size:11px;text-align:center;margin-top:14px;letter-spacing:0.05em">Press E or ESC to close</div>
    `;
  }

  function showRichCard(agent) {
    const data = AGENT_STATUS_DATA[agent.name];
    const statusColor = agent.status === 'green' ? '#10b981' : '#eab308';
    const statusText = agent.status === 'green' ? 'Active' : 'Busy';
    const borderColor = agent.accentHex || '#3b82f6';

    const statsGrid = data.stats.map(s => `
      <div style="background:rgba(30,30,50,0.5);border-radius:6px;padding:8px 10px;border-left:2px solid ${borderColor}">
        <div style="color:#64748b;font-size:10px;text-transform:uppercase">${s.label}</div>
        <div style="color:#e2e8f0;font-size:13px;font-weight:600">${s.value}</div>
      </div>
    `).join('');

    const itemRows = (data.recentItems || []).map((item, idx) => `
      <div style="background:rgba(30,30,50,0.5);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px 12px;margin-bottom:8px;animation:fadeInUp 0.3s ease ${0.1 + idx * 0.08}s both">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span style="font-weight:600;font-size:13px;color:#e2e8f0">${item.name}</span>
          <span style="color:${borderColor};font-size:10px">●</span>
        </div>
        <div style="color:#94a3b8;font-size:12px;margin-top:3px">${item.detail}</div>
      </div>
    `).join('');

    // Inject animation keyframes if not already added
    if (!document.getElementById('agent-card-anims')) {
      const style = document.createElement('style');
      style.id = 'agent-card-anims';
      style.textContent = `
        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes slideRight { from { width:0; } to { width:100%; } }
      `;
      document.head.appendChild(style);
    }

    el.innerHTML = `
      <div style="background:linear-gradient(135deg, ${borderColor}22, transparent);border-radius:10px 10px 0 0;margin:-24px -24px 16px;padding:16px 24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="font-size:22px;font-weight:bold;letter-spacing:0.02em">${agent.name}</div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:${statusColor};animation:pulse 2s ease infinite"></div>
            <span style="color:${statusColor};font-size:13px;font-weight:600">${statusText}</span>
          </div>
        </div>
        <div style="color:${borderColor};font-size:13px;font-weight:600">${data.role} — ${agent.department}</div>
      </div>

      ${buildLiveTaskBanner(agent.name)}
      <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.25);border-radius:8px;padding:10px 12px;margin-bottom:14px">
        <div style="color:#10b981;font-size:11px;font-weight:600;margin-bottom:3px;text-transform:uppercase;letter-spacing:0.06em">LAST ACTION</div>
        <div style="color:#e2e8f0;font-size:14px;line-height:1.4">${data.lastAction}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
        ${statsGrid}
      </div>

      <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px">Recent Activity</div>
      ${itemRows}

      <div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:14px;color:#4b5563;font-size:11px;letter-spacing:0.05em">
        <span style="color:${borderColor};font-size:10px">◆</span>
        Press E or ESC to close
        <span style="color:${borderColor};font-size:10px">◆</span>
      </div>
    `;
  }

  function buildLiveTaskBanner(agentName) {
    const task = getAgentTask(agentName);
    if (!task) return '';
    const statusColors = { in_progress: '#10b981', completed: '#3b82f6', pending: '#eab308' };
    const statusLabels = { in_progress: 'IN PROGRESS', completed: 'COMPLETED', pending: 'QUEUED' };
    const color = statusColors[task.status] || '#64748b';
    const label = statusLabels[task.status] || task.status;
    const timeAgo = task.completedAt || task.createdAt;
    let timeStr = '';
    if (timeAgo) {
      const d = new Date(timeAgo);
      const diffMin = Math.floor((Date.now() - d) / 60000);
      if (diffMin < 1) timeStr = 'just now';
      else if (diffMin < 60) timeStr = `${diffMin}m ago`;
      else timeStr = `${Math.floor(diffMin / 60)}h ago`;
    }
    return `
      <div style="background:${color}15;border:1px solid ${color}40;border-radius:8px;padding:10px 12px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
          <span style="color:${color};font-size:10px;font-weight:700;letter-spacing:0.08em">LIVE TASK — ${label}</span>
          <span style="color:#475569;font-size:10px;font-family:monospace">${timeStr}</span>
        </div>
        <div style="color:#e2e8f0;font-size:14px;line-height:1.4">${task.title}</div>
        ${task.taskType ? `<div style="color:#64748b;font-size:11px;margin-top:3px">Type: ${task.taskType}</div>` : ''}
      </div>
    `;
  }

  function showGenericCard(agent) {
    const statusColor = agent.status === 'green' ? '#10b981' : '#eab308';
    const statusText = agent.status === 'green' ? 'Active' : 'Busy';
    const liveBanner = buildLiveTaskBanner(agent.name);

    el.innerHTML = `
      <div style="font-size:22px;font-weight:bold;margin-bottom:8px">${agent.name}</div>
      <div style="color:#888;margin-bottom:12px">${agent.department} Department</div>
      ${liveBanner}
      <div style="margin-bottom:6px">Status: <span style="color:${statusColor};font-weight:600">${statusText}</span></div>
      <div style="margin-top:16px;color:#4b5563;font-size:12px;letter-spacing:0.05em">Press E or ESC to close</div>
    `;
  }

  let hideTimeout = null;
  function hide() {
    _isOpen = false;
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%, -50%) translateY(20px)';
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      el.style.display = 'none';
    }, 300);
  }

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && _isOpen) hide();
  });

  return { show, hide, isOpen: () => _isOpen };
}
