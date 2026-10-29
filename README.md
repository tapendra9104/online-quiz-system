# 📝 QuizMaster — Online Quiz System

A full-stack web application where students can attempt timed quizzes, submit answers, view analytics, and track their progress. Admins can create quizzes, manage questions, set time limits, and view comprehensive activity feeds with student results.

> **BTech 4th Year Final Year Project** — Built with modern web technologies and enterprise-grade security.

## 🏗️ Tech Stack

| Layer     | Technology            |
|-----------|----------------------|
| Frontend  | HTML, CSS, JavaScript |
| Backend   | Node.js + Express.js  |
| Database  | MySQL 8+              |
| Auth      | JWT + bcrypt           |

## 📁 Project Structure

```
online-quiz-system/
├── frontend/
│   ├── index.html              # SPA shell with navbar, footer, modals
│   ├── css/
│   │   └── style.css           # Design system + dark mode
│   └── js/
│       ├── api.js              # HTTP client wrapper
│       ├── auth.js             # Login & Register pages
│       ├── quiz.js             # Quiz taking interface (timed, auto-save)
│       ├── dashboard.js        # Student dashboard & history
│       ├── admin.js            # Admin management panel (5-tab dashboard)
│       └── app.js              # SPA router, analytics, leaderboard, payments
├── backend/
│   ├── src/
│   │   ├── app.js              # Express entry point + graceful shutdown
│   │   ├── config/
│   │   │   └── db.js           # MySQL connection pool
│   │   ├── controllers/
│   │   │   ├── authController.js     # Auth + password change + profile update
│   │   │   ├── quizController.js     # Quiz lifecycle + global leaderboard
│   │   │   ├── adminController.js    # Admin stats, activity feed, CRUD
│   │   │   └── paymentController.js  # Payments, subscriptions, profile
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification + role guards
│   │   │   ├── validate.js     # Input validation middleware
│   │   │   └── errorHandler.js # Global error handler
│   │   └── routes/
│   │       ├── authRoutes.js   # Auth routes + rate limiting
│   │       ├── quizRoutes.js   # Quiz + leaderboard routes
│   │       ├── adminRoutes.js  # Admin CRUD routes
│   │       └── paymentRoutes.js
│   ├── .env
│   ├── .env.example
│   └── package.json
├── database/
│   └── schema.sql              # Schema + seed data
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MySQL** v8+

### 1. Setup Database

```bash
mysql -u root -p < database/schema.sql
```

This creates the database, all tables, and seed data including:
- **Admin account:** admin@quiz.com / admin123
- **Student account:** student@quiz.com / student123

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials
# ⚠️  IMPORTANT: Change JWT_SECRET in production!
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Start the Server

```bash
npm run dev    # Development with auto-reload
npm start      # Production
```

Visit **http://localhost:3000** in your browser.

### 5. Run Checks

```bash
cd backend
npm test          # Unit checks; does not require MySQL
npm run test:e2e  # API end-to-end checks against a temporary MySQL database
```

The end-to-end command uses the database connection in `backend/.env`, creates a uniquely named test database, and drops it after the run. MySQL must be running, and the configured database user needs permission to create and drop databases.

## 🔑 Demo Credentials

| Role    | Email             | Password   |
|---------|-------------------|------------|
| Admin   | admin@quiz.com    | admin123   |
| Student | student@quiz.com  | student123 |

## 📋 API Endpoints

### Authentication
| Method | Endpoint                | Description            |
|--------|-------------------------|------------------------|
| POST   | /api/auth/register      | Create student account |
| POST   | /api/auth/login         | Login                  |
| GET    | /api/auth/me            | Get current user       |
| PUT    | /api/auth/change-password | Change password      |
| PUT    | /api/auth/profile       | Update name            |

### Quiz (Student)
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/quizzes                      | List published quizzes   |
| GET    | /api/quizzes/:id                  | Get quiz details         |
| POST   | /api/quizzes/:id/start            | Start timed attempt      |
| POST   | /api/quizzes/attempts/:id/answer  | Save answer (auto-save)  |
| POST   | /api/quizzes/attempts/:id/submit  | Submit and get score     |
| GET    | /api/quizzes/results/me           | View result history      |
| GET    | /api/quizzes/results/:attemptId   | Detailed result          |
| GET    | /api/quizzes/leaderboard          | Global student ranking   |

### Admin
| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | /api/admin/stats                  | Dashboard statistics     |
| GET    | /api/admin/activity               | Activity feed (all events)|
| GET    | /api/admin/quizzes                | List all quizzes         |
| POST   | /api/admin/quizzes                | Create quiz              |
| PUT    | /api/admin/quizzes/:id            | Update quiz              |
| DELETE | /api/admin/quizzes/:id            | Delete quiz              |
| GET    | /api/admin/quizzes/:id/questions  | List questions           |
| POST   | /api/admin/quizzes/:id/questions  | Add question             |
| DELETE | /api/admin/questions/:id          | Delete question          |
| GET    | /api/admin/quizzes/:id/results    | View student results     |

### Payments & Subscriptions
| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| POST   | /api/payments/purchase       | Record a purchase        |
| GET    | /api/payments/history        | Payment history          |
| GET    | /api/payments/subscriptions  | Active subscriptions     |
| GET    | /api/payments/profile        | Full profile with badges |

## 🔒 Security Features

- **Password hashing** with bcrypt (10 salt rounds)
- **JWT authentication** with configurable expiration
- **Role-based authorization** (student/admin)
- **XSS prevention** — HTML sanitization on all user inputs
- **Admin registration blocked** — public signup always creates student accounts
- **Parameterized SQL queries** (SQL injection prevention)
- **Server-controlled quiz timing** (never trust client)
- **Rate limiting** — global (200/15min) + strict auth limits (10 login, 5 register per 15min)
- **Input validation** on all endpoints
- **Database transactions** for score calculation
- **Graceful shutdown** — clean DB connection closure on SIGTERM/SIGINT
- **HTTP request logging** via morgan

## 📐 Core Features

### Student Features
1. **Server-Controlled Timed Quizzes** — Admin sets duration, server enforces deadlines
2. **Auto-save** — Answers saved to server on each selection
3. **Question Bookmarking** — Mark questions for review during quiz
4. **Beforeunload Warning** — Prevents accidental page close during active quiz
5. **Performance Analytics** — Subject-wise bars, pass/fail donut chart, score trend
6. **Global Leaderboard** — Real ranking of all students by average score
7. **Result History** — View all past attempts with detailed answer review
8. **Flashcards** — Study material generated from quiz questions
9. **Profile Management** — Edit name, change password, view badges & subscriptions
10. **Subscription & Offers** — Purchase plans with payment simulation; the included card checkout is a demo and does not charge real cards

### Admin Features
1. **5-Tab Dashboard** — Overview, Activity Feed, Users, Payments, Quizzes
2. **Activity Feed** — Real-time feed of registrations, quiz attempts, payments
3. **Quiz CRUD** — Create, edit, delete quizzes with questions and options
4. **Question Management** — Add/remove questions with explanations and difficulty levels
5. **Student Results** — View detailed results per quiz with pass/fail breakdown

### UI/UX Features
1. **Dark Mode** — Toggle with sun/moon icon, persisted in localStorage, detects OS preference
2. **Mobile Responsive** — Hamburger menu for mobile navigation
3. **Professional Footer** — Project credits and navigation links
4. **404 Page** — Styled error page for invalid routes
5. **Toast Notifications** — Success, error, warning, and info toasts
6. **Loading Overlays** — Spinner during API calls
7. **Modern Design** — Glassmorphism, gradients, micro-animations, Google Fonts (Inter, Outfit)

## 📊 Database Schema

| Table              | Description                              |
|--------------------|------------------------------------------|
| users              | Student & admin accounts                 |
| quizzes            | Quiz metadata (title, subject, duration) |
| questions          | Questions with explanation & difficulty  |
| options            | MCQ options with correct flag            |
| attempts           | Quiz attempt records                     |
| attempt_answers    | Individual answer submissions            |
| payments           | Payment transaction records              |
| user_subscriptions | Active subscription records              |

## 📐 Architecture

```
┌─────────────────────────────────┐
│         Frontend (SPA)          │
│   HTML + CSS + Vanilla JS       │
│   Hash-based Router             │
└─────────┬───────────────────────┘
          │ REST API (JSON)
┌─────────▼───────────────────────┐
│       Backend (Express.js)      │
│  Auth │ Quiz │ Admin │ Payment  │
│  JWT  │ Timer│ Feed  │ Subs    │
└─────────┬───────────────────────┘
          │ mysql2/promise
┌─────────▼───────────────────────┐
│       MySQL Database            │
│   8 tables, indexes, FKs       │
└─────────────────────────────────┘
```

## 📄 License

This project is developed as a BTech Final Year Project for academic purposes.
