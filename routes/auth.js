const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/User');

// @route    POST api/auth/signup
// @desc     Register user
// @access   Public
router.post(
  '/signup',
  [
    check('phone', 'Phone number is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('name', 'Name is required').not().isEmpty(),
    check('dob', 'Date of birth is required').not().isEmpty(),
    check('monthlySalary', 'Monthly salary is required and should be at least 25000').isInt({ min: 25000 }),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, email, name, dob, monthlySalary, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      const currentDate = new Date();
      const dobDate = new Date(dob);
      const age = currentDate.getFullYear() - dobDate.getFullYear();
      const monthDiff = currentDate.getMonth() - dobDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < dobDate.getDate())) {
        age--;
      }

      if (age < 20) {
        return res.status(400).json({ msg: 'User must be above 20 years of age' });
      }

      // Calculate purchase power
      const purchasePower = monthlySalary * 2;

      user = new User({
        phone,
        email,
        name,
        dob,
        monthlySalary,
        password,
        purchasePower, // Set purchase power based on monthly salary
        status: 'Approved'
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_KEY,
        { expiresIn: '5 days' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST /login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_KEY,
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;
