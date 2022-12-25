function require2FA(req, res, next) {
	if (req.user.twofactor_enabled) {
	  // Allow the request to proceed if 2FA is enabled
	  next();
	} else {
	  // Redirect the user back to the 2FA setup page if 2FA is not enabled
	  res.redirect('/users/set-up-2fa');
	}
  }