function validateOptions(options) {
  if (!Array.isArray(options) || options.length < 2) {
    return 'At least 2 options are required.';
  }

  const labels = new Set();
  let correctCount = 0;

  for (const option of options) {
    if (!option || typeof option !== 'object') return 'Each option must be an object.';

    const label = typeof option.label === 'string' ? option.label.trim().toUpperCase() : '';
    const text = typeof option.text === 'string' ? option.text.trim() : '';
    if (!/^[A-Z]$/.test(label)) return 'Option labels must be one letter.';
    if (labels.has(label)) return 'Option labels must be unique.';
    if (!text) return `Option ${label} cannot be empty.`;
    if (typeof option.is_correct !== 'boolean') return `Option ${label} must specify whether it is correct.`;

    labels.add(label);
    if (option.is_correct) correctCount += 1;
  }

  if (correctCount !== 1) return 'Exactly one option must be marked correct.';
  return null;
}

function scoreAnswerRows(rows) {
  return rows.reduce((score, row) => {
    const isCorrect = row.is_correct === true || Number(row.is_correct) === 1;
    return score + (isCorrect ? Number(row.marks) || 0 : 0);
  }, 0);
}

function buildResult({ attemptId, score, totalMarks, passingMarks, submittedAt, status }) {
  const normalizedScore = Number(score) || 0;
  const normalizedTotal = Number(totalMarks) || 0;
  const normalizedPassing = Number(passingMarks) || 0;

  return {
    attempt_id: attemptId,
    score: normalizedScore,
    total_marks: normalizedTotal,
    passing_marks: normalizedPassing,
    percentage: normalizedTotal > 0 ? Math.round((normalizedScore / normalizedTotal) * 100) : 0,
    passed: normalizedScore >= normalizedPassing,
    submitted_at: submittedAt,
    status,
  };
}

module.exports = { validateOptions, scoreAnswerRows, buildResult };
