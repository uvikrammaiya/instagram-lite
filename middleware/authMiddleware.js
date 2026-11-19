const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    const error = new Error("Authentication required");
    error.status = 401;
    return next(error);
  }

  try {
    const token = authHeader.split(" ")[1];

    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

  } catch (err) {
    const error = new Error("Invalid or expired token");
    error.status = 401;
    return next(error);
  }

  next();
}

module.exports = authMiddleware;
