const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    const effectiveRole = (userRole === 'EMPLOYEE' || userRole === 'VENDOR') ? 'ADMIN' : userRole;
    const requiredRoles = roles.map(r => r.toUpperCase());

    if (!requiredRoles.includes(effectiveRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
    }

    next();
  };
};

module.exports = { requireRole };
