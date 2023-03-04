const jwt = require("jsonwebtoken");

function require2FA(req, res, next) {
  const db = require("../models");
  const User = db.User;
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  User.findOne({ where: { id: decoded.id } })
    .then((user) => {
      // If the user has already set up 2FA, redirect them to the home page
      if (user && user.twofactor_enabled) {
        return next();
      }
      return res.redirect("/users/set-2fa");
    })
    .catch((error) => {
      console.error(error);
      return res.status(500).send("An error occurred");
    });
}

module.exports = require2FA;
