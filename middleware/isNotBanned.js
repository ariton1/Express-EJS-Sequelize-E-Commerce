const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.User;

async function isNotBanned(req, res, next) {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  const user = await User.findOne({ where: { id: userId } });

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (user.is_banned) {
    return res.render("banned", {
      reason: user.banned_reason,
    });
  }

  next();
}

module.exports = isNotBanned;
