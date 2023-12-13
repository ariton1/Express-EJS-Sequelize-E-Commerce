const uuid = require("uuid");
const sharp = require("sharp");

const getUserIdFromToken = require("../utils/getUserIdFromToken");

const db = require("../models");
const User = db.User;
const Role = db.Role;
const Product = db.Product;
const Subcategory = db.Subcategory;

const units = require("../data/units");
const regions = require("../data/regions");
const currencies = require("../data/currencies");

exports.renderCreateProduct = async (req, res) => {
  const userId = getUserIdFromToken(req);

  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });
  const subcategories = await Subcategory.findAll();

  res.render("product/new", { user, role, flash: req.flash(), regions, currencies, units, subcategories });
};

exports.createProduct = async (req, res) => {
  const {
    name,
    type,
    username,
    in_stock,
    quantity,
    ship_to,
    sub_products,
    unit,
    currency,
    source,
    subcategory_id,
  } = req.body;

  if (!req.file) {
    req.flash("error", "Please upload an image");
    return res.redirect("/product/new");
  }

  const processedImage = await sharp(req.file.buffer).resize({ width: 300, height: 300 }).toBuffer();

  try {
    const productId = uuid.v4();

    await Product.create({
      id: productId,
      name,
      type,
      username,
      in_stock,
      quantity,
      ship_to,
      sub_products,
      image: processedImage,
      unit,
      currency,
      source,
      subcategory_id,
      sold: 0,
      user_id: req.user.id,
    });

    // res.redirect(`/product/${newProduct.id}`);
    req.flash("success", "Product was created successfully");
    // res.redirect("/product/new");
  } catch (error) {
    console.error(error);
    req.flash("error", "Failed to create the product");
    res.redirect("/product/new");
  }
};
