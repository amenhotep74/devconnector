// Middleware to authenticate a JWT token before letting the user access a protected route.

const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token if there is one
  try {
    // Verify token with secret
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    req.user = decoded.user;
    next();
  } catch (err) {
    // if not valid
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
