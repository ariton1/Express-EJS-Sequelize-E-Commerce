const jwt = require("jsonwebtoken");

// Import the database models
const db = require("../models");
const User = db.User;
const Role = db.Role;

async function isAdmin(req, res, next) {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  // Fetch the user's role from the database
  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  if (role.name === "admin") {
    // User is an admin, continue with the request
    return next();
  }
  // If the user is not an admin, redirect them to an appropriate page
  res.redirect("/");
}

module.exports = isAdmin;
