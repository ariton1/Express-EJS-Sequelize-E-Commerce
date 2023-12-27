const fs = require("fs");
const path = require("path");
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

  try {
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
    // Should check in what names the products are normally saved at other places
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
  } catch (error) {
    req.flash("error", `Failed to create the product, error: ${error}`);
    res.redirect("/product/new");
  }
};
