const User = require("../models/User");

// Must run after authMiddleware. The role is read from the database on each
// request so promoting/demoting a user takes effect without a new token.
function authorizeRoles(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId).select("role");

      if (!user || !allowedRoles.includes(user.role)) {
        const error = new Error("You do not have permission to perform this action");
        error.status = 403;
        return next(error);
      }

      req.user.role = user.role;

      next();

    } catch (error) {
      next(error);
    }
  };
}

module.exports = authorizeRoles;
