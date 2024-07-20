const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST /borrow
// @desc    Borrow money
// @access  Private
router.post('/borrow', auth, async (req, res) => {
  const { amount, tenureMonths } = req.body;

  try {
    let user = await User.findById(req.user.id);

    // Calculate interest and monthly repayment
    const interestRate = 0.08;
    const totalAmount = amount * (1 + interestRate);
    const monthlyRepayment = totalAmount / tenureMonths;

    user.purchasePower += amount;

    await user.save();

    res.json({
      purchasePower: user.purchasePower,
      monthlyRepayment: monthlyRepayment.toFixed(2),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
