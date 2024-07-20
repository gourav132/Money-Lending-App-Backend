const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route    POST api/borrow
// @desc     Borrow money
// @access   Private
router.post('/', auth, async (req, res) => {
  const userId = req.user.id; // Assuming JWT middleware sets req.user
  const { amount, tenureMonths } = req.body;

  try {
    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if the user has sufficient Purchase Power
    if (user.purchasePower <= 0) {
      return res.status(400).json({ msg: 'Credit limit reached, cannot borrow more money' });
    }

    if (amount > user.purchasePower) {
      return res.status(400).json({ msg: `You can only borrow up to ${user.purchasePower}` });
    }

    // Calculate monthly interest rate
    const annualInterestRate = 0.08;
    const monthlyInterestRate = annualInterestRate / 12;

    // Calculate EMI using the formula
    const EMI = (amount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, tenureMonths)) /
                (Math.pow(1 + monthlyInterestRate, tenureMonths) - 1);

    // Update purchase power
    user.purchasePower -= amount;

    // Update total EMI
    user.totalEMI += EMI;

    // Save the updated user
    await user.save();

    // Respond with the updated purchase power and total monthly repayment amount
    res.json({
      purchasePower: user.purchasePower,
      monthlyRepayment: user.totalEMI.toFixed(2) // round to 2 decimal places
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
