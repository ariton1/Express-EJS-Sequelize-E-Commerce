// const db = require("../models");
// const Role = db.Role;
// const User = db.User;

function require2FA(req, res, next) {
	// Check if the user has 2FA enabled
	User.findOne({ where: { id: req.user.id } })
		.then((user) => {
			if (user.twoFactorEnabled) {
				// 2FA is enabled, allow the request to proceed
				next();
			} else {
				// 2FA is not enabled, redirect the user to the 2FA setup route
				res.redirect("/set-2fa");
			}
		})
		.catch((err) => {
			// Handle the error
			console.log(err);
		});
}
