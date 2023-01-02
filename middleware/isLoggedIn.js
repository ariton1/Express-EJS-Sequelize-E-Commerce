function isLoggedIn(req, res, next) {
	// Check if there is a token in cookie (if the user is logged in)
	if (req.cookies.token) {
	  // If the user is logged in, call the next middleware or route handler
	  return next();
	}
  
	// If the user is not logged in, redirect them to the login page
	return res.redirect("/users/login");
  };

module.exports = isLoggedIn;