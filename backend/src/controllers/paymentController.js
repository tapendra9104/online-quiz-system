// ============================================================
// Payment Controller — Payments + Subscription Unlock
// ============================================================
const pool = require('../config/db');
const crypto = require('crypto');

// Razorpay setup (optional)
let Razorpay = null;
let razorpayInstance = null;
try {
  Razorpay = require('razorpay');
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay payment gateway initialized');
  }
} catch (e) {
  console.log('ℹ️  Razorpay SDK not installed. Using demo payment mode.');
}

// Product → plan_type mapping
const PLAN_MAP = {
  'pro_plan': 'pro',
  'enterprise_plan': 'enterprise',
};

/** Calculate expiry: monthly plans = 30 days, offers = 365 days */
function getExpiry(productId) {
  const now = new Date();
  if (productId.includes('plan')) {
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  }
  return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
}

/**
 * Activate subscription after successful payment
 */
async function activateSubscription(userId, productId, productName, paymentId) {
  const planType = PLAN_MAP[productId] || 'offer';
  const expiresAt = getExpiry(productId);

  try {
    // Deactivate any existing same-product subscription
    await pool.query(
      `UPDATE user_subscriptions SET status = 'expired' WHERE user_id = ? AND product_id = ? AND status = 'active'`,
      [userId, productId]
    );

    // Create new active subscription
    await pool.query(
      `INSERT INTO user_subscriptions (user_id, product_id, product_name, plan_type, status, payment_id, expires_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?)`,
      [userId, productId, productName, planType, paymentId, expiresAt]
    );

    console.log(`✅ Subscription activated: user=${userId}, product=${productId}, plan=${planType}`);
    return { plan_type: planType, expires_at: expiresAt };
  } catch (err) {
    console.error('Subscription activation error:', err);
    return null;
  }
}

/**
 * POST /api/payments/create-order
 */
exports.createOrder = async (req, res) => {
  const { product_id, product_name, amount } = req.body;

  if (!product_id || !product_name || !amount) {
    return res.status(400).json({ message: 'Product ID, name, and amount are required.' });
  }

  if (razorpayInstance) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: { product_id, product_name, user_id: req.user.id },
      });
      return res.json({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        razorpay_key_id: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err) {
      console.error('Razorpay order creation failed:', err);
      return res.status(500).json({ message: 'Payment gateway error.' });
    }
  } else {
    return res.json({
      order_id: 'demo_order_' + Date.now().toString(36),
      amount: amount * 100,
      currency: 'INR',
      razorpay_key_id: 'demo_key',
      demo: true,
    });
  }
};

/**
 * POST /api/payments/verify — Razorpay signature verification
 */
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, product_id, product_name, amount } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification data missing.' });
  }

  if (razorpayInstance) {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature.' });
    }
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO payments (user_id, payment_id, order_id, amount, currency, product_id, product_name, status, payment_method)
       VALUES (?, ?, ?, ?, 'INR', ?, ?, 'completed', 'razorpay')`,
      [req.user.id, razorpay_payment_id, razorpay_order_id, amount || 0, product_id || '', product_name || 'Razorpay']
    );

    // Activate subscription
    const sub = await activateSubscription(req.user.id, product_id || '', product_name || '', result.insertId);

    return res.json({
      message: 'Payment verified and subscription activated.',
      payment: {
        id: result.insertId,
        payment_id: razorpay_payment_id,
        product_name,
        amount,
        status: 'completed',
        subscription: sub,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Payment save error:', err);
    return res.status(500).json({ message: 'Failed to save payment record.' });
  }
};

/**
 * POST /api/payments/record — Demo card payment
 */
exports.recordPayment = async (req, res) => {
  const { product_id, product_name, amount, payment_method, card_last_four, card_holder_name } = req.body;

  if (!product_id || !product_name || !amount) {
    return res.status(400).json({ message: 'Product details required.' });
  }

  const paymentId = 'QM_' + Date.now().toString(36).toUpperCase();

  try {
    const [result] = await pool.query(
      `INSERT INTO payments (user_id, payment_id, order_id, amount, currency, product_id, product_name, status, payment_method, card_last_four, card_holder_name)
       VALUES (?, ?, ?, ?, 'INR', ?, ?, 'completed', ?, ?, ?)`,
      [req.user.id, paymentId, 'order_' + Date.now().toString(36), amount, product_id, product_name, payment_method || 'card', card_last_four || '****', card_holder_name || 'N/A']
    );

    // ★ Activate subscription for this purchase
    const sub = await activateSubscription(req.user.id, product_id, product_name, result.insertId);

    return res.json({
      message: 'Payment recorded and subscription activated.',
      payment: {
        id: result.insertId,
        payment_id: paymentId,
        product_name,
        amount,
        status: 'completed',
        demo: true,
        card_last_four: card_last_four || '****',
        subscription: sub,
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Payment record error:', err);
    return res.status(500).json({ message: 'Failed to record payment.' });
  }
};

/**
 * GET /api/payments/history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const [payments] = await pool.query(
      `SELECT id, payment_id, order_id, amount, currency, product_id, product_name, status, payment_method, card_last_four, card_holder_name, created_at
       FROM payments WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ payments });
  } catch (err) {
    console.error('Payment history error:', err);
    return res.status(500).json({ message: 'Failed to load payment history.' });
  }
};

/**
 * GET /api/payments/subscriptions
 * Returns all active subscriptions for the logged-in user
 */
exports.getSubscriptions = async (req, res) => {
  try {
    const [subs] = await pool.query(
      `SELECT s.id, s.product_id, s.product_name, s.plan_type, s.status, s.activated_at, s.expires_at,
              p.amount, p.payment_id
       FROM user_subscriptions s
       LEFT JOIN payments p ON s.payment_id = p.id
       WHERE s.user_id = ? AND s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > NOW())
       ORDER BY s.activated_at DESC`,
      [req.user.id]
    );

    // Determine highest plan
    let currentPlan = 'free';
    for (const sub of subs) {
      if (sub.plan_type === 'enterprise') { currentPlan = 'enterprise'; break; }
      if (sub.plan_type === 'pro') currentPlan = 'pro';
    }

    return res.json({
      subscriptions: subs,
      current_plan: currentPlan,
      is_pro: currentPlan === 'pro' || currentPlan === 'enterprise',
      is_enterprise: currentPlan === 'enterprise',
    });
  } catch (err) {
    console.error('Subscriptions error:', err);
    return res.status(500).json({ message: 'Failed to load subscriptions.' });
  }
};

/**
 * GET /api/payments/profile
 * Returns user profile with badges and subscription info
 */
exports.getProfile = async (req, res) => {
  try {
    // Get user info
    const [[user]] = await pool.query(
      `SELECT id, name, email, role, created_at FROM users WHERE id = ?`,
      [req.user.id]
    );

    // Get active subscriptions
    const [subs] = await pool.query(
      `SELECT product_id, product_name, plan_type, activated_at, expires_at
       FROM user_subscriptions WHERE user_id = ? AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())`,
      [req.user.id]
    );

    // Get quiz stats
    const [[stats]] = await pool.query(
      `SELECT COUNT(*) as total_attempts,
              COALESCE(AVG(CASE WHEN total_marks > 0 THEN (score/total_marks)*100 ELSE 0 END), 0) as avg_score,
              COALESCE(SUM(score), 0) as total_score,
              COALESCE(MAX(CASE WHEN total_marks > 0 THEN (score/total_marks)*100 ELSE 0 END), 0) as best_score
       FROM attempts WHERE user_id = ? AND status = 'submitted'`,
      [req.user.id]
    );

    // Get payment count
    const [[paymentStats]] = await pool.query(
      `SELECT COUNT(*) as total_payments, COALESCE(SUM(amount), 0) as total_spent FROM payments WHERE user_id = ? AND status = 'completed'`,
      [req.user.id]
    );

    // Determine plan & badges
    let currentPlan = 'free';
    const badges = [];

    for (const sub of subs) {
      if (sub.plan_type === 'enterprise') currentPlan = 'enterprise';
      else if (sub.plan_type === 'pro' && currentPlan !== 'enterprise') currentPlan = 'pro';
    }

    // Auto-assign badges
    if (currentPlan === 'pro') badges.push({ icon: '⭐', label: 'Pro Member', color: '#6C5CE7' });
    if (currentPlan === 'enterprise') badges.push({ icon: '💎', label: 'Enterprise', color: '#3B82F6' });
    if (stats.total_attempts >= 10) badges.push({ icon: '🎯', label: 'Quiz Master', color: '#1B8C5A' });
    if (stats.total_attempts >= 5) badges.push({ icon: '📝', label: 'Active Learner', color: '#F59E0B' });
    if (stats.best_score >= 90) badges.push({ icon: '🏆', label: 'Top Scorer', color: '#22C55E' });
    if (subs.length >= 3) badges.push({ icon: '🛒', label: 'Premium Buyer', color: '#EF4444' });
    if (stats.total_attempts >= 1) badges.push({ icon: '🚀', label: 'First Quiz', color: '#8B5CF6' });

    // Always give a badge
    if (badges.length === 0) badges.push({ icon: '👋', label: 'New Member', color: '#94A3B8' });

    return res.json({
      user: {
        ...user,
        current_plan: currentPlan,
        is_pro: currentPlan === 'pro' || currentPlan === 'enterprise',
      },
      badges,
      subscriptions: subs,
      stats: {
        total_attempts: stats.total_attempts,
        avg_score: Math.round(stats.avg_score),
        total_score: stats.total_score,
        best_score: Math.round(stats.best_score),
        total_payments: paymentStats.total_payments,
        total_spent: paymentStats.total_spent,
      },
    });
  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({ message: 'Failed to load profile.' });
  }
};
