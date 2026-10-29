// ============================================================
// Quiz Controller — Student-facing quiz operations
// ============================================================
const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { buildResult, scoreAnswerRows } = require('../utils/quiz');

async function fetchQuestions(connection, quizId) {
  const [questions] = await connection.query(`
    SELECT q.id, q.text, q.marks, q.position,
           JSON_ARRAYAGG(JSON_OBJECT('id', o.id, 'label', o.label, 'text', o.text)) AS options
    FROM questions q
    JOIN options o ON o.question_id = q.id
    WHERE q.quiz_id = ?
    GROUP BY q.id
    ORDER BY q.position ASC
  `, [quizId]);
  return questions;
}

async function saveValidatedAnswer(connection, attemptId, quizId, answer, answeredAt) {
  const questionId = Number(answer && answer.question_id);
  if (!Number.isSafeInteger(questionId) || questionId < 1) {
    throw new AppError('A valid question_id is required for every answer.', 400);
  }

  const [questions] = await connection.query(
    'SELECT id FROM questions WHERE id = ? AND quiz_id = ?',
    [questionId, quizId]
  );
  if (questions.length === 0) {
    throw new AppError('The question does not belong to this quiz.', 400);
  }

  const rawOptionId = answer.selected_option_id;
  const selectedOptionId = rawOptionId === undefined || rawOptionId === null || rawOptionId === ''
    ? null
    : Number(rawOptionId);
  if (selectedOptionId !== null) {
    if (!Number.isSafeInteger(selectedOptionId) || selectedOptionId < 1) {
      throw new AppError('A valid selected_option_id is required.', 400);
    }
    const [options] = await connection.query(
      'SELECT id FROM options WHERE id = ? AND question_id = ?',
      [selectedOptionId, questionId]
    );
    if (options.length === 0) {
      throw new AppError('The selected option does not belong to this question.', 400);
    }
  }

  if (answer.is_bookmarked !== undefined && typeof answer.is_bookmarked !== 'boolean') {
    throw new AppError('is_bookmarked must be a boolean.', 400);
  }

  await connection.query(`
    INSERT INTO attempt_answers (attempt_id, question_id, selected_option_id, is_bookmarked, answered_at)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      selected_option_id = VALUES(selected_option_id),
      is_bookmarked = VALUES(is_bookmarked),
      answered_at = VALUES(answered_at)
  `, [attemptId, questionId, selectedOptionId, answer.is_bookmarked === true, answeredAt]);
}

async function gradeAttempt(connection, attemptId, quizId) {
  const [answerRows] = await connection.query(`
    SELECT aa.id, aa.question_id, aa.selected_option_id,
           COALESCE(o.is_correct, 0) AS is_correct, q.marks
    FROM attempt_answers aa
    JOIN questions q ON q.id = aa.question_id AND q.quiz_id = ?
    LEFT JOIN options o ON o.id = aa.selected_option_id AND o.question_id = aa.question_id
    WHERE aa.attempt_id = ?
  `, [quizId, attemptId]);

  for (const row of answerRows) {
    const isCorrect = row.is_correct === true || Number(row.is_correct) === 1;
    await connection.query('UPDATE attempt_answers SET is_correct = ? WHERE id = ?', [isCorrect, row.id]);
    row.is_correct = isCorrect;
  }
  return scoreAnswerRows(answerRows);
}

/**
 * GET /api/quizzes — List all published quizzes
 */
async function listQuizzes(req, res, next) {
  try {
    const [quizzes] = await db.query(`
      SELECT q.id, q.title, q.description, q.subject, q.exam_type,
             q.duration, q.passing_marks, q.total_marks, q.status,
             u.name AS created_by_name,
             (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count
      FROM quizzes q
      JOIN users u ON q.created_by = u.id
      WHERE q.status = 'published'
      ORDER BY q.created_at DESC
    `);
    res.json({ quizzes });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/quizzes/:id — Get quiz details (no correct answers)
 */
async function getQuiz(req, res, next) {
  try {
    const [quizzes] = await db.query(`
      SELECT q.*, u.name AS created_by_name,
             (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count
      FROM quizzes q
      JOIN users u ON q.created_by = u.id
      WHERE q.id = ? AND q.status = 'published'
    `, [req.params.id]);

    if (quizzes.length === 0) {
      throw new AppError('Quiz not found or not available.', 404);
    }
    res.json({ quiz: quizzes[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/quizzes/:id/start — Start a timed quiz attempt
 */
async function startQuiz(req, res, next) {
  let connection;
  let transactionOpen = false;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionOpen = true;

    const quizId = Number(req.params.id);
    if (!Number.isSafeInteger(quizId) || quizId < 1) {
      throw new AppError('A valid quiz ID is required.', 400);
    }
    const userId = req.user.id;

    // Get quiz info
    const [quizzes] = await connection.query(
      'SELECT * FROM quizzes WHERE id = ? AND status = ?',
      [quizId, 'published']
    );
    if (quizzes.length === 0) {
      throw new AppError('Quiz not found or not available.', 404);
    }
    const quiz = quizzes[0];

    // Check for existing in-progress attempt
    const [existing] = await connection.query(
      'SELECT * FROM attempts WHERE user_id = ? AND quiz_id = ? AND status = ? FOR UPDATE',
      [userId, quizId, 'in_progress']
    );

    if (existing.length > 0) {
      const attempt = existing[0];
      // Check if deadline passed
      const now = new Date();
      const deadline = new Date(attempt.deadline);
      if (now >= deadline) {
        const score = await gradeAttempt(connection, attempt.id, quizId);
        await connection.query(
          'UPDATE attempts SET status = ?, submitted_at = ?, score = ? WHERE id = ?',
          ['expired', deadline, score, attempt.id]
        );
        await connection.commit();
        transactionOpen = false;
        return res.status(410).json({ error: 'Your previous attempt has expired. You may start a new one.' });
      }
      // Return existing attempt
      await connection.commit();
      transactionOpen = false;
      const questions = await fetchQuestions(db, quizId);

      // Get existing answers
      const [answers] = await db.query(
        'SELECT question_id, selected_option_id, is_bookmarked FROM attempt_answers WHERE attempt_id = ?',
        [attempt.id]
      );

      return res.json({
        message: 'Resuming existing attempt.',
        attempt: {
          id: attempt.id,
          started_at: attempt.started_at,
          deadline: attempt.deadline,
          status: attempt.status,
        },
        quiz: { id: quiz.id, title: quiz.title, subject: quiz.subject, exam_type: quiz.exam_type, duration: quiz.duration, total_marks: quiz.total_marks, passing_marks: quiz.passing_marks },
        questions,
        saved_answers: answers,
      });
    }

    // Create new attempt
    const now = new Date();
    const deadline = new Date(now.getTime() + quiz.duration * 1000);

    const [result] = await connection.query(
      'INSERT INTO attempts (user_id, quiz_id, started_at, deadline, total_marks, status) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, quizId, now, deadline, quiz.total_marks, 'in_progress']
    );

    await connection.commit();
    transactionOpen = false;

    // Fetch questions (without correct answers)
    const questions = await fetchQuestions(db, quizId);

    res.status(201).json({
      message: 'Quiz started successfully.',
      attempt: {
        id: result.insertId,
        started_at: now,
        deadline,
        status: 'in_progress',
      },
      quiz: { id: quiz.id, title: quiz.title, subject: quiz.subject, exam_type: quiz.exam_type, duration: quiz.duration, total_marks: quiz.total_marks, passing_marks: quiz.passing_marks },
      questions,
      saved_answers: [],
    });
  } catch (err) {
    if (connection && transactionOpen) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        err.rollbackError = rollbackError;
      }
    }
    next(err);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * POST /api/quizzes/attempts/:id/answer — Save a single answer (auto-save)
 */
async function saveAnswer(req, res, next) {
  let connection;
  let transactionOpen = false;
  try {
    const attemptId = Number(req.params.id);
    if (!Number.isSafeInteger(attemptId) || attemptId < 1) throw new AppError('Invalid attempt ID.', 400);

    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionOpen = true;
    const [attempts] = await connection.query(
      'SELECT * FROM attempts WHERE id = ? AND user_id = ? FOR UPDATE',
      [attemptId, req.user.id]
    );
    if (attempts.length === 0) {
      throw new AppError('Attempt not found or already submitted.', 404);
    }
    const attempt = attempts[0];
    if (attempt.status !== 'in_progress') throw new AppError('Attempt not found or already submitted.', 404);

    const now = new Date();
    const deadline = new Date(attempt.deadline);
    if (now >= deadline) {
      const score = await gradeAttempt(connection, attemptId, attempt.quiz_id);
      await connection.query(
        'UPDATE attempts SET status = ?, submitted_at = ?, score = ? WHERE id = ?',
        ['expired', deadline, score, attemptId]
      );
      await connection.commit();
      transactionOpen = false;
      return res.status(410).json({ error: 'Time is up! Your quiz has expired.' });
    }

    await saveValidatedAnswer(connection, attemptId, attempt.quiz_id, req.body, now);
    await connection.commit();
    transactionOpen = false;

    res.json({ message: 'Answer saved.' });
  } catch (err) {
    if (connection && transactionOpen) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * POST /api/attempts/:id/submit — Submit quiz and calculate score
 */
async function submitQuiz(req, res, next) {
  let connection;
  let transactionOpen = false;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionOpen = true;

    const attemptId = Number(req.params.id);
    if (!Number.isSafeInteger(attemptId) || attemptId < 1) throw new AppError('Invalid attempt ID.', 400);

    const [attempts] = await connection.query(
      `SELECT a.*, q.passing_marks
       FROM attempts a
       JOIN quizzes q ON q.id = a.quiz_id
       WHERE a.id = ? AND a.user_id = ?
       FOR UPDATE`,
      [attemptId, req.user.id]
    );
    if (attempts.length === 0) {
      throw new AppError('Attempt not found.', 404);
    }
    const attempt = attempts[0];
    if (attempt.status !== 'in_progress') {
      throw new AppError('This attempt has already been submitted or expired.', 400);
    }

    const now = new Date();
    const deadline = new Date(attempt.deadline);
    const expired = now >= deadline;
    const submittedAt = expired ? deadline : now;

    // A late submit only grades answers already saved before the deadline.
    if (!expired && req.body.answers !== undefined) {
      if (!Array.isArray(req.body.answers)) throw new AppError('answers must be an array.', 400);
      for (const answer of req.body.answers) {
        await saveValidatedAnswer(connection, attemptId, attempt.quiz_id, answer, submittedAt);
      }
    }

    const score = await gradeAttempt(connection, attemptId, attempt.quiz_id);
    const status = expired ? 'expired' : 'submitted';

    await connection.query(
      'UPDATE attempts SET status = ?, submitted_at = ?, score = ? WHERE id = ?',
      [status, submittedAt, score, attemptId]
    );

    await connection.commit();
    transactionOpen = false;

    res.json({
      message: expired ? 'The deadline passed. Your saved answers were submitted.' : 'Quiz submitted successfully.',
      result: buildResult({
        attemptId,
        score,
        totalMarks: attempt.total_marks,
        passingMarks: attempt.passing_marks,
        submittedAt,
        status,
      }),
    });
  } catch (err) {
    if (connection && transactionOpen) await connection.rollback();
    next(err);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * GET /api/results — Student's result history
 */
async function getResults(req, res, next) {
  try {
    const [results] = await db.query(`
      SELECT a.id AS attempt_id, a.score, a.total_marks, a.submitted_at, a.status,
             a.started_at, a.deadline,
             q.title AS quiz_title, q.subject, q.exam_type, q.duration,
             q.passing_marks
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.user_id = ? AND a.status IN ('submitted', 'expired')
      ORDER BY a.submitted_at DESC
    `, [req.user.id]);

    res.json({ results });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/results/:attemptId — Detailed result for a specific attempt
 */
async function getResultDetail(req, res, next) {
  try {
    const attemptId = parseInt(req.params.attemptId);

    const [attempts] = await db.query(`
      SELECT a.*, q.title AS quiz_title, q.subject, q.exam_type, q.passing_marks
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.id = ? AND a.user_id = ? AND a.status IN ('submitted', 'expired')
    `, [attemptId, req.user.id]);

    if (attempts.length === 0) {
      throw new AppError('Result not found.', 404);
    }

    const attempt = attempts[0];

    // Get detailed answers with correct options
    const [answers] = await db.query(`
      SELECT q.id AS question_id, q.text AS question_text, q.explanation, q.difficulty, q.marks,
             aa.selected_option_id, aa.is_correct, aa.is_bookmarked,
             o_selected.label AS selected_label, o_selected.text AS selected_text,
             o_correct.label AS correct_label, o_correct.text AS correct_text,
             o_correct.id AS correct_option_id
      FROM questions q
      LEFT JOIN attempt_answers aa ON aa.question_id = q.id AND aa.attempt_id = ?
      LEFT JOIN options o_selected ON o_selected.id = aa.selected_option_id
      JOIN options o_correct ON o_correct.question_id = q.id AND o_correct.is_correct = 1
      WHERE q.quiz_id = ?
      ORDER BY q.position ASC
    `, [attemptId, attempt.quiz_id]);

    res.json({
      attempt: {
        id: attempt.id,
        score: attempt.score,
        total_marks: attempt.total_marks,
        submitted_at: attempt.submitted_at,
        started_at: attempt.started_at,
        status: attempt.status,
        quiz_title: attempt.quiz_title,
        subject: attempt.subject,
        exam_type: attempt.exam_type,
        passing_marks: attempt.passing_marks,
        passed: Number(attempt.score || 0) >= Number(attempt.passing_marks || 0),
        percentage: attempt.total_marks > 0 ? Math.round((attempt.score / attempt.total_marks) * 100) : 0,
      },
      answers,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/quizzes/leaderboard — Global leaderboard ranking all students
 */
async function getLeaderboard(req, res, next) {
  try {
    const [rankings] = await db.query(`
      SELECT u.id, u.name, u.avatar_url,
             COUNT(DISTINCT a.id) AS total_attempts,
             ROUND(AVG(CASE WHEN a.total_marks > 0 THEN (a.score / a.total_marks) * 100 ELSE 0 END), 1) AS avg_score,
             MAX(CASE WHEN a.total_marks > 0 THEN ROUND((a.score / a.total_marks) * 100) ELSE 0 END) AS best_score,
             SUM(a.score) AS total_score,
             SUM(a.total_marks) AS total_possible
      FROM users u
      JOIN attempts a ON a.user_id = u.id AND a.status = 'submitted'
      WHERE u.role = 'student'
      GROUP BY u.id
      HAVING total_attempts > 0
      ORDER BY avg_score DESC, total_attempts DESC
      LIMIT 50
    `);

    // Add rank numbers
    const leaderboard = rankings.map((r, i) => ({
      rank: i + 1,
      ...r,
    }));

    res.json({ leaderboard });
  } catch (err) {
    next(err);
  }
}

module.exports = { listQuizzes, getQuiz, startQuiz, saveAnswer, submitQuiz, getResults, getResultDetail, getLeaderboard };
