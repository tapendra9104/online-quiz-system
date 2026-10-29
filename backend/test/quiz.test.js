const test = require('node:test');
const assert = require('node:assert/strict');
const { buildResult, scoreAnswerRows, validateOptions } = require('../src/utils/quiz');

test('question options require two choices and exactly one correct choice', () => {
  assert.equal(validateOptions([{ label: 'A', text: 'one', is_correct: true }]), 'At least 2 options are required.');
  assert.equal(validateOptions([
    { label: 'A', text: 'one', is_correct: true },
    { label: 'B', text: 'two', is_correct: true },
  ]), 'Exactly one option must be marked correct.');
  assert.equal(validateOptions([
    { label: 'A', text: 'one', is_correct: true },
    { label: 'A', text: 'two', is_correct: false },
  ]), 'Option labels must be unique.');
  assert.equal(validateOptions([
    { label: 'A', text: 'one', is_correct: true },
    { label: 'B', text: 'two', is_correct: false },
  ]), null);
});

test('score calculation adds marks only for correct answers', () => {
  assert.equal(scoreAnswerRows([
    { is_correct: 1, marks: 2 },
    { is_correct: true, marks: 3 },
    { is_correct: 0, marks: 9 },
  ]), 5);
});

test('result pass/fail uses the configured passing marks', () => {
  const result = buildResult({
    attemptId: 8,
    score: 2,
    totalMarks: 4,
    passingMarks: 3,
    submittedAt: new Date('2026-01-01T00:00:00Z'),
    status: 'submitted',
  });
  assert.equal(result.percentage, 50);
  assert.equal(result.passed, false);
  assert.equal(result.status, 'submitted');
});

test('expired result payload preserves the expired status', () => {
  const result = buildResult({
    attemptId: 9,
    score: 1,
    totalMarks: 4,
    passingMarks: 2,
    submittedAt: new Date('2026-01-01T00:00:00Z'),
    status: 'expired',
  });
  assert.equal(result.status, 'expired');
  assert.equal(result.passed, false);
});
