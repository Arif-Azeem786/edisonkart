const fs = require('fs');
const path = require('path');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      // Return 200 with a clear message instead of 401 to avoid frontend "Request failed with status code 401" errors.
      return res.status(200).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Treat EMPLOYEE and VENDOR as ADMIN for access control
    const userRole = (req.user.role || '').toUpperCase();
    const effectiveRole = (userRole === 'EMPLOYEE' || userRole === 'VENDOR') ? 'ADMIN' : userRole;
    
    const requiredRoles = roles.map(r => r.toUpperCase());

    // Debug logging to a file since we can't see console easily
    const debugInfo = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      user: req.user,
      effectiveRole,
      requiredRoles,
      passed: requiredRoles.includes(effectiveRole)
    };
    
    try {
      fs.appendFileSync(path.join(__dirname, '../../debug_role.log'), JSON.stringify(debugInfo) + '\n');
    } catch (err) {
      // ignore logging errors
    }

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