require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

const backendDir = path.join(__dirname, '..');
const testDatabase = `online_quiz_system_e2e_${process.pid}_${Date.now()}`;
const port = 39000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const connectionOptions = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  timezone: '+00:00',
};

let connection;
let serverProcess;
let databaseCreated = false;

async function request(pathname, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function login(email, password) {
  const result = await request('/api/auth/login', { method: 'POST', body: { email, password } });
  assert.equal(result.status, 200, `login failed for ${email}: ${JSON.stringify(result.data)}`);
  return result.data;
}

async function waitForServer() {
  const expiresAt = Date.now() + 15000;
  while (Date.now() < expiresAt) {
    try {
      const result = await request('/api/health');
      if (result.status === 200) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('The test server did not become healthy within 15 seconds.');
}

async function getQuestionOptions(quizId) {
  const [rows] = await connection.query(`
    SELECT q.id AS question_id,
           (SELECT id FROM options WHERE question_id = q.id AND is_correct = 1 ORDER BY id LIMIT 1) AS correct_option_id,
           (SELECT id FROM options WHERE question_id = q.id AND is_correct = 0 ORDER BY id LIMIT 1) AS incorrect_option_id
    FROM questions q
    WHERE q.quiz_id = ?
    ORDER BY q.position
  `, [quizId]);
  return rows;
}

async function addQuestion(adminToken, quizId, { text, difficulty = 'medium', explanation = '', marks = 1 } = {}) {
  const result = await request(`/api/admin/quizzes/${quizId}/questions`, {
    method: 'POST',
    token: adminToken,
    body: {
      text,
      difficulty,
      explanation,
      marks,
      options: [
        { label: 'A', text: 'Correct option', is_correct: true },
        { label: 'B', text: 'Incorrect option', is_correct: false },
      ],
    },
  });
  assert.equal(result.status, 201, `question create failed: ${JSON.stringify(result.data)}`);
}

async function createQuiz(adminToken, { title, duration = 60, passingMarks, totalMarks, questions = 1 }) {
  const created = await request('/api/admin/quizzes', {
    method: 'POST',
    token: adminToken,
    body: {
      title,
      subject: 'E2E Test',
      exam_type: 'Practice',
      duration,
      passing_marks: passingMarks,
      total_marks: totalMarks,
      status: 'draft',
    },
  });
  assert.equal(created.status, 201, `quiz create failed: ${JSON.stringify(created.data)}`);
  const quizId = created.data.quiz.id;
  for (let index = 0; index < questions; index += 1) {
    await addQuestion(adminToken, quizId, {
      text: `Question ${index + 1} for ${title}`,
      explanation: index === 0 ? 'This is the stored answer explanation.' : '',
      difficulty: 'hard',
    });
  }
  const published = await request(`/api/admin/quizzes/${quizId}`, {
    method: 'PUT', token: adminToken, body: { status: 'published' },
  });
  assert.equal(published.status, 200, `quiz publish failed: ${JSON.stringify(published.data)}`);
  return quizId;
}

async function main() {
  connection = await mysql.createConnection({ ...connectionOptions, multipleStatements: true });
  const [existing] = await connection.query('SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?', [testDatabase]);
  assert.equal(existing.length, 0, 'Refusing to overwrite an existing E2E database.');

  await connection.query(`CREATE DATABASE \`${testDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  databaseCreated = true;
  const schemaPath = path.join(backendDir, '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8').replaceAll('online_quiz_system', testDatabase);
  await connection.query(schema);
  await connection.query(`USE \`${testDatabase}\``);

  serverProcess = spawn(process.execPath, ['src/app.js'], {
    cwd: backendDir,
    windowsHide: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      DB_NAME: testDatabase,
      PORT: String(port),
      JWT_SECRET: 'temporary-e2e-secret-change-me',
      NODE_ENV: 'test',
    },
  });
  await waitForServer();

  const health = await request('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.database, 'connected');
  assert.equal((await request('/api/quizzes')).status, 401, 'quiz routes require authentication');

  const admin = await login('admin@quiz.com', 'admin123');
  const seededStudent = await login('student@quiz.com', 'student123');
  assert.equal(admin.user.role, 'admin');
  assert.equal(seededStudent.user.role, 'student');

  const registration = await request('/api/auth/register', {
    method: 'POST',
    body: { name: 'E2E Student', email: `student-${process.pid}@example.test`, password: 'student-test-123', role: 'admin' },
  });
  assert.equal(registration.status, 201);
  assert.equal(registration.data.user.role, 'student', 'public registration cannot grant admin role');
  const duplicateRegistration = await request('/api/auth/register', {
    method: 'POST',
    body: { name: 'Duplicate Student', email: `student-${process.pid}@example.test`, password: 'student-test-123' },
  });
  assert.equal(duplicateRegistration.status, 409);
  const student = registration.data;

  const forbidden = await request('/api/admin/quizzes', { token: student.token });
  assert.equal(forbidden.status, 403, 'student cannot access admin routes');

  const firstQuiz = await request('/api/quizzes/1/start', { method: 'POST', token: student.token, body: {} });
  assert.equal(firstQuiz.status, 201);
  assert.equal(firstQuiz.data.quiz.passing_marks, 2);
  assert.ok(firstQuiz.data.questions.every(question => question.options.every(option => !('is_correct' in option))));

  const firstOptions = await getQuestionOptions(1);
  const crossQuestionAnswer = await request(`/api/quizzes/attempts/${firstQuiz.data.attempt.id}/answer`, {
    method: 'POST', token: student.token,
    body: { question_id: firstOptions[0].question_id, selected_option_id: firstOptions[1].correct_option_id },
  });
  assert.equal(crossQuestionAnswer.status, 400, 'an option from another question is rejected');

  const correctAnswers = firstOptions.map(row => ({
    question_id: row.question_id,
    selected_option_id: row.correct_option_id,
    is_bookmarked: false,
  }));
  const submitted = await request(`/api/quizzes/attempts/${firstQuiz.data.attempt.id}/submit`, {
    method: 'POST', token: student.token, body: { answers: correctAnswers },
  });
  assert.equal(submitted.status, 200);
  assert.equal(submitted.data.result.score, 4);
  assert.equal(submitted.data.result.passed, true);

  const detail = await request(`/api/quizzes/results/${firstQuiz.data.attempt.id}`, { token: student.token });
  assert.equal(detail.status, 200);
  assert.equal(detail.data.attempt.passed, true);

  const secondQuiz = await request('/api/quizzes/2/start', { method: 'POST', token: student.token, body: {} });
  assert.equal(secondQuiz.status, 201);
  assert.equal(secondQuiz.data.quiz.passing_marks, 3);
  const secondOptions = await getQuestionOptions(2);
  const halfScoreAnswers = secondOptions.map((row, index) => ({
    question_id: row.question_id,
    selected_option_id: index < 2 ? row.correct_option_id : row.incorrect_option_id,
    is_bookmarked: false,
  }));
  const halfScore = await request(`/api/quizzes/attempts/${secondQuiz.data.attempt.id}/submit`, {
    method: 'POST', token: student.token, body: { answers: halfScoreAnswers },
  });
  assert.equal(halfScore.data.result.percentage, 50);
  assert.equal(halfScore.data.result.passed, false, 'pass/fail uses the quiz passing marks');

  const metadataQuizId = await createQuiz(admin.token, {
    title: 'E2E Metadata Quiz', duration: 60, passingMarks: 1, totalMarks: 1,
  });
  const [metadata] = await connection.query('SELECT difficulty, explanation FROM questions WHERE quiz_id = ?', [metadataQuizId]);
  assert.equal(metadata[0].difficulty, 'hard');
  assert.equal(metadata[0].explanation, 'This is the stored answer explanation.');
  const metadataQuestions = await request(`/api/admin/quizzes/${metadataQuizId}/questions`, { token: admin.token });
  assert.equal(metadataQuestions.data.questions[0].difficulty, 'hard');
  assert.equal(metadataQuestions.data.questions[0].explanation, 'This is the stored answer explanation.');

  const metadataAttempt = await request(`/api/quizzes/${metadataQuizId}/start`, { method: 'POST', token: student.token, body: {} });
  const metadataOptions = await getQuestionOptions(metadataQuizId);
  const metadataSubmit = await request(`/api/quizzes/attempts/${metadataAttempt.data.attempt.id}/submit`, {
    method: 'POST', token: student.token,
    body: { answers: [{ question_id: metadataOptions[0].question_id, selected_option_id: metadataOptions[0].correct_option_id }] },
  });
  assert.equal(metadataSubmit.data.result.passed, true);
  const metadataDetail = await request(`/api/quizzes/results/${metadataAttempt.data.attempt.id}`, { token: student.token });
  assert.equal(metadataDetail.data.answers[0].explanation, 'This is the stored answer explanation.');

  const expiryQuizId = await createQuiz(admin.token, {
    title: 'E2E Deadline Quiz', duration: 60, passingMarks: 1, totalMarks: 1,
  });
  const expiryAttempt = await request(`/api/quizzes/${expiryQuizId}/start`, { method: 'POST', token: student.token, body: {} });
  const expiryOptions = await getQuestionOptions(expiryQuizId);
  await connection.query('UPDATE attempts SET deadline = DATE_SUB(NOW(), INTERVAL 1 SECOND) WHERE id = ?', [expiryAttempt.data.attempt.id]);
  const lateSubmit = await request(`/api/quizzes/attempts/${expiryAttempt.data.attempt.id}/submit`, {
    method: 'POST', token: student.token,
    body: { answers: [{ question_id: expiryOptions[0].question_id, selected_option_id: expiryOptions[0].correct_option_id }] },
  });
  assert.equal(lateSubmit.status, 200);
  assert.equal(lateSubmit.data.result.status, 'expired');
  assert.equal(lateSubmit.data.result.score, 0, 'answers sent after the deadline are ignored');

  const payment = await request('/api/payments/record', {
    method: 'POST', token: student.token,
    body: {
      product_id: 'e2e_demo_offer', product_name: 'E2E Demo Offer', amount: 25,
      payment_method: 'card', card_last_four: '4242', card_holder_name: 'E2E Student',
    },
  });
  assert.equal(payment.status, 200);
  assert.equal(payment.data.payment.demo, true);
  const paymentHistory = await request('/api/payments/history', { token: student.token });
  assert.equal(paymentHistory.data.payments.length, 1);
  const subscriptions = await request('/api/payments/subscriptions', { token: student.token });
  assert.equal(subscriptions.data.subscriptions.length, 1);

  console.log('E2E checks passed: seeded auth, registration, role guards, quiz lifecycle, answer ownership, grading, metadata, deadlines, and demo purchases.');
}

async function cleanup() {
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill('SIGTERM');
    await Promise.race([
      new Promise(resolve => serverProcess.once('exit', resolve)),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
  }
  if (connection) {
    try {
      if (databaseCreated) await connection.query(`DROP DATABASE \`${testDatabase}\``);
    } finally {
      await connection.end();
    }
  }
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}).finally(cleanup);
