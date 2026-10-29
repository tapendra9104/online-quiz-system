// ============================================================
// Admin Routes
// ============================================================
const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  listAllQuizzes, createQuiz, updateQuiz, deleteQuiz,
  listQuestions, addQuestion, deleteQuestion,
  getQuizResults, getDashboardStats,
  getActivityFeed, getRecentRegistrations, getAllPayments,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// Activity feed & notifications
router.get('/activity', getActivityFeed);
router.get('/registrations', getRecentRegistrations);
router.get('/all-payments', getAllPayments);

// Quiz CRUD
router.get('/quizzes', listAllQuizzes);
router.post('/quizzes', validate({
  title: { required: true, type: 'string', min: 2 },
  duration: { required: true, type: 'number', min: 30 },
}), createQuiz);
router.put('/quizzes/:id', updateQuiz);
router.delete('/quizzes/:id', deleteQuiz);

// Question management
router.get('/quizzes/:id/questions', listQuestions);
router.post('/quizzes/:id/questions', validate({
  text: { required: true, type: 'string' },
  options: { required: true, type: 'array' },
}), addQuestion);
router.delete('/questions/:id', deleteQuestion);

// Results
router.get('/quizzes/:id/results', getQuizResults);

module.exports = router;
