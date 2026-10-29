// ============================================================
// Dashboard Module — Student quiz listing, stats & history
// Advanced version with stats banner
// ============================================================

const dashboard = {
  /** Render student dashboard with stats + quiz grid */
  async render() {
    const app = document.getElementById('app');
    const user = auth.getCurrentUser();

    app.innerHTML = `
      <div class="dashboard-header">
        <h1>Welcome back, ${user ? escHtml(user.name) : 'Student'} 👋</h1>
        <p>Explore available quizzes and track your performance.</p>
      </div>

      <!-- Stats Banner -->
      <div class="stats-banner" id="statsBanner">
        <div class="mini-stat">
          <div class="mini-stat-icon green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="mini-stat-info">
            <div class="stat-num" id="statAvailQuizzes">—</div>
            <div class="stat-lbl">Available Quizzes</div>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-icon purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="mini-stat-info">
            <div class="stat-num" id="statCompleted">—</div>
            <div class="stat-lbl">Completed</div>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-icon orange">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
          <div class="mini-stat-info">
            <div class="stat-num" id="statAvgScore">—</div>
            <div class="stat-lbl">Avg. Score</div>
          </div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-icon blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="mini-stat-info">
            <div class="stat-num" id="statTotalTime">—</div>
            <div class="stat-lbl">Total Time</div>
          </div>
        </div>
      </div>

      <!-- Quiz Grid -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2 style="font-family:'Outfit',sans-serif;font-weight:700;font-size:1.3rem;">Published Quizzes</h2>
        <div style="display:flex;gap:8px;">
          <input type="text" id="quizSearchInput" placeholder="Search quizzes…" style="padding:9px 16px;border:1.5px solid var(--border);border-radius:var(--radius-md);background:var(--bg-card);font-size:0.88rem;width:220px;" oninput="dashboard.filterQuizzes(this.value)">
        </div>
      </div>
      <div class="quiz-grid" id="quizGrid">
        <div class="flex-center" style="grid-column:1/-1;padding:60px;">
          <div class="spinner"></div>
        </div>
      </div>
    `;

    // Load stats in parallel
    this.loadStats();
    this.loadQuizzes();
  },

  allQuizzes: [],

  async loadStats() {
    try {
      const data = await api.get('/quizzes/results/me');
      const results = data.results || [];
      const completed = results.length;
      const avgScore = completed > 0
        ? Math.round(results.reduce((sum, r) => sum + (r.total_marks > 0 ? (r.score / r.total_marks) * 100 : 0), 0) / completed)
        : 0;
      const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);
      const totalMins = Math.round(totalDuration / 60);

      const el = (id) => document.getElementById(id);
      if (el('statCompleted')) el('statCompleted').textContent = completed;
      if (el('statAvgScore')) el('statAvgScore').textContent = avgScore + '%';
      if (el('statTotalTime')) el('statTotalTime').textContent = totalMins > 0 ? totalMins + ' min' : '0 min';
    } catch (err) {
      // Silent fail for stats
    }
  },

  async loadQuizzes() {
    try {
      const data = await api.get('/quizzes');
      this.allQuizzes = data.quizzes || [];

      const el = document.getElementById('statAvailQuizzes');
      if (el) el.textContent = this.allQuizzes.length;

      this.renderQuizCards(this.allQuizzes);
    } catch (err) {
      showToast(err.message || 'Failed to load quizzes.', 'error');
    }
  },

  filterQuizzes(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
      this.renderQuizCards(this.allQuizzes);
      return;
    }
    const filtered = this.allQuizzes.filter(quiz =>
      quiz.title.toLowerCase().includes(q) ||
      quiz.subject.toLowerCase().includes(q) ||
      quiz.exam_type.toLowerCase().includes(q)
    );
    this.renderQuizCards(filtered);
  },

  renderQuizCards(quizzes) {
    const grid = document.getElementById('quizGrid');
    if (!grid) return;

    if (quizzes.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <h3>No Quizzes Found</h3>
          <p>No quizzes match your search or are currently available.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = quizzes.map(q => `
      <div class="quiz-card" onclick="confirmStartQuiz(${q.id}, '${escHtml(q.title).replace(/'/g, "\\'")}', ${q.duration}, ${q.question_count}, ${q.passing_marks || 0})">
        <div class="quiz-card-header">
          <h3>${escHtml(q.title)}</h3>
          <span class="quiz-card-badge">${escHtml(q.exam_type)}</span>
        </div>
        <p class="quiz-desc">${escHtml(q.description || 'Test your knowledge with this quiz. Challenge yourself!')}</p>
        <div class="quiz-card-meta">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            ${escHtml(q.subject)}
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${Math.floor(q.duration / 60)} min
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            ${q.question_count} Qs
          </span>
        </div>
        <div class="quiz-card-footer">
          <span class="marks-info">Total: ${q.total_marks} marks · Pass: ${q.passing_marks} marks</span>
          <button class="btn btn-primary btn-sm">Start Quiz →</button>
        </div>
      </div>
    `).join('');
  },

  /** Render results history page */
  async renderHistory() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="dashboard-header">
        <h1>Quiz History 📊</h1>
        <p>Review your past quiz attempts, scores, and detailed answers.</p>
      </div>
      <div class="results-table" id="historyTable">
        <div class="flex-center" style="padding:60px;">
          <div class="spinner"></div>
        </div>
      </div>
    `;

    try {
      const data = await api.get('/quizzes/results/me');
      const results = data.results || [];

      if (results.length === 0) {
        document.getElementById('historyTable').innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <h3>No Quiz History Yet</h3>
            <p>You haven't taken any quizzes yet. <a href="#/dashboard">Browse available quizzes →</a></p>
          </div>
        `;
        return;
      }

      document.getElementById('historyTable').innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Quiz</th>
              <th>Subject</th>
              <th>Type</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${results.map(r => {
              const pct = r.total_marks > 0 ? Math.round((r.score / r.total_marks) * 100) : 0;
              const passed = r.score >= r.passing_marks;
              const date = r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
              return `
                <tr>
                  <td><strong>${r.quiz_title}</strong></td>
                  <td>${r.subject}</td>
                  <td style="color:var(--text-muted)">${r.exam_type}</td>
                  <td><strong>${r.score}/${r.total_marks}</strong></td>
                  <td><span class="score-badge ${passed ? 'pass' : 'fail'}">${pct}%</span></td>
                  <td>${r.status === 'expired'
                    ? '<span style="color:var(--warning);font-weight:600;">⏱ Expired</span>'
                    : passed
                      ? '<span style="color:var(--success);font-weight:600;">✓ Passed</span>'
                      : '<span style="color:var(--danger);font-weight:600;">✗ Failed</span>'}</td>
                  <td style="color:var(--text-muted);font-size:0.85rem;">${date}</td>
                  <td><a href="#/results/${r.attempt_id}" class="btn btn-outline btn-sm">View Details</a></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      showToast(err.message || 'Failed to load history.', 'error');
    }
  },
};
