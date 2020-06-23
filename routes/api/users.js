const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// @route GET api/users
// @desc Test route
router.get('/', (req, res) => res.send('User route'));

// @route POST api/users
// @desc Register user
// @access Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // if any errors collected from validation send them in json
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // find user in db with email
      let user = await User.findOne({ email: email });
      // if there is a user in db with that email send error
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });
      // create new user object ready to insert into DB
      user = new User({
        name,
        email,
        avatar,
        password,
      });
      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      // Hash password
      user.password = await bcrypt.hash(password, salt);

      // save to DB
      await user.save();

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
