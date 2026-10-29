// ============================================================
// Quiz Module — Quiz taking interface (Screenshot-accurate)
// ============================================================

const quizModule = {
  attempt: null,
  quiz: null,
  questions: [],
  answers: {},
  bookmarks: new Set(),
  currentIndex: 0,
  timerInterval: null,
  remainingSeconds: 0,

  cleanup() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  async startQuiz(quizId) {
    this.cleanup();
    showLoading(true);
    try {
      const data = await api.post(`/quizzes/${quizId}/start`);
      this.attempt = data.attempt;
      this.quiz = data.quiz;
      this.questions = data.questions.map(q => {
        if (typeof q.options === 'string') q.options = JSON.parse(q.options);
        return q;
      });
      this.currentIndex = 0;
      this.answers = {};
      this.bookmarks = new Set();

      if (data.saved_answers && data.saved_answers.length > 0) {
        data.saved_answers.forEach(sa => {
          if (sa.selected_option_id) this.answers[sa.question_id] = sa.selected_option_id;
          if (sa.is_bookmarked) this.bookmarks.add(sa.question_id);
        });
      }

      const deadline = new Date(this.attempt.deadline).getTime();
      this.remainingSeconds = Math.max(0, Math.floor((deadline - Date.now()) / 1000));

      this.renderQuizInterface();
      this.startTimer();
      setQuizInProgress(true);
      showLoading(false);
    } catch (err) {
      showLoading(false);
      showToast(err.message || 'Failed to start quiz.', 'error');
      window.location.hash = '#/dashboard';
    }
  },

  renderQuizInterface() {
    const app = document.getElementById('app');
    const q = this.questions[this.currentIndex];
    const totalQ = this.questions.length;
    const answeredCount = Object.keys(this.answers).length;
    const progress = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;
    const circumference = 2 * Math.PI * 54;

    app.innerHTML = `
      <div class="quiz-interface">
        <!-- ═══ Quiz Info Bar — Screenshot exact ═══ -->
        <div class="quiz-info-bar">
          <div class="quiz-info-item">
            <span class="info-label">Exam Type</span>
            <span class="info-value">
              <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${escHtml(this.quiz.exam_type || 'Model Test')}
            </span>
          </div>
          <div class="quiz-info-item">
            <span class="info-label">Subject</span>
            <span class="info-value">
              <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              ${escHtml(this.quiz.subject || 'General')}
            </span>
          </div>
          <div class="progress-section">
            <span class="info-label">Completed (${answeredCount}/${totalQ})</span>
            <div class="progress-bar-container">
              <div class="progress-bar">
                <div class="progress-bar-fill" style="width:${progress}%"></div>
              </div>
              <span class="progress-text">${progress}%</span>
            </div>
          </div>
          <div class="quiz-info-submit">
            <button class="btn btn-submit-answer" onclick="quizModule.confirmSubmit()">
              Submit Answer
            </button>
          </div>
        </div>

        <!-- ═══ Quiz Layout — Two columns ═══ -->
        <div class="quiz-layout">
          <!-- LEFT: Question Panel -->
          <div class="question-panel">
            <span class="question-number-badge">Question: ${this.currentIndex + 1}</span>

            <div class="question-header">
              <h2>${escHtml(q.text)}</h2>
              <button class="bookmark-btn ${this.bookmarks.has(q.id) ? 'active' : ''}" onclick="quizModule.toggleBookmark(${q.id})" title="Bookmark this question">
                <svg viewBox="0 0 24 24" fill="${this.bookmarks.has(q.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </button>
            </div>

            <!-- Options A, B, C, D -->
            <div class="options-list">
              ${q.options.map(opt => `
                <div class="option-item ${this.answers[q.id] === opt.id ? 'selected' : ''}"
                     onclick="quizModule.selectOption(${q.id}, ${opt.id})">
                  <span class="option-label">${escHtml(opt.label)}</span>
                  <span class="option-text">${escHtml(opt.text)}</span>
                </div>
              `).join('')}
            </div>

            <!-- Bottom Navigation: First | Back | 1/4 | Next | Last -->
            <div class="question-nav">
              <button class="btn btn-outline btn-sm" onclick="quizModule.goToQuestion(0)" ${this.currentIndex === 0 ? 'disabled' : ''}>First</button>
              <button class="btn btn-outline btn-sm" onclick="quizModule.prev()" ${this.currentIndex === 0 ? 'disabled' : ''}>Back</button>
              <span class="page-indicator">${this.currentIndex + 1} / ${totalQ}</span>
              <button class="btn btn-outline btn-sm" onclick="quizModule.next()" ${this.currentIndex >= totalQ - 1 ? 'disabled' : ''}>Next</button>
              <button class="btn btn-outline btn-sm" onclick="quizModule.goToQuestion(${totalQ - 1})" ${this.currentIndex >= totalQ - 1 ? 'disabled' : ''}>Last</button>
            </div>
          </div>

          <!-- RIGHT: Side Panel -->
          <div class="side-panel">
            <!-- Timer Ring -->
            <div class="timer-card">
              <div class="timer-ring-container">
                <svg class="timer-ring" viewBox="0 0 130 130">
                  <circle class="timer-ring-bg" cx="65" cy="65" r="54"/>
                  <circle class="timer-ring-progress" id="timerProgress" cx="65" cy="65" r="54"
                    stroke-dasharray="${circumference}"
                    stroke-dashoffset="0"/>
                </svg>
                <span class="timer-text" id="timerText">0:00</span>
              </div>
              <div class="timer-label">Timer Remaining:</div>
            </div>

            <!-- Action Buttons -->
            <div class="side-actions">
              <button class="side-action-btn highlight" onclick="quizModule.showBookmarked()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                View Bookmarked
              </button>
              <button class="side-action-btn" onclick="quizModule.showUnanswered()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                View Un Answered
              </button>
              <button class="side-action-btn" onclick="quizModule.toggleBookmark(${q.id})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                Save for Revision
              </button>
            </div>

            <!-- Question Number Grid -->
            <div class="question-pagination">
              <div class="pagination-grid">
                <button class="page-arrow" onclick="quizModule.prev()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                ${this.questions.map((question, i) => {
                  let cls = '';
                  if (i === this.currentIndex) cls = 'active';
                  else if (this.bookmarks.has(question.id)) cls = 'bookmarked';
                  else if (this.answers[question.id]) cls = 'answered';
                  return `<button class="page-num ${cls}" onclick="quizModule.goToQuestion(${i})">${i + 1}</button>`;
                }).join('')}
                <button class="page-arrow" onclick="quizModule.next()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.updateTimerDisplay();
  },

  async selectOption(questionId, optionId) {
    this.answers[questionId] = optionId;
    this.renderQuizInterface();
    try {
      await api.post(`/quizzes/attempts/${this.attempt.id}/answer`, {
        question_id: questionId,
        selected_option_id: optionId,
        is_bookmarked: this.bookmarks.has(questionId),
      });
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  },

  async toggleBookmark(questionId) {
    if (this.bookmarks.has(questionId)) this.bookmarks.delete(questionId);
    else this.bookmarks.add(questionId);
    this.renderQuizInterface();
    try {
      await api.post(`/quizzes/attempts/${this.attempt.id}/answer`, {
        question_id: questionId,
        selected_option_id: this.answers[questionId] || null,
        is_bookmarked: this.bookmarks.has(questionId),
      });
    } catch (err) { console.error('Bookmark save failed:', err); }
  },

  next() {
    if (this.currentIndex < this.questions.length - 1) { this.currentIndex++; this.renderQuizInterface(); }
  },

  prev() {
    if (this.currentIndex > 0) { this.currentIndex--; this.renderQuizInterface(); }
  },

  goToQuestion(index) {
    if (index >= 0 && index < this.questions.length) { this.currentIndex = index; this.renderQuizInterface(); }
  },

  showBookmarked() {
    const indices = this.questions.map((q, i) => this.bookmarks.has(q.id) ? i : -1).filter(i => i >= 0);
    if (indices.length === 0) { showToast('No bookmarked questions.', 'info'); return; }
    let next = indices.find(i => i > this.currentIndex);
    if (next === undefined) next = indices[0];
    this.goToQuestion(next);
    showToast(`Showing bookmarked question ${next + 1}`, 'info');
  },

  showUnanswered() {
    const indices = this.questions.map((q, i) => !this.answers[q.id] ? i : -1).filter(i => i >= 0);
    if (indices.length === 0) { showToast('All questions answered! 🎉', 'success'); return; }
    let next = indices.find(i => i > this.currentIndex);
    if (next === undefined) next = indices[0];
    this.goToQuestion(next);
    showToast(`${indices.length} unanswered question(s) remaining`, 'warning');
  },

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.remainingSeconds--;
      if (this.remainingSeconds <= 0) {
        this.remainingSeconds = 0;
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        showToast('⏱ Time is up! Submitting your quiz…', 'warning');
        this.submitQuiz();
        return;
      }
      this.updateTimerDisplay();
    }, 1000);
  },

  updateTimerDisplay() {
    const circumference = 2 * Math.PI * 54;
    const fraction = this.remainingSeconds / this.quiz.duration;
    const offset = circumference * (1 - fraction);

    const prog = document.getElementById('timerProgress');
    const text = document.getElementById('timerText');
    if (!prog || !text) return;

    prog.style.strokeDashoffset = offset;
    prog.classList.remove('warning', 'danger');
    text.classList.remove('warning', 'danger');

    if (fraction < 0.15) { prog.classList.add('danger'); text.classList.add('danger'); }
    else if (fraction < 0.35) { prog.classList.add('warning'); text.classList.add('warning'); }

    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    text.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  confirmSubmit() {
    const unanswered = this.questions.filter(q => !this.answers[q.id]).length;
    const answered = Object.keys(this.answers).length;

    showModal(`
      <div class="modal-header">
        <h3>Submit Quiz</h3>
        <button class="modal-close" onclick="hideModal()">✕</button>
      </div>
      <p style="color:var(--text-secondary);margin-bottom:20px;">
        ${unanswered > 0
          ? `You have <strong>${unanswered} unanswered</strong> question(s). Are you sure you want to submit?`
          : 'All questions answered! Ready to submit?'}
      </p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:8px;">
        <div style="padding:18px;background:var(--primary-50);border-radius:var(--radius-md);text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:var(--primary);font-family:'Outfit',sans-serif;">${answered}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);font-weight:500;">Answered</div>
        </div>
        <div style="padding:18px;background:var(--warning-bg);border-radius:var(--radius-md);text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:var(--warning);font-family:'Outfit',sans-serif;">${unanswered}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);font-weight:500;">Unanswered</div>
        </div>
        <div style="padding:18px;background:var(--accent-50);border-radius:var(--radius-md);text-align:center;">
          <div style="font-size:1.6rem;font-weight:800;color:var(--accent);font-family:'Outfit',sans-serif;">${this.bookmarks.size}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);font-weight:500;">Bookmarked</div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="hideModal()">Review Answers</button>
        <button class="btn btn-primary" onclick="hideModal(); quizModule.submitQuiz();">Submit Now</button>
      </div>
    `);
  },

  async submitQuiz() {
    this.cleanup();
    setQuizInProgress(false);
    showLoading(true);
    try {
      const answersArray = Object.entries(this.answers).map(([qid, oid]) => ({
        question_id: parseInt(qid),
        selected_option_id: oid,
        is_bookmarked: this.bookmarks.has(parseInt(qid)),
      }));

      const data = await api.post(`/quizzes/attempts/${this.attempt.id}/submit`, { answers: answersArray });
      showLoading(false);
      showToast(data.result.status === 'expired' ? 'Time is up. Your saved answers were graded.' : 'Quiz submitted successfully!', data.result.status === 'expired' ? 'warning' : 'success');
      this.renderResult(data.result);
    } catch (err) {
      showLoading(false);
      showToast(err.message || 'Submission failed.', 'error');
    }
  },

  renderResult(result) {
    const app = document.getElementById('app');
    const passed = result.passed === undefined
      ? result.percentage >= Number(this.quiz?.passing_marks || 0)
      : result.passed;
    const expired = result.status === 'expired';
    const circumference = 2 * Math.PI * 62;
    const offset = circumference * (1 - result.percentage / 100);

    app.innerHTML = `
      <div class="results-container">
        <div class="result-summary-card">
          <div class="result-score-circle">
            <svg viewBox="0 0 150 150">
              <circle class="circle-bg" cx="75" cy="75" r="62"/>
              <circle class="circle-fill ${passed ? 'pass' : 'fail'}" cx="75" cy="75" r="62"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"/>
            </svg>
            <div class="result-score-value" style="color:${passed ? 'var(--success)' : 'var(--danger)'}">
              ${result.percentage}%
            </div>
          </div>
          <h2>${expired ? '⏱ Time is up' : passed ? '🎉 Congratulations!' : '📚 Keep Practicing!'}</h2>
          <p style="color:var(--text-muted);font-size:0.95rem;">
            ${expired ? 'Your saved answers were graded when the quiz time ended.' : passed ? 'Great job! You passed the quiz.' : 'Don\'t give up — try again to improve your score.'}
          </p>
          <div class="result-stats">
            <div class="result-stat">
              <div class="stat-value">${result.score}</div>
              <div class="stat-label">Score</div>
            </div>
            <div class="result-stat">
              <div class="stat-value">${result.total_marks}</div>
              <div class="stat-label">Total Marks</div>
            </div>
            <div class="result-stat">
              <div class="stat-value">${result.percentage}%</div>
              <div class="stat-label">Percentage</div>
            </div>
          </div>
          <div style="margin-top:28px;display:flex;gap:14px;justify-content:center;">
            <a href="#/results/${result.attempt_id}" class="btn btn-outline">View Detailed Results</a>
            <a href="#/dashboard" class="btn btn-primary">Back to Dashboard</a>
          </div>
        </div>
      </div>
    `;
  },

  async renderDetailedResult(attemptId) {
    showLoading(true);
    try {
      const data = await api.get(`/quizzes/results/${attemptId}`);
      showLoading(false);

      const { attempt, answers } = data;
      const passed = attempt.passed;
      const circumference = 2 * Math.PI * 62;
      const offset = circumference * (1 - attempt.percentage / 100);

      const app = document.getElementById('app');
      app.innerHTML = `
        <div class="results-container">
          <div class="result-summary-card">
            <div class="result-score-circle">
              <svg viewBox="0 0 150 150">
                <circle class="circle-bg" cx="75" cy="75" r="62"/>
                <circle class="circle-fill ${passed ? 'pass' : 'fail'}" cx="75" cy="75" r="62"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${offset}"/>
              </svg>
              <div class="result-score-value" style="color:${passed ? 'var(--success)' : 'var(--danger)'}">
                ${attempt.percentage}%
              </div>
            </div>
            <h2>${escHtml(attempt.quiz_title)}</h2>
            <p style="color:var(--text-muted);">${attempt.subject} · ${attempt.exam_type}</p>
            <div class="result-stats">
              <div class="result-stat">
                <div class="stat-value">${attempt.score}/${attempt.total_marks}</div>
                <div class="stat-label">Score</div>
              </div>
              <div class="result-stat">
                <div class="stat-value">${passed ? '✅ Passed' : '❌ Failed'}</div>
                <div class="stat-label">Status</div>
              </div>
              <div class="result-stat">
                <div class="stat-value">${attempt.percentage}%</div>
                <div class="stat-label">Percentage</div>
              </div>
            </div>
          </div>

          <!-- Answer Review -->
          <div class="admin-section">
            <div class="admin-section-header">
              <h3>Detailed Answer Review</h3>
              <span style="font-size:0.85rem;color:var(--text-muted);">${answers.length} question(s)</span>
            </div>
            <div style="padding:24px;display:flex;flex-direction:column;gap:16px;">
              ${answers.map((a, i) => `
                <div style="padding:20px;border:2px solid ${a.is_correct ? 'var(--success)' : a.selected_option_id ? 'var(--danger)' : 'var(--border)'}; border-radius:var(--radius-md); background:${a.is_correct ? 'var(--success-bg)' : a.selected_option_id ? 'var(--danger-bg)' : 'var(--bg)'};">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <span style="font-weight:700;font-size:0.95rem;">Q${i + 1}. ${escHtml(a.question_text)}</span>
                    <span class="score-badge ${a.is_correct ? 'pass' : 'fail'}">
                      ${a.is_correct ? '✓ Correct' : a.selected_option_id ? '✗ Wrong' : '— Skipped'}
                    </span>
                  </div>
                  ${a.selected_option_id
                    ? `<div style="font-size:0.9rem;color:var(--text-secondary);">Your answer: <strong>${escHtml(a.selected_label)}. ${escHtml(a.selected_text)}</strong></div>`
                    : '<div style="font-size:0.9rem;color:var(--text-muted);font-style:italic;">Not answered</div>'}
                  ${!a.is_correct
                    ? `<div style="font-size:0.9rem;color:var(--success-dark);margin-top:6px;font-weight:500;">Correct answer: <strong>${escHtml(a.correct_label)}. ${escHtml(a.correct_text)}</strong></div>`
                    : ''}
                  ${a.explanation ? `<div style="font-size:0.88rem;color:var(--text-muted);margin-top:8px;">Explanation: ${escHtml(a.explanation)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <div style="text-align:center;margin-top:28px;display:flex;gap:14px;justify-content:center;">
            <a href="#/history" class="btn btn-outline">← Back to History</a>
            <a href="#/dashboard" class="btn btn-primary">Dashboard</a>
          </div>
        </div>
      `;
    } catch (err) {
      showLoading(false);
      showToast(err.message || 'Failed to load results.', 'error');
      window.location.hash = '#/history';
    }
  },
};
