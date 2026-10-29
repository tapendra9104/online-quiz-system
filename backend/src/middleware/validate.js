// ============================================================
// Request Validation Middleware
// ============================================================

/**
 * Factory: returns middleware that validates req.body against a schema.
 * Schema is an object of { field: { required, type, min, max, pattern, message } }
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(rules.message || `${field} is required.`);
        continue;
      }
      if (value === undefined || value === null) continue;

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string.`);
      }
      if (rules.type === 'number' && (typeof value !== 'number' || isNaN(value))) {
        errors.push(`${field} must be a number.`);
      }
      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push(`${field} must be an array.`);
      }
      if (rules.min !== undefined && typeof value === 'string' && value.length < rules.min) {
        errors.push(`${field} must be at least ${rules.min} characters.`);
      }
      if (rules.max !== undefined && typeof value === 'string' && value.length > rules.max) {
        errors.push(`${field} must be at most ${rules.max} characters.`);
      }
      if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}.`);
      }
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push(rules.message || `${field} format is invalid.`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed.', details: errors });
    }
    next();
  };
}

module.exports = { validate };
