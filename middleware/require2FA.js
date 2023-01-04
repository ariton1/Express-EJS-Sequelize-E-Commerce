const jwt = require("jsonwebtoken");

function require2FA(req, res, next) {
	const db = require("../models");
	const User = db.User;
	const token = req.cookies.token;
	const decoded = jwt.verify(token, process.env.JWT_SECRET);
	const user = User.findOne({ where: { id: decoded.id } });

	// If the user has already set up 2FA, redirect them to the home page
	if (user.twofactor_enabled) {
		return next();
	}
	return res.redirect("/users/set-2fa");
  };

module.exports = require2FA;