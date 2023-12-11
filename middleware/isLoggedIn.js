function isLoggedIn(req, res, next) {
  // Check if there is a token in cookie (if the user is logged in)
  if (req.cookies.token) {
    return next();
  }
  return res.redirect("/users/login");
}

module.exports = isLoggedIn;
