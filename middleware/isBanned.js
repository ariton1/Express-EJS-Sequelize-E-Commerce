async function isBanned(req, res, next) {
  const db = require("./models");
  const User = db.User;
  // Get and Verify the JWT
  const token = req.cookies.token;
  if (!token) {
    return res.redirect("/login");
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Check if the user is banned
    const user = await User.findOne({ where: { id: userId } });
    if (user.is_banned) {
      return res.redirect("/banned");
    }

    // Attach the user to the request object for later use
    req.user = user;
    next();
  } catch (error) {
    return res.redirect("/login");
  }
}

module.exports = isBanned;
