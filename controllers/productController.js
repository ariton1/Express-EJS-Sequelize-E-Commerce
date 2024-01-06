const fs = require("fs");
const path = require("path");
const uuid = require("uuid");
const sharp = require("sharp");
const { validationResult } = require("express-validator");

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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash(
      "error",
      errors.array().map((error) => error.msg)
    );
    return res.redirect("/product/new");
  }

  const { name, type, in_stock, quantity, ship_to, sub_products, unit, currency, source, subcategory_id } =
    req.body;

  if (!req.file) {
    req.flash("error", "Please upload an image");
    return res.redirect("/product/new");
  }

  const processedImage = await sharp(req.file.buffer)
    .resize({ width: 300, height: 300 })
    .withMetadata(false)
    .toBuffer();

  const productId = uuid.v4();
  const userId = getUserIdFromToken(req);

  // Create an 'uploads' folder if it doesn't exist
  const uploadFolder = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
  }

  // Create a 'productImages' subfolder if it doesn't exist
  const productImagesFolder = path.join(uploadFolder, "productImages");
  if (!fs.existsSync(productImagesFolder)) {
    fs.mkdirSync(productImagesFolder);
  }

  // Save the processed image to the 'productImages' folder with a unique filename
  // Should check in what names the products are saved at other places
  const imagePath = path.join(productImagesFolder, `${productId}.jpg`);
  fs.writeFileSync(imagePath, processedImage);

  await Product.create({
    id: productId,
    name,
    type,
    in_stock,
    quantity,
    ship_to,
    sub_products,
    image: imagePath,
    unit,
    currency,
    source,
    subcategory_id,
    sold: 0,
    user_id: userId,
  });

  res.redirect(`/product/${productId}`);
  req.flash("success", "Product was created successfully");
};

exports.renderProduct = async (req, res) => {
  const userId = getUserIdFromToken(req);
  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  const productId = req.params.productId;

  try {
    const product = await Product.findByPk(productId, {
      include: [
        {
          model: Subcategory,
          attributes: ["id", "name"],
        },
      ],
    });

    if (!product) {
      req.flash("error", "Product not found");
      return res.redirect("/");
    }

    res.render("product/details", { user, role, product, flash: req.flash(), path });
  } catch (error) {
    req.flash("error", "Failed to fetch product details");
    res.redirect("/");
  }
};

exports.renderEditProduct = async (req, res) => {
  const userId = getUserIdFromToken(req);
  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });
  const subcategories = await Subcategory.findAll();

  const productId = req.params.productId;
  const product = await Product.findOne({ where: { id: productId } });

  res.render("product/edit", {
    user,
    role,
    product,
    regions,
    units,
    currencies,
    subcategories,
    flash: req.flash(),
  });
};

exports.editProduct = async (req, res) => {
  const productId = req.params.productId;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash(
      "error",
      errors.array().map((error) => error.msg)
    );
    return res.redirect(`/product/${productId}`);
  }

  const { name, type, in_stock, quantity, ship_to, sub_products, unit, currency, source, subcategory_id } =
    req.body;

  const existingProduct = await Product.findByPk(productId);
  if (!existingProduct) {
    req.flash("error", "Product not found");
    return res.redirect("/");
  }

  // If there is a new image, process and save it
  if (req.file) {
    const processedImage = await sharp(req.file.buffer)
      .resize({ width: 300, height: 300 })
      .withMetadata(false)
      .toBuffer();

    const uploadFolder = path.join(__dirname, "..", "uploads");
    const productImagesFolder = path.join(uploadFolder, "productImages");

    const imagePath = path.join(productImagesFolder, `${productId}.jpg`);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    fs.writeFileSync(imagePath, processedImage);

    existingProduct.image = imagePath;
  }

  existingProduct.name = name;
  existingProduct.type = type;
  existingProduct.in_stock = in_stock;
  existingProduct.quantity = quantity;
  existingProduct.ship_to = ship_to;
  existingProduct.sub_products = sub_products;
  existingProduct.unit = unit;
  existingProduct.currency = currency;
  existingProduct.source = source;
  existingProduct.subcategory_id = subcategory_id;

  await existingProduct.save();

  req.flash("success", "Product was updated successfully");
  res.redirect(`/product/${productId}`);
};

exports.renderDeleteProduct = async (req, res) => {
  const userId = getUserIdFromToken(req);
  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  const productId = req.params.productId;
  const product = await Product.findOne({ where: { id: productId } });

  res.render("product/delete", { user, role, product, flash: req.flash() });
};

exports.deleteProduct = async (req, res) => {
  const productId = req.params.productId;
  await Product.destroy({ where: { id: productId } });

  req.flash("success", "Product was deleted successfully.");
  res.redirect("/");
};

exports.renderMyProducts = async (req, res) => {
  const userId = getUserIdFromToken(req);
  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  if (role.name !== "buyer") {
    const userProducts = await Product.findAll({ where: { user_id: userId } });

    res.render("product/my-products", {
      user,
      role,
      userProducts,
      flash: req.flash(),
    });
  } else {
    res.redirect("/");
  }
};
