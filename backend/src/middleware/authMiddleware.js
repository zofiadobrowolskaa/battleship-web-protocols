const jwt = require('jsonwebtoken');

// middleware to protect routes and require authentication
const protect = (req, res, next) => {
  let token;

  // check if token exists in the cookies
  if (req.cookies && req.cookies.token) {
    try {
      // extract token from cookie object
      token = req.cookies.token;

      // verify token using JWT secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // attach decoded user info to request object (this makes user info available in the route handler)
      req.user = decoded;

      // call next() to continue to the protected route
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
