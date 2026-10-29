// ============================================================
// Quiz Routes (Student-facing)
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  listQuizzes, getQuiz, startQuiz,
  saveAnswer, submitQuiz,
  getResults, getResultDetail, getLeaderboard,
} = require('../controllers/quizController');

// Public: list published quizzes
router.get('/', authenticate, listQuizzes);

// Leaderboard (must be before /:id to avoid route conflict)
router.get('/leaderboard', authenticate, getLeaderboard);

// Student: results
router.get('/results/me', authenticate, getResults);
router.get('/results/:attemptId', authenticate, getResultDetail);

// Quiz detail
router.get('/:id', authenticate, getQuiz);

// Student: quiz attempt flow
router.post('/:id/start', authenticate, startQuiz);
router.post('/attempts/:id/answer', authenticate, saveAnswer);
router.post('/attempts/:id/submit', authenticate, submitQuiz);

module.exports = router;
