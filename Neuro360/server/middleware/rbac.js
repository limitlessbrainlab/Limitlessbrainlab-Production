/**
 * Role-Based Access Control Middleware
 * Enforces role restrictions on endpoints
 */

/**
 * Middleware factory to require specific role(s)
 * @param {string|array} allowedRoles - Single role or array of roles
 * @returns {function} Express middleware
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Normalize allowedRoles to array
    const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Check if user's role is in allowed roles
    if (!rolesArray.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${rolesArray.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Middleware to check if user owns the resource
 * Used for patient-specific endpoints
 * @param {string} paramName - Name of the route param (e.g., 'patientId')
 */
const requireOwnership = (paramName = 'patientId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const resourceId = req.params[paramName];

    // Admin and clinic users can access any resource
    if (['admin', 'clinic'].includes(req.user.role)) {
      return next();
    }

    // Patient can only access own resources
    if (req.user.role === 'patient' && req.user.id !== resourceId) {
      return res.status(403).json({
        success: false,
        error: 'You can only access your own resources',
        code: 'OWNERSHIP_VIOLATION'
      });
    }

    next();
  };
};

/**
 * Middleware to check clinic ownership for clinic staff
 * @param {string} paramName - Name of the route param (e.g., 'clinicId')
 */
const requireClinicOwnership = (paramName = 'clinicId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const clinicId = req.params[paramName];

    // Admin can access any clinic
    if (req.user.role === 'admin') {
      return next();
    }

    // Clinic staff can only access own clinic
    if (req.user.role === 'clinic' && req.user.clinic_id !== clinicId) {
      return res.status(403).json({
        success: false,
        error: 'You can only access your own clinic resources',
        code: 'CLINIC_OWNERSHIP_VIOLATION'
      });
    }

    // Patients cannot access clinic endpoints
    if (req.user.role === 'patient') {
      return res.status(403).json({
        success: false,
        error: 'Patients cannot access clinic resources',
        code: 'INVALID_ROLE_FOR_ENDPOINT'
      });
    }

    next();
  };
};

/**
 * Middleware to ensure user has at least one of multiple permissions
 * @param {array} permissions - Array of permission strings
 */
const requirePermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `Required permission: ${permissions.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
  requireOwnership,
  requireClinicOwnership,
  requirePermission
};
