const getUserIdFromToken = require("../utils/getUserIdFromToken");

const db = require("../models");
const User = db.User;
const Role = db.Role;

async function isBuyer(req, res, next) {
  const userId = getUserIdFromToken(req);

  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  if (role.name === "buyer") {
    return next();
  }
  res.redirect("/");
}

module.exports = isBuyer;
