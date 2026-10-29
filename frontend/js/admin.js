// ============================================================
// Admin Module — Full Dashboard with Activity Feed & Notifications
// ============================================================

const adminModule = {
  _currentTab: 'overview',
  _statsData: null,

  /** Helper: time-ago */
  timeAgo(dateStr) {
    if (!dateStr) return '—';
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  /** Render admin dashboard */
  async render() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="dashboard-header">
        <h1>Admin Dashboard 🛠️</h1>
        <p>Manage quizzes, monitor activity, and track platform performance.</p>
      </div>

      <!-- Admin Tabs -->
      <div class="admin-tabs" id="adminTabs">
        <button class="admin-tab active" data-tab="overview" onclick="adminModule.switchTab('overview')">
          📊 Overview
        </button>
        <button class="admin-tab" data-tab="activity" onclick="adminModule.switchTab('activity')">
          🔔 Activity Feed
        </button>
        <button class="admin-tab" data-tab="users" onclick="adminModule.switchTab('users')">
          👥 Users
        </button>
        <button class="admin-tab" data-tab="payments" onclick="adminModule.switchTab('payments')">
          💳 Payments
        </button>
        <button class="admin-tab" data-tab="quizzes" onclick="adminModule.switchTab('quizzes')">
          📝 Quizzes
        </button>
      </div>

      <!-- Tab Content -->
      <div id="adminTabContent">
        <div class="flex-center" style="min-height:200px;"><div class="spinner"></div></div>
      </div>
    `;

    await this.switchTab(this._currentTab);
  },

  /** Switch tab */
  async switchTab(tab) {
    this._currentTab = tab;
    // Update tab active states
    document.querySelectorAll('.admin-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });

    const content = document.getElementById('adminTabContent');
    content.innerHTML = '<div class="flex-center" style="min-height:200px;"><div class="spinner"></div></div>';

    try {
      switch (tab) {
        case 'overview':  await this.renderOverview(content); break;
        case 'activity':  await this.renderActivityFeed(content); break;
        case 'users':     await this.renderUsers(content); break;
        case 'payments':  await this.renderPayments(content); break;
        case 'quizzes':   await this.renderQuizzesTab(content); break;
      }
    } catch (err) {
      content.innerHTML = `<div class="activity-empty"><h3>Error Loading Data</h3><p>${err.message || 'Something went wrong.'}</p></div>`;
    }
  },

  // ══════════════════════════════════════════════════════════════
  // OVERVIEW TAB
  // ══════════════════════════════════════════════════════════════
  async renderOverview(container) {
    const data = await api.get('/admin/stats');
    this._statsData = data;
    const s = data.stats;

    container.innerHTML = `
      <!-- Stats Grid — 8 Cards -->
      <div class="admin-stats-grid" id="statsGrid" style="grid-template-columns: repeat(4, 1fr);">
        <div class="stat-card">
          <div class="stat-icon primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${s.total_quizzes}</div>
            <div class="stat-title">Total Quizzes</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon accent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${s.total_students}</div>
            <div class="stat-title">Students</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${s.total_attempts}</div>
            <div class="stat-title">Quiz Attempts</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${s.avg_score}%</div>
            <div class="stat-title">Avg. Score</div>
          </div>
        </div>
      </div>

      <!-- Second row: Revenue, Subscriptions, New Signups -->
      <div class="admin-stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 28px;">
        <div class="stat-card" style="border-left: 3px solid var(--success);">
          <div class="stat-icon" style="background: var(--success-bg); color: var(--success);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">₹${s.total_revenue || 0}</div>
            <div class="stat-title">Total Revenue</div>
          </div>
        </div>
        <div class="stat-card" style="border-left: 3px solid var(--accent);">
          <div class="stat-icon" style="background: var(--accent-50); color: var(--accent);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${s.active_subscriptions || 0}</div>
            <div class="stat-title">Active Subscriptions</div>
          </div>
        </div>
        <div class="stat-card" style="border-left: 3px solid var(--info);">
          <div class="stat-icon" style="background: var(--info-bg); color: var(--info);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          </div>
          <div class="stat-info">
            <div class="stat-number">${s.new_registrations_7d || 0}</div>
            <div class="stat-title">New Signups (7d)</div>
          </div>
        </div>
      </div>

      <!-- Recent Activity Preview -->
      <div class="activity-feed" id="overviewActivity">
        <div class="activity-feed-header">
          <h3>📋 Recent Activity</h3>
          <button class="btn btn-outline btn-sm" onclick="adminModule.switchTab('activity')">View All →</button>
        </div>
        <div class="activity-list" id="overviewActivityList" style="max-height:400px;">
          <div class="flex-center" style="padding:40px;"><div class="spinner"></div></div>
        </div>
      </div>
    `;

    // Load recent activity preview
    try {
      const actData = await api.get('/admin/activity');
      const items = (actData.activities || []).slice(0, 8);
      this._renderActivityItems(document.getElementById('overviewActivityList'), items);
    } catch (e) {
      document.getElementById('overviewActivityList').innerHTML = `
        <div class="activity-empty"><p>Activity feed unavailable</p></div>
      `;
    }
  },

  // ══════════════════════════════════════════════════════════════
  // ACTIVITY FEED TAB
  // ══════════════════════════════════════════════════════════════
  async renderActivityFeed(container) {
    container.innerHTML = `
      <div class="activity-feed">
        <div class="activity-feed-header">
          <h3>🔔 All Platform Activity</h3>
          <div class="activity-filters" id="activityFilters">
            <button class="activity-filter active" data-filter="all" onclick="adminModule.filterActivity('all')">All</button>
            <button class="activity-filter" data-filter="quiz_attempt" onclick="adminModule.filterActivity('quiz_attempt')">📝 Quizzes</button>
            <button class="activity-filter" data-filter="subscription" onclick="adminModule.filterActivity('subscription')">💳 Payments</button>
            <button class="activity-filter" data-filter="registration" onclick="adminModule.filterActivity('registration')">👤 Registrations</button>
          </div>
        </div>
        <div class="activity-list" id="activityList" style="max-height:700px;">
          <div class="flex-center" style="padding:40px;"><div class="spinner"></div></div>
        </div>
      </div>
    `;

    const data = await api.get('/admin/activity');
    this._allActivities = data.activities || [];
    this._renderActivityItems(document.getElementById('activityList'), this._allActivities);
  },

  _allActivities: [],

  filterActivity(filter) {
    document.querySelectorAll('.activity-filter').forEach(f => {
      f.classList.toggle('active', f.dataset.filter === filter);
    });

    const filtered = filter === 'all'
      ? this._allActivities
      : this._allActivities.filter(a => a.type === filter);

    this._renderActivityItems(document.getElementById('activityList'), filtered);
  },

  _renderActivityItems(container, items) {
    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="activity-empty">
          <h3>No Activity Yet</h3>
          <p>Activity will appear here as users take quizzes, make purchases, and create accounts.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(a => {
      const typeClass = a.type === 'quiz_attempt' ? 'quiz' : a.type === 'subscription' ? 'payment' : 'register';
      const typeLabel = a.type === 'quiz_attempt' ? 'Quiz' : a.type === 'subscription' ? 'Payment' : 'New User';
      return `
        <div class="activity-item">
          <div class="activity-icon ${typeClass}">${a.icon}</div>
          <div class="activity-content">
            <div class="activity-title">
              ${a.title}
              <span class="activity-type-badge ${typeClass}">${typeLabel}</span>
            </div>
            <div class="activity-detail">${a.detail}</div>
          </div>
          <div class="activity-time">${this.timeAgo(a.time)}</div>
        </div>
      `;
    }).join('');
  },

  // ══════════════════════════════════════════════════════════════
  // USERS TAB
  // ══════════════════════════════════════════════════════════════
  async renderUsers(container) {
    const data = await api.get('/admin/registrations');
    const users = data.users || [];

    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-section-header">
          <h3>👥 Registered Users <span style="color:var(--text-muted);font-weight:400;font-size:0.88rem;">(${users.length})</span></h3>
        </div>
        ${users.length === 0 ? `
          <div class="activity-empty"><h3>No Users</h3><p>No accounts have been created yet.</p></div>
        ` : `
          <table class="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Quizzes Taken</th>
                <th>Avg Score</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              ${users.map((u, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${escHtml(u.name)}</strong></td>
                  <td style="color:var(--text-muted)">${escHtml(u.email)}</td>
                  <td><span class="user-role-badge ${u.role}">${u.role === 'admin' ? '🛡️ Admin' : '🎓 Student'}</span></td>
                  <td>${u.quiz_count || 0}</td>
                  <td>${u.avg_score ? u.avg_score + '%' : '—'}</td>
                  <td style="color:var(--text-muted);font-size:0.85rem;">${this.timeAgo(u.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;
  },

  // ══════════════════════════════════════════════════════════════
  // PAYMENTS TAB
  // ══════════════════════════════════════════════════════════════
  async renderPayments(container) {
    let payments = [];
    try {
      const data = await api.get('/admin/all-payments');
      payments = data.payments || [];
    } catch (e) {
      // payments table may not exist
    }

    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-section-header">
          <h3>💳 All Payments <span style="color:var(--text-muted);font-weight:400;font-size:0.88rem;">(${payments.length})</span></h3>
        </div>
        ${payments.length === 0 ? `
          <div class="activity-empty"><h3>No Payments</h3><p>No subscription purchases have been made yet.</p></div>
        ` : `
          <table class="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>
                    <strong>${escHtml(p.user_name)}</strong>
                    <div style="font-size:0.78rem;color:var(--text-muted);">${escHtml(p.user_email)}</div>
                  </td>
                  <td><strong>${escHtml(p.product_name)}</strong></td>
                  <td style="font-weight:700;color:var(--primary);">₹${p.amount}</td>
                  <td>
                    <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 12px;border-radius:20px;background:var(--bg);font-size:0.78rem;font-weight:600;">
                      ${p.payment_method === 'card' ? '💳' : p.payment_method === 'razorpay' ? '🔷' : '📱'} ${p.payment_method}
                    </span>
                  </td>
                  <td>
                    ${p.plan_type ? `
                      <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 12px;border-radius:20px;background:${p.plan_type === 'pro' ? 'var(--accent-50)' : p.plan_type === 'enterprise' ? 'var(--info-bg)' : 'var(--primary-50)'};color:${p.plan_type === 'pro' ? 'var(--accent)' : p.plan_type === 'enterprise' ? 'var(--info)' : 'var(--primary)'};font-size:0.73rem;font-weight:700;text-transform:uppercase;">
                        ${p.plan_type === 'pro' ? '⭐' : p.plan_type === 'enterprise' ? '💎' : '📦'} ${p.plan_type}
                      </span>
                    ` : '<span style="color:var(--text-muted);">—</span>'}
                  </td>
                  <td><span class="status-badge ${p.status === 'completed' ? 'published' : 'draft'}">${p.status}</span></td>
                  <td style="color:var(--text-muted);font-size:0.85rem;">${this.timeAgo(p.created_at)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}
      </div>
    `;
  },

  // ══════════════════════════════════════════════════════════════
  // QUIZZES TAB (Original quiz management)
  // ══════════════════════════════════════════════════════════════
  async renderQuizzesTab(container) {
    container.innerHTML = '<div id="adminQuizSection"></div>';
    await this.loadQuizzes();
  },

  /** Load quiz list for admin */
  async loadQuizzes() {
    try {
      const data = await api.get('/admin/quizzes');
      const quizzes = data.quizzes || [];

      document.getElementById('adminQuizSection').innerHTML = `
        <div class="admin-section">
          <div class="admin-section-header">
            <h3>All Quizzes</h3>
            <button class="btn btn-primary btn-sm" onclick="adminModule.showCreateQuizModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create Quiz
            </button>
          </div>
          ${quizzes.length === 0 ? `
            <div class="empty-state">
              <h3>No Quizzes Yet</h3>
              <p>Create your first quiz to get started.</p>
            </div>
          ` : `
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Questions</th>
                  <th>Duration</th>
                  <th>Attempts</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${quizzes.map(q => `
                  <tr>
                    <td><strong>${q.title}</strong></td>
                    <td>${q.subject}</td>
                    <td>${q.question_count}</td>
                    <td>${Math.floor(q.duration / 60)} min</td>
                    <td>${q.attempt_count}</td>
                    <td><span class="status-badge ${q.status}">${q.status}</span></td>
                    <td>
                      <div class="action-btns">
                        <button class="action-btn" onclick="adminModule.showEditQuizModal(${q.id}, '${q.title.replace(/'/g, "\\'")}', '${q.description ? q.description.replace(/'/g, "\\'") : ''}', '${q.subject}', '${q.exam_type}', ${q.duration}, ${q.passing_marks}, '${q.status}')" title="Edit">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="action-btn" onclick="adminModule.manageQuestions(${q.id})" title="Questions">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                        </button>
                        <button class="action-btn" onclick="adminModule.viewResults(${q.id}, '${q.title.replace(/'/g, "\\'")}')" title="Results">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </button>
                        <button class="action-btn danger" onclick="adminModule.deleteQuiz(${q.id})" title="Delete">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      `;
    } catch (err) {
      showToast(err.message || 'Failed to load quizzes.', 'error');
    }
  },

  /** Show create quiz modal */
  showCreateQuizModal() {
    showModal(`
      <div class="modal-header">
        <h3>Create New Quiz</h3>
        <button class="modal-close" onclick="hideModal()">✕</button>
      </div>
      <form id="createQuizForm">
        <div class="form-group">
          <label for="quizTitle">Quiz Title *</label>
          <input type="text" id="quizTitle" placeholder="e.g., Physics Fundamentals" required>
        </div>
        <div class="form-group">
          <label for="quizDesc">Description</label>
          <textarea id="quizDesc" placeholder="Brief description…" rows="3" style="resize:vertical;"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label for="quizSubject">Subject</label>
            <input type="text" id="quizSubject" placeholder="e.g., Physics" value="General">
          </div>
          <div class="form-group">
            <label for="quizExamType">Exam Type</label>
            <input type="text" id="quizExamType" placeholder="e.g., Model Test" value="Practice">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label for="quizDuration">Duration (seconds) *</label>
            <input type="number" id="quizDuration" value="600" min="30" required>
          </div>
          <div class="form-group">
            <label for="quizPassing">Passing Marks</label>
            <input type="number" id="quizPassing" value="0" min="0">
          </div>
        </div>
        <div class="form-group">
          <label for="quizStatus">Status</label>
          <select id="quizStatus">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" onclick="hideModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Quiz</button>
        </div>
      </form>
    `);

    document.getElementById('createQuizForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.post('/admin/quizzes', {
          title: document.getElementById('quizTitle').value.trim(),
          description: document.getElementById('quizDesc').value.trim(),
          subject: document.getElementById('quizSubject').value.trim(),
          exam_type: document.getElementById('quizExamType').value.trim(),
          duration: parseInt(document.getElementById('quizDuration').value),
          passing_marks: parseInt(document.getElementById('quizPassing').value) || 0,
          status: document.getElementById('quizStatus').value,
        });
        hideModal();
        showToast('Quiz created successfully!', 'success');
        this.loadQuizzes();
      } catch (err) {
        showToast(err.message || 'Failed to create quiz.', 'error');
      }
    });
  },

  /** Show edit quiz modal */
  showEditQuizModal(id, title, desc, subject, examType, duration, passing, status) {
    showModal(`
      <div class="modal-header">
        <h3>Edit Quiz</h3>
        <button class="modal-close" onclick="hideModal()">✕</button>
      </div>
      <form id="editQuizForm">
        <div class="form-group">
          <label for="editTitle">Quiz Title</label>
          <input type="text" id="editTitle" value="${title}" required>
        </div>
        <div class="form-group">
          <label for="editDesc">Description</label>
          <textarea id="editDesc" rows="3" style="resize:vertical;">${desc}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label for="editSubject">Subject</label>
            <input type="text" id="editSubject" value="${subject}">
          </div>
          <div class="form-group">
            <label for="editExamType">Exam Type</label>
            <input type="text" id="editExamType" value="${examType}">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label for="editDuration">Duration (seconds)</label>
            <input type="number" id="editDuration" value="${duration}" min="30">
          </div>
          <div class="form-group">
            <label for="editPassing">Passing Marks</label>
            <input type="number" id="editPassing" value="${passing}" min="0">
          </div>
        </div>
        <div class="form-group">
          <label for="editStatus">Status</label>
          <select id="editStatus">
            <option value="draft" ${status === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="published" ${status === 'published' ? 'selected' : ''}>Published</option>
            <option value="archived" ${status === 'archived' ? 'selected' : ''}>Archived</option>
          </select>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" onclick="hideModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `);

    document.getElementById('editQuizForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await api.put(`/admin/quizzes/${id}`, {
          title: document.getElementById('editTitle').value.trim(),
          description: document.getElementById('editDesc').value.trim(),
          subject: document.getElementById('editSubject').value.trim(),
          exam_type: document.getElementById('editExamType').value.trim(),
          duration: parseInt(document.getElementById('editDuration').value),
          passing_marks: parseInt(document.getElementById('editPassing').value) || 0,
          status: document.getElementById('editStatus').value,
        });
        hideModal();
        showToast('Quiz updated!', 'success');
        this.loadQuizzes();
      } catch (err) {
        showToast(err.message || 'Failed to update quiz.', 'error');
      }
    });
  },

  /** Delete quiz */
  async deleteQuiz(id) {
    showModal(`
      <div class="modal-header">
        <h3>Delete Quiz</h3>
        <button class="modal-close" onclick="hideModal()">✕</button>
      </div>
      <p style="color:var(--text-secondary);margin-bottom:16px;">Are you sure you want to delete this quiz? This action cannot be undone and will remove all associated questions, attempts, and results.</p>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="hideModal()">Cancel</button>
        <button class="btn btn-danger" onclick="adminModule.confirmDelete(${id})">Delete Permanently</button>
      </div>
    `);
  },

  async confirmDelete(id) {
    try {
      await api.delete(`/admin/quizzes/${id}`);
      hideModal();
      showToast('Quiz deleted.', 'success');
      this.loadQuizzes();
    } catch (err) {
      showToast(err.message || 'Failed to delete quiz.', 'error');
    }
  },

  /** Manage questions for a quiz */
  async manageQuestions(quizId) {
    showLoading(true);
    try {
      const data = await api.get(`/admin/quizzes/${quizId}/questions`);
      const questions = data.questions || [];
      showLoading(false);

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="dashboard-header">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h1>Manage Questions</h1>
              <p>Quiz #${quizId} · ${questions.length} question(s)</p>
            </div>
            <div style="display:flex;gap:12px;">
              <button class="btn btn-outline" onclick="adminModule.render()">← Back</button>
              <button class="btn btn-primary" onclick="adminModule.showAddQuestionModal(${quizId})">+ Add Question</button>
            </div>
          </div>
        </div>

        <div id="questionsList">
          ${questions.length === 0 ? `
            <div class="admin-section">
              <div class="empty-state">
                <h3>No Questions Yet</h3>
                <p>Add your first question to this quiz.</p>
              </div>
            </div>
          ` : questions.map((q, i) => {
            const options = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            return `
              <div class="admin-section" style="margin-bottom:16px;">
                <div class="admin-section-header">
                  <h3>Q${i + 1}. ${escHtml(q.text)} <span style="color:var(--text-muted);font-weight:400;">(${q.marks} mark${q.marks > 1 ? 's' : ''})</span></h3>
                  <button class="btn btn-danger btn-sm" onclick="adminModule.deleteQuestion(${q.id}, ${quizId})">Delete</button>
                </div>
                <div style="padding:0 16px;color:var(--text-muted);font-size:0.82rem;">
                  Difficulty: ${escHtml(q.difficulty || 'medium')}
                  ${q.explanation ? `<div style="margin-top:6px;">Explanation: ${escHtml(q.explanation)}</div>` : ''}
                </div>
                <div style="padding:16px;">
                  ${options.map(opt => `
                    <div style="display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:var(--radius-sm);margin-bottom:4px;${opt.is_correct ? 'background:var(--success-bg);' : ''}">
                      <span style="width:28px;height:28px;border-radius:4px;${opt.is_correct ? 'background:var(--success);color:white;' : 'background:var(--bg);color:var(--text-secondary);'}display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;">${escHtml(opt.label)}</span>
                      <span style="font-size:0.9rem;">${escHtml(opt.text)}</span>
                      ${opt.is_correct ? '<span style="margin-left:auto;color:var(--success);font-size:0.8rem;font-weight:600;">✓ Correct</span>' : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (err) {
      showLoading(false);
      showToast(err.message || 'Failed to load questions.', 'error');
    }
  },

  /** Show add question modal */
  showAddQuestionModal(quizId) {
    showModal(`
      <div class="modal-header">
        <h3>Add Question</h3>
        <button class="modal-close" onclick="hideModal()">✕</button>
      </div>
      <form id="addQuestionForm">
        <div class="form-group">
          <label for="qText">Question Text *</label>
          <textarea id="qText" placeholder="Enter the question…" rows="3" required style="resize:vertical;"></textarea>
        </div>
        <div class="form-group">
          <label for="qMarks">Marks</label>
          <input type="number" id="qMarks" value="1" min="1" max="100" required>
        </div>
        <div class="form-group">
          <label for="qDifficulty">Difficulty</label>
          <select id="qDifficulty">
            <option value="easy">Easy</option>
            <option value="medium" selected>Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div class="form-group">
          <label for="qExplanation">Explanation (shown after quiz)</label>
          <textarea id="qExplanation" placeholder="Explain why the correct answer is right." rows="2" style="resize:vertical;"></textarea>
        </div>
        <div style="margin-bottom:16px;">
          <label style="font-size:0.85rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:8px;">Options</label>
          <div id="optionsContainer">
            ${['A','B','C','D'].map((label, i) => `
              <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
                <span style="width:32px;height:32px;border-radius:4px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;">${label}</span>
                <input type="text" id="optText${label}" placeholder="Option ${label} text" style="flex:1;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);background:var(--bg);font-size:0.9rem;" required>
                <label style="display:flex;align-items:center;gap:4px;font-size:0.8rem;color:var(--text-secondary);cursor:pointer;white-space:nowrap;">
                  <input type="radio" name="correctOpt" value="${label}" ${i === 0 ? 'checked' : ''}> Correct
                </label>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" onclick="hideModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Question</button>
        </div>
      </form>
    `);

    document.getElementById('addQuestionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const correctLabel = document.querySelector('input[name="correctOpt"]:checked').value;
      const options = ['A','B','C','D'].map(label => ({
        label,
        text: document.getElementById(`optText${label}`).value.trim(),
        is_correct: label === correctLabel,
      })).filter(o => o.text);

      if (options.length < 2) {
        showToast('At least 2 options are required.', 'warning');
        return;
      }

      try {
        await api.post(`/admin/quizzes/${quizId}/questions`, {
          text: document.getElementById('qText').value.trim(),
          marks: parseInt(document.getElementById('qMarks').value) || 1,
          difficulty: document.getElementById('qDifficulty').value,
          explanation: document.getElementById('qExplanation').value.trim(),
          options,
        });
        hideModal();
        showToast('Question added!', 'success');
        this.manageQuestions(quizId);
      } catch (err) {
        showToast(err.message || 'Failed to add question.', 'error');
      }
    });
  },

  /** Delete a question */
  async deleteQuestion(questionId, quizId) {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/admin/questions/${questionId}`);
      showToast('Question deleted.', 'success');
      this.manageQuestions(quizId);
    } catch (err) {
      showToast(err.message || 'Failed to delete question.', 'error');
    }
  },

  /** View quiz results */
  async viewResults(quizId, title) {
    showLoading(true);
    try {
      const data = await api.get(`/admin/quizzes/${quizId}/results`);
      showLoading(false);
      const results = data.results || [];

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="dashboard-header">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h1>Results: ${escHtml(title)}</h1>
              <p>${results.length} submission(s)</p>
            </div>
            <button class="btn btn-outline" onclick="adminModule.render()">← Back</button>
          </div>
        </div>

        <div class="results-table">
          ${results.length === 0 ? `
            <div class="empty-state">
              <h3>No Results</h3>
              <p>No students have attempted this quiz yet.</p>
            </div>
          ` : `
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                ${results.map((r, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${escHtml(r.student_name)}</strong></td>
                    <td style="color:var(--text-muted)">${escHtml(r.student_email)}</td>
                    <td>${r.score}/${r.total_marks}</td>
                    <td><span class="score-badge ${r.percentage >= 50 ? 'pass' : 'fail'}">${r.percentage}%</span></td>
                    <td>${r.status}</td>
                    <td style="color:var(--text-muted)">${r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}
        </div>
      `;
    } catch (err) {
      showLoading(false);
      showToast(err.message || 'Failed to load results.', 'error');
    }
  },
};
