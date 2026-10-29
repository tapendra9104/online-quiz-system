// ============================================================
// Admin Controller — Quiz & Question Management
// ============================================================
const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { validateOptions } = require('../utils/quiz');

/**
 * GET /api/admin/quizzes — List all quizzes (any status)
 */
async function listAllQuizzes(req, res, next) {
  try {
    const [quizzes] = await db.query(`
      SELECT q.*, u.name AS created_by_name,
             (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count,
             (SELECT COUNT(*) FROM attempts WHERE quiz_id = q.id AND status = 'submitted') AS attempt_count
      FROM quizzes q
      JOIN users u ON q.created_by = u.id
      ORDER BY q.created_at DESC
    `);
    res.json({ quizzes });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/quizzes — Create a new quiz
 */
async function createQuiz(req, res, next) {
  try {
    const { title, description, subject, exam_type, duration, passing_marks, total_marks, status } = req.body;
    const quizDuration = duration === undefined ? 600 : Number(duration);
    const passingMarks = passing_marks === undefined ? 0 : Number(passing_marks);
    const totalMarks = total_marks === undefined ? 0 : Number(total_marks);
    const quizStatus = status || 'draft';

    if (typeof title !== 'string' || title.trim().length < 2) throw new AppError('Title must be at least 2 characters.', 400);
    if (!Number.isSafeInteger(quizDuration) || quizDuration < 30) throw new AppError('Duration must be a whole number of at least 30 seconds.', 400);
    if (!Number.isSafeInteger(passingMarks) || passingMarks < 0) throw new AppError('Passing marks must be a non-negative whole number.', 400);
    if (!Number.isSafeInteger(totalMarks) || totalMarks < 0) throw new AppError('Total marks must be a non-negative whole number.', 400);
    if (totalMarks > 0 && passingMarks > totalMarks) throw new AppError('Passing marks cannot exceed total marks.', 400);
    if (!['draft', 'published', 'archived'].includes(quizStatus)) throw new AppError('Quiz status is invalid.', 400);
    if (quizStatus === 'published') throw new AppError('Create the quiz as a draft, add questions, then publish it.', 400);

    const [result] = await db.query(
      `INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title.trim(), description || null, subject || 'General', exam_type || 'Practice',
       quizDuration, passingMarks, totalMarks,
       quizStatus, req.user.id]
    );

    res.status(201).json({
      message: 'Quiz created successfully.',
      quiz: { id: result.insertId, title: title.trim(), status: quizStatus },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/quizzes/:id — Update quiz settings
 */
async function updateQuiz(req, res, next) {
  try {
    const quizId = parseInt(req.params.id);
    const { title, description, subject, exam_type, duration, passing_marks, total_marks, status } = req.body;

    const [existing] = await db.query(`
      SELECT id, status, total_marks, passing_marks,
             (SELECT COUNT(*) FROM questions WHERE quiz_id = quizzes.id) AS question_count
      FROM quizzes WHERE id = ?
    `, [quizId]);
    if (existing.length === 0) {
      throw new AppError('Quiz not found.', 404);
    }

    const current = existing[0];
    const targetTotal = total_marks === undefined ? Number(current.total_marks) : Number(total_marks);
    const targetPassing = passing_marks === undefined ? Number(current.passing_marks) : Number(passing_marks);
    const targetStatus = status || current.status;
    if (duration !== undefined && (!Number.isSafeInteger(Number(duration)) || Number(duration) < 30)) {
      throw new AppError('Duration must be a whole number of at least 30 seconds.', 400);
    }
    if (total_marks !== undefined && (!Number.isSafeInteger(targetTotal) || targetTotal < 0)) {
      throw new AppError('Total marks must be a non-negative whole number.', 400);
    }
    if (passing_marks !== undefined && (!Number.isSafeInteger(targetPassing) || targetPassing < 0)) {
      throw new AppError('Passing marks must be a non-negative whole number.', 400);
    }
    if (targetTotal > 0 && targetPassing > targetTotal) throw new AppError('Passing marks cannot exceed total marks.', 400);
    if (!['draft', 'published', 'archived'].includes(targetStatus)) throw new AppError('Quiz status is invalid.', 400);
    if (targetStatus === 'published' && (Number(current.question_count) === 0 || targetTotal === 0)) {
      throw new AppError('Add at least one marked question before publishing this quiz.', 400);
    }

    await db.query(`
      UPDATE quizzes SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        subject = COALESCE(?, subject),
        exam_type = COALESCE(?, exam_type),
        duration = COALESCE(?, duration),
        passing_marks = COALESCE(?, passing_marks),
        total_marks = COALESCE(?, total_marks),
        status = COALESCE(?, status)
      WHERE id = ?
    `, [title, description, subject, exam_type, duration, passing_marks, total_marks, status, quizId]);

    res.json({ message: 'Quiz updated successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/quizzes/:id — Delete quiz
 */
async function deleteQuiz(req, res, next) {
  try {
    const quizId = parseInt(req.params.id);
    const [result] = await db.query('DELETE FROM quizzes WHERE id = ?', [quizId]);
    if (result.affectedRows === 0) {
      throw new AppError('Quiz not found.', 404);
    }
    res.json({ message: 'Quiz deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/quizzes/:id/questions — List questions with answers
 */
async function listQuestions(req, res, next) {
  try {
    const quizId = parseInt(req.params.id);
    const [questions] = await db.query(`
      SELECT q.id, q.text, q.explanation, q.difficulty, q.marks, q.position,
             JSON_ARRAYAGG(
               JSON_OBJECT('id', o.id, 'label', o.label, 'text', o.text, 'is_correct', CAST(o.is_correct AS UNSIGNED))
             ) AS options
      FROM questions q
      JOIN options o ON o.question_id = q.id
      WHERE q.quiz_id = ?
      GROUP BY q.id
      ORDER BY q.position ASC
    `, [quizId]);

    res.json({ questions });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/quizzes/:id/questions — Add a question with options
 */
async function addQuestion(req, res, next) {
  let connection;
  let transactionOpen = false;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionOpen = true;

    const quizId = parseInt(req.params.id);
    const { text, explanation, difficulty = 'medium', options } = req.body;
    const marks = req.body.marks === undefined ? 1 : Number(req.body.marks);

    if (!Number.isSafeInteger(quizId) || quizId < 1) throw new AppError('Invalid quiz ID.', 400);
    if (typeof text !== 'string' || text.trim().length === 0) throw new AppError('Question text is required.', 400);
    if (!Number.isSafeInteger(marks) || marks < 1 || marks > 100) throw new AppError('Marks must be a whole number between 1 and 100.', 400);
    if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new AppError('Difficulty must be easy, medium, or hard.', 400);
    if (explanation !== undefined && typeof explanation !== 'string') throw new AppError('Explanation must be a string.', 400);
    const optionsError = validateOptions(options);
    if (optionsError) throw new AppError(optionsError, 400);

    const [quizzes] = await connection.query('SELECT id FROM quizzes WHERE id = ?', [quizId]);
    if (quizzes.length === 0) throw new AppError('Quiz not found.', 404);

    // Get next position
    const [posResult] = await connection.query(
      'SELECT COALESCE(MAX(position), 0) + 1 AS next_pos FROM questions WHERE quiz_id = ?',
      [quizId]
    );

    const [qResult] = await connection.query(
      'INSERT INTO questions (quiz_id, text, explanation, difficulty, marks, position) VALUES (?, ?, ?, ?, ?, ?)',
      [quizId, text.trim(), explanation ? explanation.trim() : null, difficulty, marks, posResult[0].next_pos]
    );
    const questionId = qResult.insertId;

    // Insert options
    for (const opt of options) {
      await connection.query(
        'INSERT INTO options (question_id, label, text, is_correct) VALUES (?, ?, ?, ?)',
        [questionId, opt.label.trim().toUpperCase(), opt.text.trim(), opt.is_correct]
      );
    }

    // Update quiz total_marks
    await connection.query(`
      UPDATE quizzes SET total_marks = (
        SELECT COALESCE(SUM(marks), 0) FROM questions WHERE quiz_id = ?
      ) WHERE id = ?
    `, [quizId, quizId]);

    await connection.commit();
    transactionOpen = false;

    res.status(201).json({
      message: 'Question added successfully.',
      question: { id: questionId },
    });
  } catch (err) {
    if (connection && transactionOpen) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * DELETE /api/admin/questions/:id — Delete a question
 */
async function deleteQuestion(req, res, next) {
  let connection;
  let transactionOpen = false;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionOpen = true;

    const questionId = parseInt(req.params.id);
    const [questions] = await connection.query('SELECT quiz_id FROM questions WHERE id = ?', [questionId]);
    if (questions.length === 0) {
      throw new AppError('Question not found.', 404);
    }
    const quizId = questions[0].quiz_id;

    await connection.query('DELETE FROM questions WHERE id = ?', [questionId]);

    // Update quiz total_marks
    await connection.query(`
      UPDATE quizzes SET total_marks = (
        SELECT COALESCE(SUM(marks), 0) FROM questions WHERE quiz_id = ?
      ) WHERE id = ?
    `, [quizId, quizId]);

    await connection.commit();
    transactionOpen = false;
    res.json({ message: 'Question deleted successfully.' });
  } catch (err) {
    if (connection && transactionOpen) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * GET /api/admin/quizzes/:id/results — View student results for a quiz
 */
async function getQuizResults(req, res, next) {
  try {
    const quizId = parseInt(req.params.id);
    const [results] = await db.query(`
      SELECT a.id AS attempt_id, a.score, a.total_marks, a.submitted_at,
             a.started_at, a.status,
             u.name AS student_name, u.email AS student_email,
             ROUND((a.score / a.total_marks) * 100, 1) AS percentage
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      WHERE a.quiz_id = ? AND a.status IN ('submitted', 'expired')
      ORDER BY a.score DESC, a.submitted_at ASC
    `, [quizId]);

    res.json({ results });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/stats — Dashboard statistics (enhanced)
 */
async function getDashboardStats(req, res, next) {
  try {
    const [[{ total_quizzes }]] = await db.query('SELECT COUNT(*) AS total_quizzes FROM quizzes');
    const [[{ total_students }]] = await db.query("SELECT COUNT(*) AS total_students FROM users WHERE role = 'student'");
    const [[{ total_attempts }]] = await db.query("SELECT COUNT(*) AS total_attempts FROM attempts WHERE status = 'submitted'");
    const [[{ avg_score }]] = await db.query("SELECT ROUND(AVG(score / total_marks * 100), 1) AS avg_score FROM attempts WHERE status = 'submitted' AND total_marks > 0");

    // Revenue & subscriptions stats
    let total_revenue = 0;
    let active_subscriptions = 0;
    try {
      const [[revRow]] = await db.query("SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payments WHERE status = 'completed'");
      total_revenue = revRow.total_revenue;
      const [[subRow]] = await db.query("SELECT COUNT(*) AS active_subscriptions FROM user_subscriptions WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW())");
      active_subscriptions = subRow.active_subscriptions;
    } catch (e) { /* tables may not exist yet */ }

    // New registrations in last 7 days
    let new_registrations_7d = 0;
    try {
      const [[regRow]] = await db.query("SELECT COUNT(*) AS cnt FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
      new_registrations_7d = regRow.cnt;
    } catch (e) { /* */ }

    const [recentAttempts] = await db.query(`
      SELECT a.id, a.score, a.total_marks, a.submitted_at,
             u.name AS student_name, q.title AS quiz_title
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.status = 'submitted'
      ORDER BY a.submitted_at DESC
      LIMIT 10
    `);

    res.json({
      stats: {
        total_quizzes,
        total_students,
        total_attempts,
        avg_score: avg_score || 0,
        total_revenue,
        active_subscriptions,
        new_registrations_7d,
      },
      recent_attempts: recentAttempts,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/activity — Unified activity feed
 * Returns recent quiz attempts, subscription purchases, and new registrations
 */
async function getActivityFeed(req, res, next) {
  try {
    const activities = [];

    // 1. Recent quiz attempts (submitted)
    const [attempts] = await db.query(`
      SELECT a.id, a.score, a.total_marks, a.submitted_at AS activity_time,
             u.name AS user_name, u.email AS user_email,
             q.title AS quiz_title, q.subject AS quiz_subject
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.status = 'submitted'
      ORDER BY a.submitted_at DESC
      LIMIT 30
    `);
    for (const a of attempts) {
      const pct = a.total_marks > 0 ? Math.round((a.score / a.total_marks) * 100) : 0;
      activities.push({
        type: 'quiz_attempt',
        icon: '📝',
        title: `${a.user_name} completed "${a.quiz_title}"`,
        detail: `Score: ${a.score}/${a.total_marks} (${pct}%) · ${a.quiz_subject}`,
        user_name: a.user_name,
        user_email: a.user_email,
        time: a.activity_time,
        meta: { score: a.score, total_marks: a.total_marks, percentage: pct, quiz_title: a.quiz_title },
      });
    }

    // 2. Recent subscription purchases
    try {
      const [payments] = await db.query(`
        SELECT p.id, p.product_name, p.amount, p.payment_method, p.created_at AS activity_time,
               u.name AS user_name, u.email AS user_email,
               s.plan_type
        FROM payments p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN user_subscriptions s ON s.payment_id = p.id
        WHERE p.status = 'completed'
        ORDER BY p.created_at DESC
        LIMIT 20
      `);
      for (const p of payments) {
        activities.push({
          type: 'subscription',
          icon: '💳',
          title: `${p.user_name} purchased "${p.product_name}"`,
          detail: `₹${p.amount} via ${p.payment_method} · Plan: ${p.plan_type || 'offer'}`,
          user_name: p.user_name,
          user_email: p.user_email,
          time: p.activity_time,
          meta: { product_name: p.product_name, amount: p.amount, plan_type: p.plan_type },
        });
      }
    } catch (e) { /* payments table may not exist */ }

    // 3. New registrations
    const [registrations] = await db.query(`
      SELECT id, name AS user_name, email AS user_email, role, created_at AS activity_time
      FROM users
      ORDER BY created_at DESC
      LIMIT 20
    `);
    for (const r of registrations) {
      activities.push({
        type: 'registration',
        icon: '👤',
        title: `${r.user_name} created a new account`,
        detail: `${r.user_email} · Role: ${r.role}`,
        user_name: r.user_name,
        user_email: r.user_email,
        time: r.activity_time,
        meta: { role: r.role },
      });
    }

    // Sort all by time descending
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({ activities: activities.slice(0, 50) });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/registrations — List all registered users
 */
async function getRecentRegistrations(req, res, next) {
  try {
    const [users] = await db.query(`
      SELECT u.id, u.name, u.email, u.role, u.created_at,
             (SELECT COUNT(*) FROM attempts WHERE user_id = u.id AND status = 'submitted') AS quiz_count,
             (SELECT COALESCE(ROUND(AVG(CASE WHEN total_marks > 0 THEN (score/total_marks)*100 ELSE 0 END), 1), 0)
              FROM attempts WHERE user_id = u.id AND status = 'submitted') AS avg_score
      FROM users u
      ORDER BY u.created_at DESC
    `);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/payments — List all payments (admin view)
 */
async function getAllPayments(req, res, next) {
  try {
    const [payments] = await db.query(`
      SELECT p.id, p.payment_id, p.order_id, p.amount, p.currency,
             p.product_id, p.product_name, p.status, p.payment_method,
             p.card_last_four, p.created_at,
             u.name AS user_name, u.email AS user_email,
             s.plan_type, s.expires_at AS subscription_expires
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN user_subscriptions s ON s.payment_id = p.id
      ORDER BY p.created_at DESC
    `);
    res.json({ payments });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAllQuizzes, createQuiz, updateQuiz, deleteQuiz,
  listQuestions, addQuestion, deleteQuestion,
  getQuizResults, getDashboardStats,
  getActivityFeed, getRecentRegistrations, getAllPayments,
};
