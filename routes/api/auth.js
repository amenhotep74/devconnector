const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route GET api/users
// @desc Test route
router.get('/', auth, async (req, res) => {
  try {
    // Find user with id extracted from the JWT payload in middleware auth, dont return password.
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route POST api/auth
// @desc Authenticate user & get token
// @access Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // if any errors collected from validation send them in json
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // find user in db with email
      let user = await User.findOne({ email: email });
      // if there is a user in db with that email send error
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }
      // compare hashed password with password from the DB
      const isMatch = await bcrypt.compare(password, user.password);

      // password is wrong
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid Credentials' }] });
      }

      // extract the user.id which will be the payload for the JWT
      const payload = {
        user: {
          id: user.id,
        },
      };

      // Change back to 3600 (1hour)
      jwt.sign(
        payload,
        config.get('jwtSecret'),
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
