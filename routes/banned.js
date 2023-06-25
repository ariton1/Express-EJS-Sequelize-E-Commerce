const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const dayjs = require("dayjs");
const duration = require("dayjs/plugin/duration");
dayjs.extend(duration);

// Import the database models
const db = require("../models");
const User = db.User;
const Role = db.Role;

const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");
const isBanned = require("../middleware/isBanned");

router.get("/", isLoggedIn, require2FA, async (req, res) => {
  // Get and Verify the JWT
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });
  const reason = user.banned_reason;

  if (!user.is_banned) {
    return res.redirect("/");
  }

  const banExpiry = user.banned_until;
  const now = dayjs();

  const timeLeft = dayjs.duration(dayjs(banExpiry).diff(now));
  const years = timeLeft.years() ? `${timeLeft.years()} year${timeLeft.years() > 1 ? "s" : ""}, ` : "";
  const months = timeLeft.months() ? `${timeLeft.months()} month${timeLeft.months() > 1 ? "s" : ""}, ` : "";
  const days = timeLeft.days() ? `${timeLeft.days()} day${timeLeft.days() > 1 ? "s" : ""}, ` : "";
  const hours = timeLeft.hours() ? `${timeLeft.hours()} hour${timeLeft.hours() > 1 ? "s" : ""}, ` : "";
  const minutes = timeLeft.minutes()
    ? `${timeLeft.minutes()} minute${timeLeft.minutes() > 1 ? "s" : ""}, `
    : "";
  const seconds = timeLeft.seconds()
    ? `${timeLeft.seconds()} second${timeLeft.seconds() > 1 ? "s" : ""}`
    : "";

  const banTimeLeft = `${years}${months}${days}${hours}${minutes}${seconds}`;

  res.render("users/banned/banned", { reason: reason, timeleft: banTimeLeft, role });
});

module.exports = router;
