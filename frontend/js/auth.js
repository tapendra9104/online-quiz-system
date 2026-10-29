// ============================================================
// Auth Module — Login & Register Pages
// ============================================================

const auth = {
  /** Get current user from localStorage */
  getCurrentUser() {
    const u = localStorage.getItem('quiz_user');
    return u ? JSON.parse(u) : null;
  },

  /** Check if user is logged in */
  isLoggedIn() {
    return !!localStorage.getItem('quiz_token');
  },

  /** Log out */
  logout() {
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
    window.location.hash = '#/login';
  },

  /** Render Login Page */
  renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <h2>Welcome Back 👋</h2>
          <p class="auth-subtitle">Sign in to continue to QuizMaster</p>
          <form id="loginForm" autocomplete="on">
            <div class="form-group">
              <label for="loginEmail">Email Address</label>
              <input type="email" id="loginEmail" autocomplete="username" placeholder="you@example.com" required>
            </div>
            <div class="form-group">
              <label for="loginPassword">Password</label>
              <input type="password" id="loginPassword" autocomplete="current-password" placeholder="Enter your password" required>
            </div>
            <div id="loginError" class="form-error" style="margin-bottom:12px;"></div>
            <button type="submit" class="btn btn-primary btn-block btn-lg" id="loginBtn">
              Sign In
            </button>
          </form>
          <div class="auth-footer">
            Don't have an account? <a href="#/register">Sign Up</a>
          </div>
          <div style="margin-top:16px; padding:14px; background:var(--primary-bg); border-radius:var(--radius-md); font-size:0.82rem; color:var(--text-secondary);">
            <strong>Demo Accounts:</strong><br>
            Admin: admin@quiz.com / admin123<br>
            Student: student@quiz.com / student123
          </div>
        </div>
      </div>
    `;

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('loginError');
      const btn = document.getElementById('loginBtn');

      errorEl.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Signing in…';

      try {
        const data = await api.post('/auth/login', { email, password });
        localStorage.setItem('quiz_token', data.token);
        localStorage.setItem('quiz_user', JSON.stringify(data.user));
        showToast('Login successful!', 'success');
        window.location.hash = data.user.role === 'admin' ? '#/admin' : '#/dashboard';
      } catch (err) {
        errorEl.textContent = err.message || 'Login failed.';
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  },

  /** Render Register Page */
  renderRegister() {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <h2>Create Account ✨</h2>
          <p class="auth-subtitle">Join QuizMaster and start learning</p>
          <form id="registerForm" autocomplete="on">
            <div class="form-group">
              <label for="regName">Full Name</label>
              <input type="text" id="regName" autocomplete="name" placeholder="John Doe" required minlength="2">
            </div>
            <div class="form-group">
              <label for="regEmail">Email Address</label>
              <input type="email" id="regEmail" autocomplete="email" placeholder="you@example.com" required>
            </div>
            <div class="form-group">
              <label for="regPassword">Password</label>
              <input type="password" id="regPassword" autocomplete="new-password" placeholder="Min 6 characters" required minlength="6">
            </div>
            <div id="regError" class="form-error" style="margin-bottom:12px;"></div>
            <button type="submit" class="btn btn-primary btn-block btn-lg" id="regBtn">
              Create Account
            </button>
          </form>
          <div class="auth-footer">
            Already have an account? <a href="#/login">Sign In</a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const errorEl = document.getElementById('regError');
      const btn = document.getElementById('regBtn');

      errorEl.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Creating account…';

      try {
        const data = await api.post('/auth/register', { name, email, password });
        localStorage.setItem('quiz_token', data.token);
        localStorage.setItem('quiz_user', JSON.stringify(data.user));
        showToast('Account created successfully!', 'success');
        window.location.hash = data.user.role === 'admin' ? '#/admin' : '#/dashboard';
      } catch (err) {
        errorEl.textContent = err.message || 'Registration failed.';
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  },
};
