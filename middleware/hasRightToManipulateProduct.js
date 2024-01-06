const getUserIdFromToken = require("../utils/getUserIdFromToken");

const db = require("../models");
const User = db.User;
const Role = db.Role;
const Product = db.Product;

async function hasRightToManipulateProduct(req, res, next) {
  const userId = getUserIdFromToken(req);
  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  const productId = req.params.productId;
  const product = await Product.findByPk(productId);

  if (!product) {
    req.flash("error", "Product not found");
    return res.redirect("/");
  }

  if (user.id === product.user_id || role.name === "admin" || role.name === "moderator") {
    next();
  } else {
    req.flash("error", "You don't have the right to manipulate this product");
    res.redirect("/");
  }
}

module.exports = hasRightToManipulateProduct;
