const getUserIdFromToken = require("../utils/getUserIdFromToken");

const db = require("../models");
const User = db.User;
const PGPKey = db.PGPKey;

async function hasPGPKey(req, res, next) {
  try {
    const userId = getUserIdFromToken(req);

    const user = await User.findOne({ include: [{ model: PGPKey, where: { user_id: userId } }] });
    const pgpKey = user.PGPKey;

    next();
  } catch (error) {
    req.flash("error", "Please add a PGP key before entering this page");
    return res.redirect("back");
  }
}

module.exports = hasPGPKey;
