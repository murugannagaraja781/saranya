/**
 * Naga AI Assistant (Saranya) — Vanilla JavaScript Application Logic
 * Pure ES6+, Zero external dependencies, Real-time auto-polling & interaction handlers
 */

// Base API URL (Smart detection for Hostinger root subdomain or /public/ subfolder)
const API_BASE = (() => {
  const path = window.location.pathname;
  if (path.includes('/public/') || path.endsWith('/public')) {
    return '../backend/api';
  }
  return 'backend/api';
})();

// Application State
const state = {
  currentPage: 'dashboard',
  pollingActive: true,
  pollInterval: null,
  stats: {},
  messages: [],
  calls: [],
  tasks: [],
  clients: [],
  settings: {},
  activeCallModalData: null
};

// Preset Scenarios for Simulation Modal
const PRESETS = {
  installment: {
    channel: 'email',
    name: 'Ramesh Kumar',
    company: 'ABC Traders',
    contact: '+919840123456',
    subject: 'Quotation Approved - Payment Terms Discussion',
    message: 'Dear Naga, We have reviewed the quotation you sent yesterday. We are happy with the pricing and approve it. However, we request to make the payment in 2 installments (50% advance, 50% on completion). Please confirm by tomorrow.'
  },
  delivery: {
    channel: 'whatsapp',
    name: 'Priya Sundaram',
    company: 'Apex Retail Solutions',
    contact: '+919840999888',
    subject: '',
    message: 'Hello Naga, When can we expect the delivery of the second batch of stock? Our team needs confirmation today.'
  },
  complaint: {
    channel: 'whatsapp',
    name: 'Suresh Babu',
    company: 'Modern Logistics',
    contact: '+919840777666',
    subject: '',
    message: 'Urgent! The tracking dashboard is not working for our drivers. Critical issue please check immediately.'
  },
  otp: {
    channel: 'email',
    name: 'Automated Service',
    company: 'Security Auth',
    contact: 'no-reply@auth.com',
    subject: 'Your One-Time Password (OTP)',
    message: 'Your verification code is 482910. Do not share this code with anyone.'
  },
  thanks: {
    channel: 'whatsapp',
    name: 'Client',
    company: '',
    contact: '+919840111222',
    subject: '',
    message: 'Okay, noted. Thanks!'
  }
};

// ============================================================================
// Initialization & Navigation
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSimulationModal();
  initAudioPlayer();
  initSettingsForm();
  initAutoRefresh();

  // Load initial dashboard data
  loadDashboardData();
  startPolling();
});

function initNavigation() {
  const navButtons = document.querySelectorAll('.nav-item');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPage = btn.getAttribute('data-page');
      navigateTo(targetPage);
    });
  });

  // Mobile drawer toggle
  const mobileToggle = document.getElementById('btn-toggle-sidebar');
  const sidebar = document.getElementById('sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

function navigateTo(pageId) {
  state.currentPage = pageId;

  // Update active sidebar nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-page') === pageId);
  });

  // Update visible section
  document.querySelectorAll('.page-section').forEach(sec => {
    sec.classList.toggle('active', sec.id === `section-${pageId}`);
  });

  // Update Topbar Title
  const titles = {
    dashboard: { title: 'Executive Dashboard', sub: 'Real-time Tamil AI Voice Briefings & Operations' },
    messages: { title: 'Messages Inbox', sub: 'Monitored Client Communications from Gmail & WhatsApp' },
    calls: { title: 'Voice Calls & Transcripts', sub: 'Phone Briefings to Naga & Recorded Instructions' },
    tasks: { title: 'Action Tasks', sub: 'Automated Tasks Generated from Voice Commitments' },
    clients: { title: 'Client Directory', sub: 'Client Profiles, History & Priority Notes' },
    settings: { title: 'System Settings', sub: 'Persona, Phone Numbers, Quiet Hours & Integrations' }
  };

  const info = titles[pageId] || titles.dashboard;
  document.getElementById('page-title').textContent = info.title;
  document.getElementById('page-subtitle').textContent = info.sub;

  // Refresh data for the specific section
  if (pageId === 'dashboard') loadDashboardData();
  else if (pageId === 'messages') loadMessages();
  else if (pageId === 'calls') loadCalls();
  else if (pageId === 'tasks') loadTasks();
  else if (pageId === 'clients') loadClients();
  else if (pageId === 'settings') loadSettings();
}

// ============================================================================
// Data Fetching & Polling
// ============================================================================
function initAutoRefresh() {
  const btnRefresh = document.getElementById('btn-refresh');
  const refreshStatus = document.getElementById('refresh-status');

  btnRefresh.addEventListener('click', () => {
    state.pollingActive = !state.pollingActive;
    if (state.pollingActive) {
      refreshStatus.textContent = 'Live (5s)';
      startPolling();
      showToast('Live auto-refresh enabled', 'success');
    } else {
      refreshStatus.textContent = 'Paused';
      stopPolling();
      showToast('Live auto-refresh paused', 'info');
    }
  });
}

function startPolling() {
  stopPolling();
  state.pollInterval = setInterval(() => {
    if (state.pollingActive) {
      if (state.currentPage === 'dashboard') loadDashboardData(true);
      else if (state.currentPage === 'messages') loadMessages(true);
      else if (state.currentPage === 'calls') loadCalls(true);
      else if (state.currentPage === 'tasks') loadTasks(true);
    }
  }, 5000);
}

function stopPolling() {
  if (state.pollInterval) {
    clearInterval(state.pollInterval);
    state.pollInterval = null;
  }
}

// ============================================================================
// 1. Dashboard View
// ============================================================================
async function loadDashboardData(silent = false) {
  try {
    const res = await fetch(`${API_BASE}/dashboard.php`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load stats');

    state.stats = data.stats;

    // Update KPI counters
    document.getElementById('kpi-messages-today').textContent = data.stats.messagesToday;
    document.getElementById('kpi-important').textContent = data.stats.importantMessages;
    document.getElementById('kpi-calls-made').textContent = data.stats.callsMade;
    document.getElementById('kpi-pending-tasks').textContent = data.stats.pendingActions;

    // Update Sidebar badges
    document.getElementById('badge-messages').textContent = data.stats.messagesToday;
    document.getElementById('badge-tasks').textContent = data.stats.pendingActions;

    // Render Recent Briefings
    renderDashboardBriefings(data.recentMessages || []);

    // Render Recent Calls
    renderDashboardCalls(data.recentCalls || []);

  } catch (err) {
    if (!silent) console.error('Dashboard Load Error:', err);
  }
}

function renderDashboardBriefings(messages) {
  const container = document.getElementById('dashboard-briefings-container');
  if (!messages.length) {
    container.innerHTML = '<div class="loading-state">No recent client messages.</div>';
    return;
  }

  container.innerHTML = messages.map(m => `
    <div class="briefing-card" onclick="viewCallDetail('${m.call_id || ''}', '${escapeHtml(m.client_name)}', '${escapeHtml(m.tamil_summary || '')}', '${escapeHtml(m.owner_instruction || '')}')">
      <div class="briefing-top">
        <div>
          <span class="client-name">${escapeHtml(m.client_name)}</span>
          <span class="client-company">• ${escapeHtml(m.company || 'Client')}</span>
        </div>
        <div>
          <span class="badge ${getPriorityBadgeClass(m.priority)}">${m.priority.toUpperCase()}</span>
          <span class="badge ${m.channel === 'whatsapp' ? 'badge-emerald' : 'badge-indigo'}">${m.channel.toUpperCase()}</span>
        </div>
      </div>
      <div class="briefing-tamil tamil-text">${escapeHtml(m.tamil_summary || m.subject || 'Processing message...')}</div>
      <div class="briefing-footer">
        <span>${formatRelativeTime(m.received_at)}</span>
        <span>${m.call_id ? '📞 Phone Call Dispatched' : '✓ Analysis Saved'}</span>
      </div>
    </div>
  `).join('');
}

function renderDashboardCalls(calls) {
  const container = document.getElementById('dashboard-calls-container');
  if (!calls.length) {
    container.innerHTML = '<div class="loading-state">No voice calls recorded yet.</div>';
    return;
  }

  container.innerHTML = calls.map(c => `
    <div class="call-card" onclick="viewCallDetail('${c.id}', '${escapeHtml(c.client_name)}', '${escapeHtml(c.summary)}', '${escapeHtml(c.owner_instruction || '')}', '${escapeHtml(c.transcript || '')}')">
      <div class="call-card-top">
        <span class="client-name">${escapeHtml(c.client_name)}</span>
        <span class="badge badge-emerald">COMPLETED (${c.duration}s)</span>
      </div>
      <p class="tamil-text" style="font-size: 0.88rem; color: #334155; margin-bottom: 6px;">${escapeHtml(c.summary)}</p>
      ${c.owner_instruction ? `
        <div class="call-instruction-box tamil-text">
          <strong>Naga's Instruction:</strong> "${escapeHtml(c.owner_instruction)}"
        </div>
      ` : ''}
    </div>
  `).join('');
}

// ============================================================================
// 2. Messages Inbox View
// ============================================================================
async function loadMessages(silent = false) {
  try {
    const channel = document.getElementById('filter-channel')?.value || '';
    const priority = document.getElementById('filter-priority')?.value || '';
    const search = document.getElementById('messages-search')?.value || '';

    const params = new URLSearchParams();
    if (channel) params.append('channel', channel);
    if (priority) params.append('priority', priority);
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/messages.php?${params.toString()}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    state.messages = data.messages;
    renderMessagesTable(data.messages);

  } catch (err) {
    if (!silent) console.error('Error loading messages:', err);
  }
}

function renderMessagesTable(messages) {
  const tbody = document.getElementById('messages-table-body');
  if (!messages.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="loading-state">No client messages match filter.</td></tr>';
    return;
  }

  tbody.innerHTML = messages.map(m => `
    <tr>
      <td>
        <strong>${escapeHtml(m.client_name)}</strong>
        <div style="font-size:0.75rem; color:#64748B;">${escapeHtml(m.company || '')}</div>
      </td>
      <td>
        <span class="badge ${m.channel === 'whatsapp' ? 'badge-emerald' : 'badge-indigo'}">
          ${m.channel.toUpperCase()}
        </span>
      </td>
      <td style="max-width: 250px;">
        <div style="font-weight:600; font-size:0.85rem;">${escapeHtml(m.subject || 'Direct Message')}</div>
        <div style="font-size:0.78rem; color:#64748B; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${escapeHtml(m.clean_message || '')}
        </div>
      </td>
      <td style="max-width: 280px;" class="tamil-text">
        <span style="font-size:0.85rem; color:#1E293B;">${escapeHtml(m.tamil_summary || '-')}</span>
      </td>
      <td>
        <span class="badge ${getPriorityBadgeClass(m.priority)}">${(m.priority || 'NORMAL').toUpperCase()}</span>
      </td>
      <td>
        <span class="badge ${m.status === 'called' ? 'badge-emerald' : 'badge-gray'}">${(m.status || 'RECEIVED').toUpperCase()}</span>
      </td>
      <td>
        ${m.call_id ? `
          <button class="btn-sm" onclick="viewCallDetail('${m.call_id}', '${escapeHtml(m.client_name)}', '${escapeHtml(m.tamil_summary || '')}', '${escapeHtml(m.owner_instruction || '')}')">
            🎧 Audio
          </button>
        ` : `
          <button class="btn-sm" onclick="triggerManualCall('${escapeHtml(m.client_name)}', '${escapeHtml(m.tamil_summary || m.subject)}')">
            📞 Call
          </button>
        `}
      </td>
    </tr>
  `).join('');
}

// Search and filter listeners for messages
document.getElementById('messages-search')?.addEventListener('input', debounce(() => loadMessages(), 300));
document.getElementById('filter-channel')?.addEventListener('change', () => loadMessages());
document.getElementById('filter-priority')?.addEventListener('change', () => loadMessages());

// ============================================================================
// 3. Voice Calls View
// ============================================================================
async function loadCalls(silent = false) {
  try {
    const res = await fetch(`${API_BASE}/calls.php`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    state.calls = data.calls;
    renderCallsTable(data.calls);

  } catch (err) {
    if (!silent) console.error('Error loading calls:', err);
  }
}

function renderCallsTable(calls) {
  const tbody = document.getElementById('calls-table-body');
  if (!calls.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="loading-state">No phone calls placed yet.</td></tr>';
    return;
  }

  tbody.innerHTML = calls.map(c => `
    <tr>
      <td><strong>${escapeHtml(c.client_name)}</strong></td>
      <td><span class="badge ${c.channel === 'whatsapp' ? 'badge-emerald' : 'badge-indigo'}">${c.channel.toUpperCase()}</span></td>
      <td class="tamil-text" style="max-width: 280px; font-size: 0.85rem;">${escapeHtml(c.summary)}</td>
      <td class="tamil-text" style="font-weight: 600; color: #065F46;">${escapeHtml(c.owner_instruction || '-')}</td>
      <td>${c.duration}s</td>
      <td><span class="badge badge-emerald">${c.status.toUpperCase()}</span></td>
      <td style="font-size: 0.78rem; color: #64748B;">${formatRelativeTime(c.started_at || c.created_at)}</td>
      <td>
        <button class="btn-sm" onclick="viewCallDetail('${c.id}', '${escapeHtml(c.client_name)}', '${escapeHtml(c.summary)}', '${escapeHtml(c.owner_instruction || '')}', '${escapeHtml(c.transcript || '')}')">
          View Dialogue
        </button>
      </td>
    </tr>
  `).join('');
}

// ============================================================================
// 4. Action Tasks View
// ============================================================================
async function loadTasks(silent = false) {
  try {
    const status = document.getElementById('filter-task-status')?.value || '';
    const res = await fetch(`${API_BASE}/tasks.php?status=${status}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    state.tasks = data.tasks;
    renderTasksList(data.tasks);

  } catch (err) {
    if (!silent) console.error('Error loading tasks:', err);
  }
}

function renderTasksList(tasks) {
  const container = document.getElementById('tasks-list-container');
  if (!tasks.length) {
    container.innerHTML = '<div class="loading-state">No action tasks found.</div>';
    return;
  }

  container.innerHTML = tasks.map(t => `
    <div class="task-item">
      <div class="task-left">
        <input type="checkbox" class="task-checkbox" ${t.status === 'completed' ? 'checked' : ''} onchange="toggleTaskStatus('${t.id}', this.checked)">
        <div class="task-details">
          <h4 style="${t.status === 'completed' ? 'text-decoration: line-through; color: #94A3B8;' : ''}">${escapeHtml(t.title)}</h4>
          <p class="tamil-text">${escapeHtml(t.description || '')}</p>
        </div>
      </div>
      <div>
        <span class="badge ${getPriorityBadgeClass(t.priority)}">${t.priority.toUpperCase()}</span>
        <span class="badge ${t.status === 'completed' ? 'badge-emerald' : 'badge-amber'}">${t.status.toUpperCase()}</span>
      </div>
    </div>
  `).join('');
}

async function toggleTaskStatus(taskId, isChecked) {
  const newStatus = isChecked ? 'completed' : 'pending';
  try {
    await fetch(`${API_BASE}/tasks.php?action=update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: newStatus })
    });
    showToast(`Task marked as ${newStatus}`, 'success');
    loadTasks(true);
  } catch (err) {
    showToast('Failed to update task', 'error');
  }
}

document.getElementById('filter-task-status')?.addEventListener('change', () => loadTasks());

// ============================================================================
// 5. Clients Directory View
// ============================================================================
async function loadClients() {
  try {
    const res = await fetch(`${API_BASE}/clients.php`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    state.clients = data.clients;
    renderClientsGrid(data.clients);

  } catch (err) {
    console.error('Error loading clients:', err);
  }
}

function renderClientsGrid(clients) {
  const container = document.getElementById('clients-grid-container');
  if (!clients.length) {
    container.innerHTML = '<div class="loading-state">No client profiles found.</div>';
    return;
  }

  container.innerHTML = clients.map(c => `
    <div class="client-card">
      <h4>${escapeHtml(c.name)}</h4>
      <span class="client-company-tag">${escapeHtml(c.company || 'Direct Client')}</span>
      <p style="font-size:0.82rem; color:#475569; margin-bottom:8px;">📱 ${escapeHtml(c.phone || c.whatsapp || c.email || 'No contact')}</p>
      <div class="client-stats-row">
        <span>💬 ${c.total_messages} Messages</span>
        <span>📞 ${c.total_calls} Calls</span>
      </div>
    </div>
  `).join('');
}

// ============================================================================
// 6. Settings View
// ============================================================================
async function loadSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings.php`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    const s = data.settings;
    document.getElementById('set-assistant-name').value = s.assistant_name || 'Arya';
    document.getElementById('set-owner-name').value = s.owner_name || 'Naga';
    document.getElementById('set-owner-phone').value = s.owner_phone || '+916382379565';
    document.getElementById('set-owner-email').value = s.owner_email || 'naga@business.com';
    document.getElementById('set-quiet-start').value = s.quiet_hours_start || '22:00';
    document.getElementById('set-quiet-end').value = s.quiet_hours_end || '07:00';
    document.getElementById('set-allow-high-quiet').checked = !!s.allow_high_priority_in_quiet_hours;
    document.getElementById('set-mock-mode').checked = !!s.mock_mode;

  } catch (err) {
    console.error('Error loading settings:', err);
  }
}

function initSettingsForm() {
  const form = document.getElementById('settings-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      assistantName: document.getElementById('set-assistant-name').value,
      ownerName: document.getElementById('set-owner-name').value,
      ownerPhone: document.getElementById('set-owner-phone').value,
      ownerEmail: document.getElementById('set-owner-email').value,
      quietHoursStart: document.getElementById('set-quiet-start').value,
      quietHoursEnd: document.getElementById('set-quiet-end').value,
      allowHighPriorityInQuietHours: document.getElementById('set-allow-high-quiet').checked,
      mockMode: document.getElementById('set-mock-mode').checked,
      geminiApiKey: document.getElementById('set-gemini-key').value || null
    };

    try {
      const res = await fetch(`${API_BASE}/settings.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Settings saved successfully!', 'success');
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      showToast('Error saving settings: ' + err.message, 'error');
    }
  });
}

// ============================================================================
// 7. Inbound Simulation Modal
// ============================================================================
function initSimulationModal() {
  const modal = document.getElementById('modal-simulate');
  const btnOpen = document.getElementById('btn-open-simulate');
  const btnClose = document.getElementById('btn-close-simulate');
  const btnCancel = document.getElementById('btn-cancel-simulate');
  const form = document.getElementById('simulate-form');

  btnOpen?.addEventListener('click', () => modal.classList.add('show'));
  btnClose?.addEventListener('click', () => modal.classList.remove('show'));
  btnCancel?.addEventListener('click', () => modal.classList.remove('show'));

  // Preset chip clicks
  document.querySelectorAll('.preset-chips .chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.preset-chips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const presetKey = chip.getAttribute('data-preset');
      const p = PRESETS[presetKey];
      if (p) {
        document.getElementById('sim-channel').value = p.channel;
        document.getElementById('sim-client-name').value = p.name;
        document.getElementById('sim-company').value = p.company;
        document.getElementById('sim-contact').value = p.contact;
        document.getElementById('sim-subject').value = p.subject;
        document.getElementById('sim-message').value = p.message;
      }
    });
  });

  // Submit test simulation
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-submit-simulate');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Processing with Gemini AI...</span>';

    const payload = {
      channel: document.getElementById('sim-channel').value,
      clientName: document.getElementById('sim-client-name').value,
      company: document.getElementById('sim-company').value,
      clientContact: document.getElementById('sim-contact').value,
      subject: document.getElementById('sim-subject').value,
      message: document.getElementById('sim-message').value
    };

    try {
      const res = await fetch(`${API_BASE}/simulate.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (!result.success) throw new Error(result.error || 'Failed to process message');

      modal.classList.remove('show');

      if (result.callTriggered) {
        showToast(`📞 Voice Call placed to Naga! Tamil Briefing dispatched.`, 'success');
        // Open Call dialogue modal automatically!
        if (result.call) {
          viewCallDetail(
            result.call.id,
            payload.clientName,
            result.analysis?.summary || 'Chennai Tamil Voice Briefing',
            result.call.owner_instruction || '',
            result.call.transcript || ''
          );
        }
      } else {
        showToast(`✓ Message analyzed. Should call: ${result.should_call ? 'Yes (Quiet hours)' : 'No'}`, 'info');
      }

      loadDashboardData();

    } catch (err) {
      showToast('Simulation failed: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Process & Dispatch Call</span>';
    }
  });
}

// ============================================================================
// 8. Call Detail & Audio Player Simulation
// ============================================================================
function initAudioPlayer() {
  const modal = document.getElementById('modal-call-detail');
  const btnClose = document.getElementById('btn-close-call-modal');
  const playBtn = document.getElementById('audio-play-btn');
  const timer = document.getElementById('audio-timer');

  btnClose?.addEventListener('click', () => modal.classList.remove('show'));

  let isPlaying = false;
  let interval = null;
  let sec = 0;

  playBtn?.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      playBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
      document.querySelector('.audio-wave').style.opacity = '1';
      sec = 0;
      interval = setInterval(() => {
        sec++;
        const s = sec < 10 ? '0' + sec : sec;
        timer.textContent = `00:${s} / 00:42`;
        if (sec >= 42) {
          clearInterval(interval);
          isPlaying = false;
          playBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        }
      }, 1000);
    } else {
      clearInterval(interval);
      playBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
      document.querySelector('.audio-wave').style.opacity = '0.4';
    }
  });
}

function viewCallDetail(callId, clientName, summary, instruction, transcript) {
  const modal = document.getElementById('modal-call-detail');
  document.getElementById('call-modal-title').textContent = `Call Briefing: ${clientName}`;
  document.getElementById('call-modal-sub').textContent = `Phone Dialogue & Naga's Instruction`;

  const fallbackTranscript = `Arya: "வணக்கம் Naga! நான் Arya. உங்க client ${clientName} கிட்ட இருந்து ஒரு முக்கியமான reply வந்திருக்கு."\n\nArya: "${summary}"\n\nArya: "இதுக்கு நான் என்ன note பண்ணணும்?"\n\nNaga: "${instruction || 'சரி, note பண்ணு'}"\n\nArya: "சரி Naga. Note பண்ணிட்டேன். Bye."`;

  document.getElementById('call-modal-transcript').textContent = transcript || fallbackTranscript;
  document.getElementById('call-modal-instruction').textContent = instruction ? `"${instruction}"` : 'No spoken instruction captured.';

  modal.classList.add('show');
}

async function triggerManualCall(clientName, summary) {
  try {
    showToast(`Dialing outbound call for ${clientName}...`, 'info');
    const res = await fetch(`${API_BASE}/calls.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, summary, priority: 'high' })
    });
    const data = await res.json();
    if (data.success) {
      showToast('📞 Phone call placed successfully!', 'success');
      loadCalls();
    }
  } catch (err) {
    showToast('Failed to trigger call: ' + err.message, 'error');
  }
}

// ============================================================================
// Utilities
// ============================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ')}</span>
    <div>${escapeHtml(message)}</div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function getPriorityBadgeClass(priority) {
  if (priority === 'high') return 'badge-rose';
  if (priority === 'normal') return 'badge-indigo';
  return 'badge-gray';
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
