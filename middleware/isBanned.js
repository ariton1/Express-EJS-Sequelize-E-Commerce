const jwt = require("jsonwebtoken");

// Middleware to check if the user is banned
async function isBanned(req, res, next) {
  const db = require("../models");
  const User = db.User;

  // Get and Verify the JWT
  const token = req.cookies.token;

  // Check if the user is not logged in
  if (!token) {
    return res.redirect("/users/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Fetch the user from the database
    const user = await User.findOne({ where: { id: userId } });

    // Check if the user is banned
    if (user && user.is_banned) {
      // Redirect to the banned route
      return res.redirect("/banned");
    }

    req.user = user; // Attach the user object to the request
    next();
  } catch (error) {
    return res.redirect("/users/login");
  }
}

module.exports = isBanned;
