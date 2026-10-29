// ============================================================
// App Router — SPA routing, Flashcards, Pages & Payment
// Advanced BTech 4th Year Project
// ============================================================

// ── Global Helpers ──────────────────────────────────────────

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4000);
}

function showLoading(show) {
  document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

function showModal(content) {
  document.getElementById('modalContent').innerHTML = content;
  document.getElementById('modalOverlay').classList.remove('hidden');
}

function hideModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) hideModal();
});

/** Escape HTML to prevent XSS */
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Dark Mode ──────────────────────────────────────────────
function initDarkMode() {
  const saved = localStorage.getItem('quiz_dark_mode');
  if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark-mode');
  }
}
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('quiz_dark_mode', document.body.classList.contains('dark-mode'));
}
initDarkMode();

// ── Mobile Menu ────────────────────────────────────────────
function toggleMobileMenu() {
  document.getElementById('navCenter').classList.toggle('mobile-open');
}

// ── Beforeunload Warning During Quiz ───────────────────────
let _quizInProgress = false;
function setQuizInProgress(val) { _quizInProgress = val; }
window.addEventListener('beforeunload', (e) => {
  if (_quizInProgress) { e.preventDefault(); e.returnValue = ''; }
});

// ── Quiz Start Confirmation ────────────────────────────────
function confirmStartQuiz(quizId, title, duration, questionCount, passingMarks) {
  const mins = Math.floor(duration / 60);
  showModal(`
    <div style="text-align:center;padding:10px 0;">
      <div style="font-size:3rem;margin-bottom:12px;">📝</div>
      <h2 style="margin-bottom:8px;">${escHtml(title)}</h2>
      <p style="color:var(--text-muted);margin-bottom:20px;">Are you ready to start this quiz?</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:300px;margin:0 auto 24px;">
        <div style="padding:12px;background:var(--bg);border-radius:var(--radius-md);border:1px solid var(--border);">
          <div style="font-size:1.4rem;font-weight:800;color:var(--primary);">${mins}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);">Minutes</div>
        </div>
        <div style="padding:12px;background:var(--bg);border-radius:var(--radius-md);border:1px solid var(--border);">
          <div style="font-size:1.4rem;font-weight:800;color:var(--accent);">${questionCount}</div>
          <div style="font-size:0.78rem;color:var(--text-muted);">Questions</div>
        </div>
      </div>
      <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:20px;">
        ⚠️ Once started, the timer cannot be paused.${passingMarks ? ` Passing marks: <strong>${passingMarks}</strong>` : ''}
      </div>
      <div style="display:flex;gap:12px;justify-content:center;">
        <button class="btn btn-outline" onclick="hideModal()">Cancel</button>
        <button class="btn btn-primary btn-lg" onclick="hideModal(); quizModule.startQuiz(${quizId});">Start Quiz →</button>
      </div>
    </div>
  `);
}

// ── Navbar ──────────────────────────────────────────────────

// Subscription cache
let _subsCache = null;
let _subsCacheTime = 0;

async function loadSubscriptions(forceRefresh) {
  const now = Date.now();
  if (!forceRefresh && _subsCache && (now - _subsCacheTime < 30000)) return _subsCache;
  try {
    _subsCache = await api.get('/payments/subscriptions');
    _subsCacheTime = now;
    return _subsCache;
  } catch { return { subscriptions: [], current_plan: 'free', is_pro: false }; }
}

function updateNavbar() {
  const navLinks = document.getElementById('navLinks');
  const navRight = document.getElementById('navRight');
  const user = auth.getCurrentUser();
  const hash = window.location.hash || '#/';

  if (!user) {
    navRight.style.display = 'none';
    navLinks.innerHTML = `
      <li><a href="#/login" class="${hash === '#/login' || hash === '#/' ? 'active' : ''}">Login</a></li>
      <li><a href="#/register" class="${hash === '#/register' ? 'active' : ''}">Register</a></li>
    `;
    return;
  }

  navRight.style.display = 'flex';
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('userAvatar').style.cursor = 'pointer';
  document.getElementById('userAvatar').onclick = () => { window.location.hash = '#/profile'; };
  document.getElementById('userName').style.cursor = 'pointer';
  document.getElementById('userName').onclick = () => { window.location.hash = '#/profile'; };

  // Show Pro badge next to name if subscribed
  loadSubscriptions().then(subs => {
    const nameEl = document.getElementById('userName');
    if (!nameEl) return;
    if (subs.is_pro || subs.current_plan === 'enterprise') {
      const badge = subs.current_plan === 'enterprise' ? '💎' : '⭐';
      const label = subs.current_plan === 'enterprise' ? 'Enterprise' : 'Pro';
      nameEl.innerHTML = `${escHtml(user.name)} <span style="display:inline-flex;align-items:center;gap:3px;padding:2px 10px;border-radius:20px;background:linear-gradient(135deg,#6C5CE7,#A29BFE);color:white;font-size:0.65rem;font-weight:700;letter-spacing:0.5px;margin-left:6px;">${badge} ${label}</span>`;
    }
  });

  // Notification bell
  const bell = document.getElementById('notifBell');
  if (bell) {
    bell.style.cursor = 'pointer';
    bell.onclick = () => { window.location.hash = user.role === 'admin' ? '#/admin' : '#/history'; showToast('Check your recent activity!', 'info'); };
  }

  if (user.role === 'admin') {
    navLinks.innerHTML = `
      <li><a href="#/admin" class="${hash === '#/admin' ? 'active' : ''}">Dashboard</a></li>
      <li><a href="#/admin/new-quiz" class="${hash === '#/admin/new-quiz' ? 'active' : ''}">New Quiz</a></li>
      <li><a href="#/admin/flashcards" class="${hash === '#/admin/flashcards' ? 'active' : ''}">Flashcards</a></li>
      <li><a href="#/admin/offers" class="${hash === '#/admin/offers' ? 'active' : ''}">Offers</a></li>
      <li><button class="nav-logout-btn" onclick="auth.logout()">Logout</button></li>
    `;
  } else {
    navLinks.innerHTML = `
      <li><a href="#/dashboard" class="${hash === '#/dashboard' || hash.startsWith('#/quiz') ? 'active' : ''}">Exam</a></li>
      <li><a href="#/flashcard" class="${hash === '#/flashcard' ? 'active' : ''}">Flashcard</a></li>
      <li><a href="#/analytics" class="${hash === '#/analytics' ? 'active' : ''}">Analytics</a></li>
      <li><a href="#/history" class="${hash === '#/history' ? 'active' : ''}">History</a></li>
      <li><a href="#/leaderboard" class="${hash === '#/leaderboard' ? 'active' : ''}">Leaderboard</a></li>
      <li><a href="#/offers" class="${hash === '#/offers' ? 'active' : ''}">Offer</a></li>
      <li><a href="#/packages" class="${hash === '#/packages' ? 'active' : ''}">Package</a></li>
      <li><button class="nav-logout-btn" onclick="auth.logout()">Logout</button></li>
    `;
  }
}

// ── Flashcard Page (FIXED — proper containment) ─────────────

async function renderFlashcard() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-header">
      <h1>Flashcards 🃏</h1>
      <p>Quick revision cards — click to flip and reveal the answer.</p>
    </div>
    <div class="flashcard-grid" id="flashcardGrid">
      <div class="flex-center" style="grid-column:1/-1;padding:60px;">
        <div class="spinner"></div>
      </div>
    </div>
  `;

  try {
    const data = await api.get('/quizzes');
    const quizzes = data.quizzes || [];
    let allCards = [];

    for (const quiz of quizzes.slice(0, 4)) {
      allCards.push(
        { subject: quiz.subject, question: `What is the main topic of "${quiz.title}"?`, answer: `${quiz.subject} — ${quiz.description || quiz.title}` },
      );
    }

    const extraCards = [
      { subject: 'Physics', question: "What is Newton's Second Law of Motion?", answer: 'Force = Mass × Acceleration (F = ma)' },
      { subject: 'Physics', question: 'What is the SI unit of energy?', answer: 'Joule (J)' },
      { subject: 'Mathematics', question: 'What is the quadratic formula?', answer: 'x = (-b ± √(b²-4ac)) / 2a' },
      { subject: 'Chemistry', question: "What is Avogadro's number?", answer: '6.022 × 10²³ particles/mol' },
      { subject: 'Biology', question: 'What is the powerhouse of the cell?', answer: 'Mitochondria' },
      { subject: 'Computer Science', question: 'What does SQL stand for?', answer: 'Structured Query Language' },
      { subject: 'Data Structures', question: 'What is the time complexity of binary search?', answer: 'O(log n)' },
      { subject: 'Networks', question: 'How many layers in the OSI model?', answer: '7 layers' },
    ];

    allCards = [...allCards, ...extraCards];

    const bgColors = [
      'linear-gradient(135deg, #E8F5EE, #C6F0D5)',
      'linear-gradient(135deg, #EDE9FF, #DDD6FF)',
      'linear-gradient(135deg, #FEF3C7, #FDE68A)',
      'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
      'linear-gradient(135deg, #FEE2E2, #FECACA)',
      'linear-gradient(135deg, #E0F2FE, #BAE6FD)',
    ];

    document.getElementById('flashcardGrid').innerHTML = allCards.map((card, i) => `
      <div class="flashcard" onclick="this.classList.toggle('flipped')">
        <div class="flashcard-inner">
          <div class="flashcard-front" style="background:${bgColors[i % bgColors.length]}">
            <div class="flashcard-subject">${card.subject}</div>
            <div class="flashcard-question">${card.question}</div>
            <div class="flashcard-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              Tap to flip
            </div>
          </div>
          <div class="flashcard-back" style="background:${bgColors[(i + 3) % bgColors.length]}">
            <div class="flashcard-subject" style="color:var(--success-dark);">Answer</div>
            <div class="flashcard-answer">${card.answer}</div>
            <div class="flashcard-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              Tap to flip back
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    document.getElementById('flashcardGrid').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <h3>Could not load flashcards</h3>
        <p>${err.message}</p>
      </div>`;
  }
}

// ── Revision Page ───────────────────────────────────────────

async function renderRevision() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-header">
      <h1>Saved for Revision 📖</h1>
      <p>Questions you bookmarked during quizzes for later review.</p>
    </div>
    <div id="revisionContent">
      <div class="flex-center" style="padding:60px;"><div class="spinner"></div></div>
    </div>
  `;

  try {
    const data = await api.get('/quizzes/results/me');
    const results = data.results || [];

    if (results.length === 0) {
      document.getElementById('revisionContent').innerHTML = `
        <div class="admin-section">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="width:64px;height:64px;margin:0 auto 16px;opacity:0.3;display:block;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            <h3>No Bookmarked Questions</h3>
            <p>Bookmark questions during a quiz to save them here. <a href="#/dashboard">Take a quiz →</a></p>
          </div>
        </div>
      `;
      return;
    }

    document.getElementById('revisionContent').innerHTML = `
      <div class="revision-list">
        ${results.map(r => {
          const pct = r.total_marks > 0 ? Math.round((r.score / r.total_marks) * 100) : 0;
          return `
            <div class="revision-item">
              <div class="revision-item-left">
                <div class="revision-item-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div>
                  <strong style="font-size:1rem;">${r.quiz_title}</strong>
                  <div style="font-size:0.82rem;color:var(--text-muted);">${r.subject} · ${r.exam_type} · Score: ${r.score}/${r.total_marks} (${pct}%)</div>
                </div>
              </div>
              <a href="#/results/${r.attempt_id}" class="btn btn-outline btn-sm">Review Answers</a>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (err) {
    document.getElementById('revisionContent').innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`;
  }
}

// ── Leaderboard Page (REAL Global Leaderboard) ──────────────

async function renderLeaderboard() {
  const app = document.getElementById('app');
  const user = auth.getCurrentUser();
  app.innerHTML = `
    <div class="dashboard-header">
      <h1>Leaderboard 🏆</h1>
      <p>See how you rank against other students across all quizzes.</p>
    </div>
    <div class="results-table" id="leaderboardTable">
      <div class="flex-center" style="padding:60px;"><div class="spinner"></div></div>
    </div>
  `;

  try {
    const data = await api.get('/quizzes/leaderboard');
    const lb = data.leaderboard || [];

    if (lb.length === 0) {
      document.getElementById('leaderboardTable').innerHTML = `
        <div class="empty-state">
          <h3>No Data Yet</h3>
          <p>Be the first to take a quiz! <a href="#/dashboard">Browse quizzes →</a></p>
        </div>
      `;
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    document.getElementById('leaderboardTable').innerHTML = `
      <table>
        <thead>
          <tr><th>Rank</th><th>Student</th><th>Avg Score</th><th>Best Score</th><th>Quizzes Taken</th><th>Total Points</th></tr>
        </thead>
        <tbody>
          ${lb.map((r, i) => {
            const isMe = user && r.id === user.id;
            return `
              <tr style="${isMe ? 'background:var(--primary-50);font-weight:600;' : ''}">
                <td style="font-size:1.3rem;text-align:center;">${medals[i] || (i + 1)}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;">${escHtml(r.name?.charAt(0) || '?')}</div>
                    <div>
                      <strong>${escHtml(r.name)}</strong>${isMe ? ' <span style="color:var(--primary);font-size:0.75rem;">(You)</span>' : ''}
                    </div>
                  </div>
                </td>
                <td><span class="score-badge ${r.avg_score >= 50 ? 'pass' : 'fail'}">${r.avg_score}%</span></td>
                <td><span class="score-badge pass">${r.best_score}%</span></td>
                <td style="text-align:center;">${r.total_attempts}</td>
                <td style="font-weight:700;color:var(--primary);">${r.total_score}/${r.total_possible}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    showToast(err.message || 'Failed to load leaderboard.', 'error');
  }
}

// ── Offers Page (with Payment Integration) ──────────────────

const _defaultOffers = [
  { id: 'model_test_bundle', emoji: '🎯', title: 'Model Test Bundle', desc: 'Access 50+ model tests across all subjects with real exam-pattern questions.', price: 499, original: 999, discount: '50% OFF', bg: 'linear-gradient(135deg, #E8F5EE, #D0EDDC)' },
  { id: 'subject_pack', emoji: '📚', title: 'Complete Subject Pack', desc: 'All questions for Physics, Chemistry, Maths & Biology with detailed solutions.', price: 799, original: 1499, discount: '47% OFF', bg: 'linear-gradient(135deg, #DBEAFE, #EFF6FF)' },
  { id: 'pro_membership', emoji: '🏆', title: 'Pro Membership', desc: 'Unlimited access to all quizzes, flashcards, analytics, and priority support for 1 year.', price: 1299, original: 2999, discount: '57% OFF', bg: 'linear-gradient(135deg, #EDE9FF, #F5F3FF)' },
  { id: 'revision_kit', emoji: '⚡', title: 'Quick Revision Kit', desc: 'Curated flashcards + summary notes for last-minute exam preparation.', price: 299, original: 599, discount: '50% OFF', bg: 'linear-gradient(135deg, #FEF3C7, #FFF8E1)' },
  { id: 'competitive_prep', emoji: '🎓', title: 'Competitive Exam Prep', desc: 'Specially designed for JEE, NEET, and other competitive examinations.', price: 1999, original: 3999, discount: '50% OFF', bg: 'linear-gradient(135deg, #FEE2E2, #FFF5F5)' },
  { id: 'group_pack', emoji: '👥', title: 'Group Study Pack', desc: 'Share access with up to 5 friends. Group leaderboards and challenges included.', price: 999, original: 2499, discount: '60% OFF', bg: 'linear-gradient(135deg, #E0F2FE, #F0F9FF)' },
];

// Load offers from localStorage, fall back to defaults
let offersList = (() => {
  try {
    const saved = localStorage.getItem('quiz_offers');
    if (saved) return JSON.parse(saved);
  } catch {}
  return [..._defaultOffers];
})();

function saveOffers() {
  localStorage.setItem('quiz_offers', JSON.stringify(offersList));
}

async function renderOffers() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-header">
      <h1>Special Offers 🎉</h1>
      <p>Grab these limited-time deals and supercharge your exam preparation.</p>
    </div>
    <div class="offer-grid" id="offerGrid">
      <div class="flex-center" style="grid-column:1/-1;padding:60px;"><div class="spinner"></div></div>
    </div>
  `;

  const subs = await loadSubscriptions();
  const owned = new Set((subs.subscriptions || []).map(s => s.product_id));

  document.getElementById('offerGrid').innerHTML = offersList.map(o => {
    const isOwned = owned.has(o.id);
    return `
      <div class="offer-card" style="${isOwned ? 'border:2px solid var(--success);' : ''}">
        <div class="offer-card-banner" style="background:${o.bg};position:relative;">
          ${o.emoji}
          ${isOwned ? '<span style="position:absolute;top:12px;right:12px;background:var(--success);color:white;padding:4px 14px;border-radius:20px;font-size:0.72rem;font-weight:700;">✓ UNLOCKED</span>' : ''}
        </div>
        <div class="offer-card-body">
          ${isOwned ? '' : `<span class="offer-discount">${o.discount}</span>`}
          <h3>${o.title}</h3>
          <p>${o.desc}</p>
          <div class="offer-price">₹${o.price} <span class="original">₹${o.original}</span></div>
          ${isOwned
            ? `<button class="btn btn-outline btn-block" disabled style="color:var(--success);border-color:var(--success);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Already Purchased
              </button>`
            : `<button class="btn btn-primary btn-block" onclick="paymentModule.checkout('${o.id}', '${o.title}', ${o.price})">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Buy Now
              </button>`
          }
        </div>
      </div>
    `;
  }).join('');
}

// ── Packages Page (shows active plan) ───────────────────────

const packagesList = [
  {
    id: 'free', name: 'Free', price: 0, period: '/forever', featured: false,
    features: ['5 quizzes per month', 'Basic flashcards', 'Score tracking', 'Community access'],
    btnText: 'Current Plan', btnClass: 'btn-outline', isFree: true,
  },
  {
    id: 'pro', name: 'Pro', price: 499, period: '/month', featured: true,
    features: ['Unlimited quizzes', 'All flashcard decks', 'Detailed analytics', 'Priority support', 'Revision tools', 'Ad-free experience'],
    btnText: 'Upgrade to Pro', btnClass: 'btn-primary', isFree: false,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 1999, period: '/month', featured: false,
    features: ['Everything in Pro', 'Custom quiz creation', 'Team management', 'API access', 'Dedicated support', 'White-label option'],
    btnText: 'Contact Sales', btnClass: 'btn-accent', isFree: false,
  },
];

async function renderPackages() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-header" style="text-align:center;margin-bottom:40px;">
      <h1>Choose Your Plan 💎</h1>
      <p>Select the perfect plan to accelerate your learning journey.</p>
    </div>
    <div class="package-grid" style="max-width:1060px;margin:0 auto;" id="packageGrid">
      <div class="flex-center" style="grid-column:1/-1;padding:60px;"><div class="spinner"></div></div>
    </div>
  `;

  const subs = await loadSubscriptions();
  const currentPlan = subs.current_plan || 'free';
  const owned = new Set((subs.subscriptions || []).map(s => s.product_id));

  document.getElementById('packageGrid').innerHTML = packagesList.map(p => {
    const planProductId = p.id + '_plan';
    const isActive = (p.id === 'free' && currentPlan === 'free')
      || (p.id === 'pro' && (currentPlan === 'pro' || currentPlan === 'enterprise'))
      || (p.id === 'enterprise' && currentPlan === 'enterprise')
      || owned.has(planProductId);
    const isCurrentPlan = p.id === currentPlan;

    let btnHTML;
    if (isActive || isCurrentPlan) {
      btnHTML = `<button class="btn btn-block" disabled style="background:var(--success);color:white;opacity:0.9;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        ${p.id === 'free' ? 'Current Plan' : '✓ Active'}
      </button>`;
    } else {
      btnHTML = `<button class="btn ${p.btnClass} btn-block" onclick="paymentModule.checkout('${planProductId}', '${p.name} Plan — Monthly', ${p.price})">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        ${p.btnText}
      </button>`;
    }

    return `
      <div class="package-card ${p.featured ? 'featured' : ''} ${isActive && p.id !== 'free' ? 'featured' : ''}" style="${isActive && p.id !== 'free' ? 'border-color:var(--success);' : ''}">
        ${isActive && p.id !== 'free' ? `<span style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--success);color:white;font-size:0.7rem;font-weight:700;padding:4px 16px;border-radius:20px;letter-spacing:1px;">✓ ACTIVE</span>` : (p.featured && !isActive ? '' : '')}
        <h3>${p.name}</h3>
        <div class="package-price">₹${p.price}<span>${p.period}</span></div>
        <ul class="package-features">
          ${p.features.map(f => `
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              ${f}
            </li>
          `).join('')}
        </ul>
        ${btnHTML}
      </div>
    `;
  }).join('');
}

// ══════════════════════════════════════════════════════════════
// PAYMENT MODULE — Razorpay Integration
// ══════════════════════════════════════════════════════════════

const paymentModule = {
  /**
   * Open Razorpay checkout for a given product.
   * Creates an order via backend, then opens the payment modal.
   */
  async checkout(productId, productName, amount) {
    const user = auth.getCurrentUser();
    if (!user) {
      showToast('Please login to make a purchase.', 'warning');
      window.location.hash = '#/login';
      return;
    }

    showLoading(true);
    try {
      // Step 1: Create order via backend API
      const orderData = await api.post('/payments/create-order', {
        product_id: productId,
        product_name: productName,
        amount: amount,
      });

      showLoading(false);

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'QuizMaster',
        description: productName,
        order_id: orderData.order_id,
        image: '',
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#1B8C5A',
        },
        handler: async function (response) {
          // Step 3: Verify payment on backend
          showLoading(true);
          try {
            const result = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            showLoading(false);
            paymentModule.showSuccessReceipt(result.payment, productName);
          } catch (err) {
            showLoading(false);
            showToast('Payment verification failed. Contact support.', 'error');
          }
        },
        modal: {
          ondismiss: function () {
            showToast('Payment cancelled.', 'warning');
          },
        },
      };

      // Check if Razorpay SDK is loaded
      if (typeof Razorpay !== 'undefined') {
        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        // Fallback: show demo payment modal if Razorpay SDK not loaded
        paymentModule.showDemoPayment(productId, productName, amount, orderData);
      }
    } catch (err) {
      showLoading(false);
      showToast(err.message || 'Could not start checkout. Please try again.', 'error');
    }
  },

  /** Demo payment modal (works without Razorpay API keys) */
  showDemoPayment(productId, productName, amount, orderData) {
    showModal(`
      <div class="modal-header">
        <h3>Demo Checkout</h3>
        <button class="modal-close" onclick="hideModal()">✕</button>
      </div>

      <div style="background:var(--bg);border-radius:var(--radius-md);padding:20px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-weight:600;">${productName}</span>
          <span style="font-size:1.3rem;font-weight:800;color:var(--primary);font-family:'Outfit',sans-serif;">₹${amount}</span>
        </div>
        <div style="font-size:0.82rem;color:var(--text-muted);">Order ID: QM-${Date.now().toString(36).toUpperCase()}</div>
      </div>

      <div role="note" style="padding:12px 14px;border-radius:var(--radius-sm);background:var(--warning-bg);color:var(--text-secondary);font-size:0.82rem;margin-bottom:16px;">
        Demo checkout only. No real card is charged or sent to a payment processor. Use 4242 4242 4242 4242, expiry 12/30, CVV 123, and any name.
      </div>

      <form id="demoPaymentForm" onsubmit="event.preventDefault(); paymentModule.processDemoPayment('${productId}', '${productName}', ${amount});">
        <div class="form-group">
          <label>Test Card Number</label>
          <input type="text" id="payCardNumber" placeholder="4242 4242 4242 4242" maxlength="19"
            oninput="this.value = this.value.replace(/[^0-9]/g,'').replace(/(.{4})/g,'$1 ').trim()" required>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
          <div class="form-group">
            <label>Test Expiry Date</label>
            <input type="text" id="payExpiry" placeholder="MM/YY" maxlength="5"
              oninput="let v=this.value.replace(/[^0-9]/g,''); if(v.length>=2) v=v.slice(0,2)+'/'+v.slice(2); this.value=v;" required>
          </div>
          <div class="form-group">
            <label>Test CVV</label>
            <input type="password" id="payCVV" placeholder="•••" maxlength="3" required>
          </div>
        </div>
        <div class="form-group">
          <label>Test Name</label>
          <input type="text" id="payName" placeholder="John Doe" required>
        </div>

        <div style="display:flex;gap:8px;margin:18px 0 8px;align-items:center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style="font-size:0.78rem;color:var(--text-muted);">Demo checkout; no payment processor is contacted.</span>
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top:6px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          Pay ₹${amount}
        </button>
      </form>

      <p style="text-align:center;margin-top:14px;font-size:0.75rem;color:var(--text-muted);">Test values only. This demo does not contact Visa, Mastercard, Amex, UPI, or a bank.</p>
    `);
  },

  /** Process demo payment (simulates server verification) */
  async processDemoPayment(productId, productName, amount) {
    const cardNum = document.getElementById('payCardNumber').value.replace(/\s/g, '');
    const expiry = document.getElementById('payExpiry').value;
    const cvv = document.getElementById('payCVV').value;
    const name = document.getElementById('payName').value;

    // Basic validation
    if (cardNum.length < 13) { showToast('Please enter a valid card number.', 'error'); return; }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) { showToast('Please enter a valid expiry (MM/YY).', 'error'); return; }
    if (cvv.length < 3) { showToast('Please enter a valid CVV.', 'error'); return; }
    if (name.length < 2) { showToast('Please enter the card holder name.', 'error'); return; }

    hideModal();
    showLoading(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Save payment record to backend
    try {
      const result = await api.post('/payments/record', {
        product_id: productId,
        product_name: productName,
        amount: amount,
        payment_method: 'card',
        card_last_four: cardNum.slice(-4),
        card_holder_name: name,
      });

      showLoading(false);
      // Invalidate subscription cache so UI updates immediately
      _subsCache = null;
      _subsCacheTime = 0;
      this.showSuccessReceipt(result.payment, productName);
    } catch (err) {
      showLoading(false);
      showToast(err.message || 'Could not record the demo purchase. Please try again.', 'error');
    }
  },

  /** Show success receipt after payment */
  showSuccessReceipt(payment, productName) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="results-container" style="animation:fadeSlideUp 0.4s ease;">
        <div class="result-summary-card" style="max-width:600px;margin:0 auto;">
          <div style="margin-bottom:24px;">
            <div style="width:80px;height:80px;border-radius:50%;background:var(--success-bg);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h2 style="color:var(--success);font-size:1.5rem;">${payment.demo ? 'Demo Purchase Complete' : 'Payment Successful!'}</h2>
            <p style="color:var(--text-muted);margin-top:6px;">${payment.demo ? 'No real payment was taken. Your demo subscription is active.' : 'Thank you for your purchase.'}</p>
          </div>

          <div style="background:var(--bg);border-radius:var(--radius-md);padding:24px;text-align:left;margin:0 auto;max-width:400px;">
            <h4 style="font-family:'Outfit',sans-serif;font-size:0.85rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">Receipt Details</h4>

            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);">
              <span style="color:var(--text-muted);font-size:0.88rem;">Product</span>
              <strong style="font-size:0.88rem;">${payment.product_name || productName}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);">
              <span style="color:var(--text-muted);font-size:0.88rem;">Amount</span>
              <strong style="font-size:0.88rem;color:var(--primary);">₹${payment.amount}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);">
              <span style="color:var(--text-muted);font-size:0.88rem;">Payment ID</span>
              <span style="font-size:0.82rem;font-family:monospace;">${payment.payment_id || payment.id}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);">
              <span style="color:var(--text-muted);font-size:0.88rem;">Card</span>
              <span style="font-size:0.88rem;">•••• ${payment.card_last_four || '****'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;">
              <span style="color:var(--text-muted);font-size:0.88rem;">Date</span>
              <span style="font-size:0.88rem;">${new Date(payment.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          <div style="margin-top:28px;display:flex;gap:12px;justify-content:center;">
            <a href="#/payments" class="btn btn-outline">View All Payments</a>
            <a href="#/dashboard" class="btn btn-primary">Back to Dashboard</a>
          </div>
        </div>
      </div>
    `;
  },
};

// ── Payment History Page ────────────────────────────────────

async function renderPaymentHistory() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-header">
      <h1>Payment History 💳</h1>
      <p>View all your transactions and payment receipts.</p>
    </div>
    <div class="results-table" id="paymentTable">
      <div class="flex-center" style="padding:60px;"><div class="spinner"></div></div>
    </div>
  `;

  try {
    const data = await api.get('/payments/history');
    const payments = data.payments || [];

    if (payments.length === 0) {
      document.getElementById('paymentTable').innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="width:64px;height:64px;margin:0 auto 16px;opacity:0.3;display:block;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          <h3>No Payments Yet</h3>
          <p>You haven't made any purchases. <a href="#/offers">Browse special offers →</a></p>
        </div>
      `;
      return;
    }

    document.getElementById('paymentTable').innerHTML = `
      <table>
        <thead>
          <tr><th>Transaction ID</th><th>Product</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th></tr>
        </thead>
        <tbody>
          ${payments.map(p => `
            <tr>
              <td style="font-family:monospace;font-size:0.82rem;">${p.payment_id}</td>
              <td><strong>${p.product_name}</strong></td>
              <td style="font-weight:700;color:var(--primary);">₹${p.amount}</td>
              <td>
                <span style="display:flex;align-items:center;gap:6px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  •••• ${p.card_last_four || '****'}
                </span>
              </td>
              <td><span class="score-badge pass">✓ ${p.status}</span></td>
              <td style="color:var(--text-muted);font-size:0.85rem;">${new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    document.getElementById('paymentTable').innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="width:64px;height:64px;margin:0 auto 16px;opacity:0.3;display:block;"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        <h3>No Payments Yet</h3>
        <p>You haven't made any purchases. <a href="#/offers">Browse special offers →</a></p>
      </div>
    `;
  }
}

// ── Router ──────────────────────────────────────────────────

function router() {
  quizModule.cleanup();
  setQuizInProgress(false);

  const hash = window.location.hash || '#/';
  const user = auth.getCurrentUser();

  updateNavbar();

  // Public routes
  if (hash === '#/login' || hash === '#/') {
    if (user) { window.location.hash = user.role === 'admin' ? '#/admin' : '#/dashboard'; return; }
    auth.renderLogin();
    return;
  }
  if (hash === '#/register') {
    if (user) { window.location.hash = user.role === 'admin' ? '#/admin' : '#/dashboard'; return; }
    auth.renderRegister();
    return;
  }

  // Protected — require login
  if (!user) { window.location.hash = '#/login'; return; }

  // Student & shared routes
  if (hash === '#/dashboard')   { dashboard.render(); return; }
  if (hash === '#/history')     { dashboard.renderHistory(); return; }
  if (hash === '#/flashcard')   { renderFlashcard(); return; }
  if (hash === '#/revision')    { renderRevision(); return; }
  if (hash === '#/leaderboard') { renderLeaderboard(); return; }
  if (hash === '#/analytics')   { renderAnalytics(); return; }
  if (hash === '#/offers')      { renderOffers(); return; }
  if (hash === '#/packages')    { renderPackages(); return; }
  if (hash === '#/payments')    { renderPaymentHistory(); return; }
  if (hash === '#/profile')     { renderProfile(); return; }

  if (hash.startsWith('#/quiz/')) {
    const quizId = parseInt(hash.split('/')[2]);
    if (quizId) quizModule.startQuiz(quizId);
    return;
  }
  if (hash.startsWith('#/results/')) {
    const attemptId = parseInt(hash.split('/')[2]);
    if (attemptId) quizModule.renderDetailedResult(attemptId);
    return;
  }

  // Admin routes
  if (user.role === 'admin') {
    if (hash === '#/admin')             { adminModule.render(); return; }
    if (hash === '#/admin/new-quiz')    { renderAdminNewQuiz(); return; }
    if (hash === '#/admin/flashcards')  { renderAdminFlashcards(); return; }
    if (hash === '#/admin/offers')      { renderAdminOffers(); return; }
    if (hash === '#/profile')           { renderProfile(); return; }
  }

  // 404 Fallback
  render404();
}

// ══════════════════════════════════════════════════════════════
// ADMIN — NEW QUIZ PAGE
// ══════════════════════════════════════════════════════════════

async function renderAdminNewQuiz() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-header">
      <h1>Create New Quiz ✏️</h1>
      <p>Fill in the quiz details and add questions with options.</p>
    </div>
    <div class="admin-section">
      <div class="admin-section-header"><h3>Quiz Details</h3></div>
      <div style="padding:24px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="form-group">
            <label>Quiz Title *</label>
            <input type="text" id="nqTitle" placeholder="e.g. Data Structures Final Exam">
          </div>
          <div class="form-group">
            <label>Subject *</label>
            <input type="text" id="nqSubject" placeholder="e.g. Computer Science">
          </div>
          <div class="form-group">
            <label>Exam Type</label>
            <select id="nqExamType">
              <option value="practice">Practice</option>
              <option value="midterm">Midterm</option>
              <option value="final">Final Exam</option>
              <option value="mock">Mock Test</option>
            </select>
          </div>
          <div class="form-group">
            <label>Duration (minutes) *</label>
            <input type="number" id="nqDuration" value="30" min="5" max="180">
          </div>
          <div class="form-group">
            <label>Passing Marks *</label>
            <input type="number" id="nqPassing" value="1" min="0" max="100">
          </div>
          <div class="form-group">
            <label>Status</label>
            <select id="nqStatus">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top:12px;">
          <label>Description</label>
          <textarea id="nqDesc" rows="3" placeholder="Brief quiz description..."></textarea>
        </div>
      </div>
    </div>

    <div class="admin-section" style="margin-top:24px;">
      <div class="admin-section-header">
        <h3>Questions</h3>
        <button class="btn btn-outline btn-sm" onclick="addQuestionBlock()">+ Add Question</button>
      </div>
      <div id="questionsContainer" style="padding:24px;">
        <div class="empty-state" id="noQuestionsMsg">
          <p>No questions added yet. Click "Add Question" to start.</p>
        </div>
      </div>
    </div>

    <div style="margin-top:24px;display:flex;gap:14px;justify-content:flex-end;">
      <a href="#/admin" class="btn btn-outline">Cancel</a>
      <button class="btn btn-primary" onclick="submitNewQuiz()" id="submitQuizBtn">Create Quiz</button>
    </div>
    <div id="nqError" style="margin-top:12px;"></div>
  `;
}

let _questionCount = 0;

function addQuestionBlock() {
  const container = document.getElementById('questionsContainer');
  const noMsg = document.getElementById('noQuestionsMsg');
  if (noMsg) noMsg.style.display = 'none';

  _questionCount++;
  const qNum = _questionCount;

  const block = document.createElement('div');
  block.className = 'question-block';
  block.id = `qBlock_${qNum}`;
  block.style.cssText = 'border:1.5px solid var(--border);border-radius:var(--radius-md);padding:20px;margin-bottom:16px;background:var(--bg-card);';
  block.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <strong style="font-size:0.95rem;">Question ${qNum}</strong>
      <button class="btn btn-outline btn-sm" style="color:var(--danger);border-color:var(--danger);" onclick="document.getElementById('qBlock_${qNum}').remove()">Remove</button>
    </div>
    <div class="form-group">
      <label>Question Text *</label>
      <textarea class="q-text" rows="2" placeholder="Enter the question..."></textarea>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div class="form-group">
        <label>Difficulty</label>
        <select class="q-difficulty"><option value="easy">Easy</option><option value="medium" selected>Medium</option><option value="hard">Hard</option></select>
      </div>
      <div class="form-group">
        <label>Marks</label>
        <input type="number" class="q-marks" value="1" min="1" max="10">
      </div>
    </div>
    <div class="form-group">
      <label>Explanation (shown after quiz)</label>
      <textarea class="q-explanation" rows="2" placeholder="Why is the correct answer correct? (optional)"></textarea>
    </div>
    <div style="margin-top:12px;">
      <label style="font-weight:600;font-size:0.88rem;margin-bottom:8px;display:block;">Options (mark the correct one)</label>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${['A', 'B', 'C', 'D'].map(label => `
          <div style="display:flex;align-items:center;gap:10px;">
            <input type="radio" name="correct_${qNum}" value="${label}" ${label === 'A' ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--primary);">
            <span style="font-weight:700;min-width:20px;">${label}.</span>
            <input type="text" class="opt-${label}" placeholder="Option ${label}" style="flex:1;">
          </div>
        `).join('')}
      </div>
    </div>
  `;
  container.appendChild(block);
}

async function submitNewQuiz() {
  const title = document.getElementById('nqTitle').value.trim();
  const subject = document.getElementById('nqSubject').value.trim();
  const examType = document.getElementById('nqExamType').value;
  const duration = parseInt(document.getElementById('nqDuration').value);
  const passingMarks = parseInt(document.getElementById('nqPassing').value);
  const status = document.getElementById('nqStatus').value;
  const description = document.getElementById('nqDesc').value.trim();
  const errEl = document.getElementById('nqError');

  if (!title || !subject || !Number.isSafeInteger(duration) || duration < 1 || !Number.isSafeInteger(passingMarks) || passingMarks < 0) {
    errEl.textContent = 'Please fill in all required fields with valid values.';
    return;
  }

  // Collect questions
  const blocks = document.querySelectorAll('.question-block');
  if (blocks.length === 0) {
    errEl.textContent = 'Add at least one question.';
    return;
  }

  const questions = [];
  for (const block of blocks) {
    const text = block.querySelector('.q-text').value.trim();
    const difficulty = block.querySelector('.q-difficulty').value;
    const marks = parseInt(block.querySelector('.q-marks').value);
    const explanation = block.querySelector('.q-explanation').value.trim();
    const correctLabel = block.querySelector('input[type=radio]:checked')?.value;
    const options = ['A', 'B', 'C', 'D'].map(label => ({
      label,
      text: block.querySelector(`.opt-${label}`).value.trim(),
      is_correct: label === correctLabel,
    })).filter(option => option.text);

    if (!text) {
      errEl.textContent = 'Every question needs question text.';
      return;
    }
    if (!Number.isSafeInteger(marks) || marks < 1 || marks > 100) {
      errEl.textContent = 'Question marks must be a whole number between 1 and 100.';
      return;
    }
    if (options.length < 2) {
      errEl.textContent = 'Each question needs at least two non-empty options.';
      return;
    }
    if (!options.some(option => option.is_correct)) {
      errEl.textContent = 'Choose the correct option for every question.';
      return;
    }
    questions.push({ text, difficulty, marks, explanation, options });
  }

  const totalMarks = questions.reduce((sum, question) => sum + question.marks, 0);
  if (passingMarks > totalMarks) {
    errEl.textContent = `Passing marks cannot exceed the quiz total (${totalMarks}).`;
    return;
  }

  const btn = document.getElementById('submitQuizBtn');
  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    // Create the quiz as a draft and publish it only after every question is saved.
    const quizData = await api.post('/admin/quizzes', {
      title, subject, exam_type: examType,
      duration: duration * 60, passing_marks: passingMarks, total_marks: totalMarks,
      description, status: 'draft',
    });
    const quizId = quizData.quiz?.id || quizData.id;

    for (const question of questions) {
      await api.post(`/admin/quizzes/${quizId}/questions`, question);
    }

    if (status !== 'draft') await api.put(`/admin/quizzes/${quizId}`, { status });

    showToast('Quiz created successfully! 🎉', 'success');
    window.location.hash = '#/admin';
  } catch (err) {
    errEl.textContent = err.message || 'Quiz could not be saved.';
    btn.disabled = false;
    btn.textContent = 'Create Quiz';
  }
}

// ══════════════════════════════════════════════════════════════
// ADMIN — FLASHCARDS MANAGEMENT
// ══════════════════════════════════════════════════════════════

async function renderAdminFlashcards() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-header">
      <h1>Flashcard Manager 🃏</h1>
      <p>Manage flashcard sets generated from quiz questions. Students use these for revision.</p>
    </div>
    <div id="flashcardAdmin">
      <div class="flex-center" style="padding:60px;"><div class="spinner"></div></div>
    </div>
  `;

  try {
    const data = await api.get('/admin/quizzes');
    const quizzes = data.quizzes || [];

    if (quizzes.length === 0) {
      document.getElementById('flashcardAdmin').innerHTML = `
        <div class="empty-state">
          <h3>No Quizzes</h3>
          <p>Create a quiz first, then flashcards will be auto-generated from its questions.</p>
          <a href="#/admin/new-quiz" class="btn btn-primary" style="margin-top:16px;">Create Quiz</a>
        </div>
      `;
      return;
    }

    document.getElementById('flashcardAdmin').innerHTML = `
      <div class="admin-section">
        <div class="admin-section-header">
          <h3>Flashcard Sets (from Quizzes)</h3>
          <span style="font-size:0.85rem;color:var(--text-muted);">${quizzes.length} quiz${quizzes.length !== 1 ? 'zes' : ''}</span>
        </div>
        <div style="padding:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
          ${quizzes.map(q => `
            <div style="border:1.5px solid var(--border);border-radius:var(--radius-md);padding:20px;background:var(--bg-card);transition:all 0.2s;" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                <div>
                  <h4 style="font-size:1rem;margin-bottom:4px;">${escHtml(q.title)}</h4>
                  <span style="font-size:0.8rem;color:var(--text-muted);">${escHtml(q.subject)} · ${q.question_count || 0} cards</span>
                </div>
                <span style="padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:600;background:${q.status === 'published' ? 'var(--success-bg)' : 'var(--warning-bg)'};color:${q.status === 'published' ? 'var(--success)' : 'var(--warning)'};">${q.status}</span>
              </div>
              <div style="display:flex;gap:8px;margin-top:14px;">
                <button class="btn btn-outline btn-sm" onclick="previewFlashcards(${q.id}, '${escHtml(q.title)}')">👁 Preview</button>
                <button class="btn btn-primary btn-sm" onclick="adminModule.manageQuestions(${q.id})" style="font-size:0.78rem;">📝 Manage Quiz</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="admin-section" style="margin-top:24px;">
        <div class="admin-section-header">
          <h3>Create Custom Flashcard</h3>
        </div>
        <div style="padding:24px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div class="form-group">
              <label>Front (Question)</label>
              <textarea id="fcFront" rows="2" placeholder="What is the question?"></textarea>
            </div>
            <div class="form-group">
              <label>Back (Answer)</label>
              <textarea id="fcBack" rows="2" placeholder="What is the answer?"></textarea>
            </div>
          </div>
          <button class="btn btn-primary" onclick="showToast('Custom flashcard saved! (Demo mode)', 'success')" style="margin-top:12px;">Add Flashcard</button>
        </div>
      </div>
    `;
  } catch (err) {
    document.getElementById('flashcardAdmin').innerHTML = `
      <div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>
    `;
  }
}

async function previewFlashcards(quizId, quizTitle) {
  try {
    const data = await api.get(`/admin/quizzes/${quizId}/questions`);
    const questions = data.questions || [];

    if (questions.length === 0) {
      showToast('No questions in this quiz yet.', 'warning');
      return;
    }

    showModal(`
      <h3 style="margin-bottom:16px;">🃏 Flashcards — ${escHtml(quizTitle)}</h3>
      <div style="max-height:400px;overflow-y:auto;">
        ${questions.map((q, i) => `
          <div style="border:1.5px solid var(--border);border-radius:var(--radius-md);padding:16px;margin-bottom:10px;background:var(--bg);">
            <div style="font-weight:700;margin-bottom:6px;">Q${i + 1}. ${escHtml(q.text)}</div>
            <div style="color:var(--success);font-size:0.9rem;">
              ✓ ${escHtml(q.options?.find(o => o.is_correct)?.text || 'N/A')}
            </div>
            ${q.explanation ? `<div style="color:var(--text-muted);font-size:0.82rem;margin-top:4px;font-style:italic;">💡 ${escHtml(q.explanation)}</div>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="modal-actions" style="margin-top:16px;">
        <button class="btn btn-primary" onclick="hideModal()">Close</button>
      </div>
    `);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
// ══════════════════════════════════════════════════════════════
// ADMIN — OFFERS MANAGEMENT
// ══════════════════════════════════════════════════════════════

function renderAdminOffers() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-header">
      <h1>Manage Special Offers 🎯</h1>
      <p>Create, edit, and manage promotional offers for students.</p>
    </div>

    <!-- Existing Offers -->
    <div class="admin-section">
      <div class="admin-section-header">
        <h3>Current Offers (${offersList.length})</h3>
        <button class="btn btn-primary btn-sm" onclick="showAddOfferForm()">+ New Offer</button>
      </div>
      <div style="padding:24px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;" id="adminOffersGrid">
          ${offersList.map((o, i) => `
            <div class="offer-card" style="border:1.5px solid var(--border);border-radius:var(--radius-lg);padding:24px;background:var(--bg-card);position:relative;">
              <div style="position:absolute;top:12px;right:12px;display:flex;gap:6px;">
                <button class="btn btn-outline btn-sm" onclick="editOffer(${i})" style="font-size:0.72rem;padding:4px 10px;">✏️ Edit</button>
                <button class="btn btn-outline btn-sm" onclick="deleteOffer(${i})" style="font-size:0.72rem;padding:4px 10px;color:var(--danger);border-color:var(--danger);">🗑</button>
              </div>
              <div style="font-size:2rem;margin-bottom:10px;">${o.emoji}</div>
              <h4 style="font-size:1.05rem;margin-bottom:6px;">${escHtml(o.title)}</h4>
              <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:12px;">${escHtml(o.desc)}</p>
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:1.3rem;font-weight:800;color:var(--primary);">₹${o.price}</span>
                <span style="font-size:0.85rem;color:var(--text-muted);text-decoration:line-through;">₹${o.original}</span>
                <span style="padding:3px 10px;border-radius:12px;font-size:0.72rem;font-weight:700;background:var(--danger-bg);color:var(--danger);">${o.discount}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Add/Edit Offer Form (hidden by default) -->
    <div class="admin-section" style="margin-top:24px;display:none;" id="offerFormSection">
      <div class="admin-section-header">
        <h3 id="offerFormTitle">Add New Offer</h3>
      </div>
      <div style="padding:24px;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
          <div class="form-group">
            <label>Emoji</label>
            <input type="text" id="ofEmoji" placeholder="🎯" maxlength="4">
          </div>
          <div class="form-group" style="grid-column:span 2;">
            <label>Title *</label>
            <input type="text" id="ofTitle" placeholder="Model Test Bundle">
          </div>
          <div class="form-group" style="grid-column:span 3;">
            <label>Description</label>
            <textarea id="ofDesc" rows="2" placeholder="Offer description..."></textarea>
          </div>
          <div class="form-group">
            <label>Price (₹) *</label>
            <input type="number" id="ofPrice" placeholder="499" min="0">
          </div>
          <div class="form-group">
            <label>Original Price (₹)</label>
            <input type="number" id="ofOriginal" placeholder="999" min="0">
          </div>
          <div class="form-group">
            <label>Discount Label</label>
            <input type="text" id="ofDiscount" placeholder="50% OFF">
          </div>
        </div>
        <input type="hidden" id="ofEditIndex" value="-1">
        <div style="display:flex;gap:12px;margin-top:16px;">
          <button class="btn btn-primary" onclick="saveOffer()">Save Offer</button>
          <button class="btn btn-outline" onclick="document.getElementById('offerFormSection').style.display='none'">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

function showAddOfferForm() {
  document.getElementById('offerFormSection').style.display = 'block';
  document.getElementById('offerFormTitle').textContent = 'Add New Offer';
  document.getElementById('ofEmoji').value = '🎁';
  document.getElementById('ofTitle').value = '';
  document.getElementById('ofDesc').value = '';
  document.getElementById('ofPrice').value = '';
  document.getElementById('ofOriginal').value = '';
  document.getElementById('ofDiscount').value = '';
  document.getElementById('ofEditIndex').value = '-1';
  document.getElementById('offerFormSection').scrollIntoView({ behavior: 'smooth' });
}

function editOffer(index) {
  const o = offersList[index];
  document.getElementById('offerFormSection').style.display = 'block';
  document.getElementById('offerFormTitle').textContent = 'Edit Offer — ' + o.title;
  document.getElementById('ofEmoji').value = o.emoji;
  document.getElementById('ofTitle').value = o.title;
  document.getElementById('ofDesc').value = o.desc;
  document.getElementById('ofPrice').value = o.price;
  document.getElementById('ofOriginal').value = o.original;
  document.getElementById('ofDiscount').value = o.discount;
  document.getElementById('ofEditIndex').value = index;
  document.getElementById('offerFormSection').scrollIntoView({ behavior: 'smooth' });
}

function saveOffer() {
  const title = document.getElementById('ofTitle').value.trim();
  const price = parseInt(document.getElementById('ofPrice').value);
  if (!title || !price) { showToast('Title and price are required.', 'error'); return; }

  const offer = {
    id: title.toLowerCase().replace(/\s+/g, '_'),
    emoji: document.getElementById('ofEmoji').value || '🎁',
    title,
    desc: document.getElementById('ofDesc').value.trim(),
    price,
    original: parseInt(document.getElementById('ofOriginal').value) || price,
    discount: document.getElementById('ofDiscount').value || 'SPECIAL',
    bg: 'linear-gradient(135deg, #E8F5EE, #D0EDDC)',
  };

  const editIndex = parseInt(document.getElementById('ofEditIndex').value);
  if (editIndex >= 0) {
    offersList[editIndex] = { ...offersList[editIndex], ...offer };
    showToast('Offer updated! ✅', 'success');
  } else {
    offersList.push(offer);
    showToast('New offer created! 🎉', 'success');
  }
  saveOffers();
  renderAdminOffers();
}

function deleteOffer(index) {
  if (confirm('Delete this offer?')) {
    offersList.splice(index, 1);
    saveOffers();
    showToast('Offer deleted.', 'info');
    renderAdminOffers();
  }
}

// ══════════════════════════════════════════════════════════════
// ANALYTICS PAGE — Charts & Performance Insights
// ══════════════════════════════════════════════════════════════

async function renderAnalytics() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="dashboard-header">
      <h1>Performance Analytics 📊</h1>
      <p>Track your progress with detailed charts and insights.</p>
    </div>
    <div id="analyticsContent">
      <div class="flex-center" style="padding:60px;"><div class="spinner"></div></div>
    </div>
  `;

  try {
    const data = await api.get('/quizzes/results/me');
    const results = data.results || [];

    if (results.length === 0) {
      document.getElementById('analyticsContent').innerHTML = `
        <div class="empty-state">
          <h3>No Analytics Data</h3>
          <p>Take some quizzes first to see your performance insights! <a href="#/dashboard">Browse quizzes →</a></p>
        </div>
      `;
      return;
    }

    // Compute analytics
    const totalAttempts = results.length;
    const passed = results.filter(r => r.score >= r.passing_marks).length;
    const failed = totalAttempts - passed;
    const avgScore = Math.round(results.reduce((s, r) => s + (r.total_marks > 0 ? (r.score / r.total_marks) * 100 : 0), 0) / totalAttempts);
    const bestScore = Math.max(...results.map(r => r.total_marks > 0 ? Math.round((r.score / r.total_marks) * 100) : 0));

    // Subject-wise performance
    const subjectMap = {};
    results.forEach(r => {
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { total: 0, count: 0 };
      subjectMap[r.subject].total += r.total_marks > 0 ? (r.score / r.total_marks) * 100 : 0;
      subjectMap[r.subject].count++;
    });
    const subjects = Object.entries(subjectMap).map(([name, d]) => ({
      name,
      avg: Math.round(d.total / d.count),
      count: d.count,
    })).sort((a, b) => b.avg - a.avg);

    // Score trend (last 10 attempts)
    const trend = results.slice(0, 10).reverse().map(r => ({
      label: r.quiz_title.substring(0, 12),
      pct: r.total_marks > 0 ? Math.round((r.score / r.total_marks) * 100) : 0,
    }));

    // Bar colors
    const barColors = ['#6C5CE7', '#00B894', '#E17055', '#0984E3', '#FDCB6E', '#E84393', '#00CEC9', '#636E72'];

    // Donut chart SVG
    const donutTotal = passed + failed;
    const passAngle = (passed / donutTotal) * 360;
    const passRad1 = -90;
    const passRad2 = passRad1 + passAngle;
    function polarToCartesian(cx, cy, r, angleDeg) {
      const rad = (angleDeg * Math.PI) / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }
    function describeArc(cx, cy, r, startAngle, endAngle) {
      const start = polarToCartesian(cx, cy, r, endAngle);
      const end = polarToCartesian(cx, cy, r, startAngle);
      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
      return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
    }

    document.getElementById('analyticsContent').innerHTML = `
      <!-- Summary Stats -->
      <div class="stats-banner" style="margin-bottom:28px;">
        <div class="mini-stat">
          <div class="mini-stat-icon green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <div class="mini-stat-info"><div class="stat-num">${totalAttempts}</div><div class="stat-lbl">Total Attempts</div></div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-icon purple"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
          <div class="mini-stat-info"><div class="stat-num">${avgScore}%</div><div class="stat-lbl">Average Score</div></div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-icon orange"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
          <div class="mini-stat-info"><div class="stat-num">${bestScore}%</div><div class="stat-lbl">Best Score</div></div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-icon blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          <div class="mini-stat-info"><div class="stat-num">${passed}/${totalAttempts}</div><div class="stat-lbl">Pass Rate</div></div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;">
        <!-- Subject Performance Bar Chart -->
        <div class="admin-section">
          <div class="admin-section-header"><h3>📚 Subject-wise Performance</h3></div>
          <div style="padding:24px;">
            ${subjects.map((s, i) => `
              <div style="margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                  <span style="font-weight:600;font-size:0.88rem;">${escHtml(s.name)}</span>
                  <span style="font-weight:700;color:${barColors[i % barColors.length]};">${s.avg}%</span>
                </div>
                <div style="height:10px;background:var(--bg);border-radius:10px;overflow:hidden;">
                  <div style="width:${s.avg}%;height:100%;background:${barColors[i % barColors.length]};border-radius:10px;transition:width 1s ease;"></div>
                </div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${s.count} attempt${s.count > 1 ? 's' : ''}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Pass/Fail Donut Chart -->
        <div class="admin-section">
          <div class="admin-section-header"><h3>✅ Pass / Fail Ratio</h3></div>
          <div style="padding:24px;text-align:center;">
            <svg viewBox="0 0 200 200" width="200" height="200" style="margin:0 auto 16px;display:block;">
              ${passed > 0 ? `<path d="${describeArc(100, 100, 70, passRad1, passRad2)}" fill="none" stroke="#00B894" stroke-width="20" stroke-linecap="round"/>` : ''}
              ${failed > 0 ? `<path d="${describeArc(100, 100, 70, passRad2, passRad1 + 360)}" fill="none" stroke="#E17055" stroke-width="20" stroke-linecap="round"/>` : ''}
              <text x="100" y="95" text-anchor="middle" font-size="28" font-weight="800" fill="var(--text-primary)" font-family="Outfit">${Math.round((passed / donutTotal) * 100)}%</text>
              <text x="100" y="118" text-anchor="middle" font-size="12" fill="var(--text-muted)">Pass Rate</text>
            </svg>
            <div style="display:flex;justify-content:center;gap:28px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:12px;height:12px;border-radius:50%;background:#00B894;"></div>
                <span style="font-size:0.88rem;">Passed: <strong>${passed}</strong></span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:12px;height:12px;border-radius:50%;background:#E17055;"></div>
                <span style="font-size:0.88rem;">Failed: <strong>${failed}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Score Trend -->
      <div class="admin-section" style="margin-bottom:28px;">
        <div class="admin-section-header"><h3>📈 Score Trend (Recent Attempts)</h3></div>
        <div style="padding:24px;">
          <div style="display:flex;align-items:flex-end;gap:8px;height:160px;">
            ${trend.map((t, i) => `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;">
                <span style="font-size:0.72rem;font-weight:700;color:${t.pct >= 50 ? 'var(--success)' : 'var(--danger)'};">${t.pct}%</span>
                <div style="width:100%;height:${Math.max(t.pct * 1.4, 8)}px;background:${t.pct >= 50 ? 'linear-gradient(180deg,#00B894,#00B89488)' : 'linear-gradient(180deg,#E17055,#E1705588)'};border-radius:6px 6px 2px 2px;transition:height 0.8s ease;"></div>
                <span style="font-size:0.65rem;color:var(--text-muted);text-align:center;max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(t.label)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    document.getElementById('analyticsContent').innerHTML = `
      <div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>
    `;
  }
}

// ══════════════════════════════════════════════════════════════
// 404 PAGE
// ══════════════════════════════════════════════════════════════

function render404() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="results-container" style="text-align:center;padding:80px 20px;">
      <div style="font-size:6rem;margin-bottom:16px;opacity:0.3;">🔍</div>
      <h1 style="font-size:3rem;font-weight:800;font-family:'Outfit',sans-serif;color:var(--text-primary);margin-bottom:8px;">404</h1>
      <p style="font-size:1.1rem;color:var(--text-muted);margin-bottom:28px;">The page you're looking for doesn't exist or has been moved.</p>
      <a href="#/dashboard" class="btn btn-primary">← Back to Dashboard</a>
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
// PROFILE PAGE — Badges, Stats, Subscriptions, Edit & Password
// ══════════════════════════════════════════════════════════════

async function renderProfile() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="flex-center" style="min-height:400px;"><div class="spinner"></div></div>
  `;

  try {
    const data = await api.get('/payments/profile');
    const { user, badges, subscriptions, stats } = data;

    const planColors = { free: '#94A3B8', pro: '#6C5CE7', enterprise: '#3B82F6' };
    const planLabels = { free: 'Free Plan', pro: '⭐ Pro Member', enterprise: '💎 Enterprise' };
    const planColor = planColors[user.current_plan] || '#94A3B8';

    app.innerHTML = `
      <div class="results-container" style="animation:fadeSlideUp 0.4s ease;">
        <!-- Profile Header Card -->
        <div class="result-summary-card" style="max-width:900px;margin:0 auto 28px;">
          <div style="display:flex;align-items:center;gap:28px;text-align:left;flex-wrap:wrap;">
            <div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,${planColor},${planColor}AA);display:flex;align-items:center;justify-content:center;color:white;font-size:2.2rem;font-weight:800;font-family:'Outfit',sans-serif;flex-shrink:0;box-shadow:0 4px 20px ${planColor}44;">
              ${escHtml(user.name.charAt(0).toUpperCase())}
            </div>
            <div style="flex:1;min-width:200px;">
              <h2 style="font-size:1.5rem;margin-bottom:4px;">${escHtml(user.name)}</h2>
              <p style="color:var(--text-muted);margin-bottom:10px;">${escHtml(user.email)} · ${user.role}</p>
              <div style="display:inline-flex;align-items:center;gap:6px;padding:6px 18px;border-radius:20px;background:${planColor}18;color:${planColor};font-weight:700;font-size:0.82rem;border:1.5px solid ${planColor}33;">
                ${planLabels[user.current_plan] || 'Free Plan'}
              </div>
              ${user.current_plan !== 'free' ? `<span style="margin-left:8px;font-size:0.78rem;color:var(--text-muted);">Member since ${new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>` : ''}
            </div>
            <div style="text-align:right;flex-shrink:0;">
              ${user.current_plan === 'free'
                ? '<a href="#/packages" class="btn btn-primary">⭐ Upgrade to Pro</a>'
                : '<a href="#/payments" class="btn btn-outline btn-sm">Payment History</a>'
              }
            </div>
          </div>
        </div>

        <!-- Edit Profile & Change Password -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:900px;margin:0 auto 28px;">
          <div class="admin-section">
            <div class="admin-section-header"><h3>✏️ Edit Profile</h3></div>
            <div style="padding:24px;">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="editName" value="${escHtml(user.name)}" placeholder="Your name">
              </div>
              <div id="editProfileMsg" style="margin-bottom:12px;"></div>
              <button class="btn btn-primary btn-block" onclick="handleUpdateProfile()">Save Changes</button>
            </div>
          </div>
          <div class="admin-section">
            <div class="admin-section-header"><h3>🔒 Change Password</h3></div>
            <div style="padding:24px;">
              <div class="form-group">
                <label>Current Password</label>
                <input type="password" id="currentPass" placeholder="Enter current password">
              </div>
              <div class="form-group">
                <label>New Password</label>
                <input type="password" id="newPass" placeholder="Min 6 characters">
              </div>
              <div id="changePassMsg" style="margin-bottom:12px;"></div>
              <button class="btn btn-primary btn-block" onclick="handleChangePassword()">Change Password</button>
            </div>
          </div>
        </div>

        <!-- Badges Section -->
        <div class="admin-section" style="max-width:900px;margin:0 auto 28px;">
          <div class="admin-section-header">
            <h3>🏅 Badges & Achievements</h3>
            <span style="font-size:0.82rem;color:var(--text-muted);">${badges.length} badge${badges.length !== 1 ? 's' : ''} earned</span>
          </div>
          <div style="padding:24px;display:flex;flex-wrap:wrap;gap:14px;">
            ${badges.map(b => `
              <div style="display:flex;align-items:center;gap:10px;padding:12px 20px;border-radius:var(--radius-md);border:1.5px solid ${b.color}33;background:${b.color}0A;min-width:150px;">
                <span style="font-size:1.5rem;">${b.icon}</span>
                <span style="font-weight:700;font-size:0.88rem;color:${b.color};">${escHtml(b.label)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Stats Section -->
        <div style="max-width:900px;margin:0 auto 28px;">
          <div class="stats-banner">
            <div class="mini-stat">
              <div class="mini-stat-icon green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
              <div class="mini-stat-info"><div class="stat-num">${stats.total_attempts}</div><div class="stat-lbl">Quizzes Taken</div></div>
            </div>
            <div class="mini-stat">
              <div class="mini-stat-icon purple"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div>
              <div class="mini-stat-info"><div class="stat-num">${stats.avg_score}%</div><div class="stat-lbl">Average Score</div></div>
            </div>
            <div class="mini-stat">
              <div class="mini-stat-icon orange"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
              <div class="mini-stat-info"><div class="stat-num">${stats.best_score}%</div><div class="stat-lbl">Best Score</div></div>
            </div>
            <div class="mini-stat">
              <div class="mini-stat-icon blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
              <div class="mini-stat-info"><div class="stat-num">₹${stats.total_spent}</div><div class="stat-lbl">Total Spent</div></div>
            </div>
          </div>
        </div>

        <!-- Active Subscriptions -->
        <div class="admin-section" style="max-width:900px;margin:0 auto;">
          <div class="admin-section-header"><h3>📦 Active Subscriptions</h3></div>
          ${subscriptions.length === 0
            ? '<div class="empty-state" style="padding:40px;"><h3>No Active Subscriptions</h3><p>Purchase a plan or offer to unlock premium features. <a href="#/packages">View Plans →</a></p></div>'
            : `<table class="admin-table">
                <thead><tr><th>Product</th><th>Plan</th><th>Status</th><th>Activated</th><th>Expires</th></tr></thead>
                <tbody>
                  ${subscriptions.map(s => `
                    <tr>
                      <td><strong>${escHtml(s.product_name)}</strong></td>
                      <td><span style="padding:3px 12px;border-radius:20px;background:var(--primary-50);color:var(--primary);font-size:0.78rem;font-weight:700;text-transform:uppercase;">${s.plan_type}</span></td>
                      <td><span class="score-badge pass">✓ Active</span></td>
                      <td style="color:var(--text-muted);font-size:0.85rem;">${new Date(s.activated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td style="color:var(--text-muted);font-size:0.85rem;">${s.expires_at ? new Date(s.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>`
          }
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<div class="empty-state" style="padding:80px;"><h3>Could not load profile</h3><p>${err.message}</p><a href="#/dashboard" class="btn btn-primary">Back to Dashboard</a></div>`;
  }
}

async function handleUpdateProfile() {
  const name = document.getElementById('editName').value.trim();
  const msg = document.getElementById('editProfileMsg');
  if (!name || name.length < 2) { msg.innerHTML = '<span style="color:var(--danger);">Name must be at least 2 characters.</span>'; return; }
  try {
    const data = await api.put('/auth/profile', { name });
    if (data.token) {
      localStorage.setItem('quiz_token', data.token);
      localStorage.setItem('quiz_user', JSON.stringify(data.user));
    }
    msg.innerHTML = '<span style="color:var(--success);font-weight:600;">✓ Profile updated!</span>';
    updateNavbar();
  } catch (err) { msg.innerHTML = `<span style="color:var(--danger);">${err.message}</span>`; }
}

async function handleChangePassword() {
  const current = document.getElementById('currentPass').value;
  const newP = document.getElementById('newPass').value;
  const msg = document.getElementById('changePassMsg');
  if (!current || !newP) { msg.innerHTML = '<span style="color:var(--danger);">Both fields required.</span>'; return; }
  if (newP.length < 6) { msg.innerHTML = '<span style="color:var(--danger);">New password must be at least 6 characters.</span>'; return; }
  try {
    await api.put('/auth/change-password', { current_password: current, new_password: newP });
    msg.innerHTML = '<span style="color:var(--success);font-weight:600;">✓ Password changed!</span>';
    document.getElementById('currentPass').value = '';
    document.getElementById('newPass').value = '';
  } catch (err) { msg.innerHTML = `<span style="color:var(--danger);">${err.message}</span>`; }
}

// ── Initialize ──────────────────────────────────────────────
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
