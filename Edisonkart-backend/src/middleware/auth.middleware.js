const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      // Return 200 with a clear message instead of 401 to avoid frontend "Request failed with status code 401" errors.
      return res.status(200).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(200).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(200).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = { verifyToken };