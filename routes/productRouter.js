const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");
const isNotBuyerOrBanned = require("../middleware/isNotBuyerOrBanned");

const { renderCreateProduct, createProduct } = require("../controllers/productController");

router.get("/new", isLoggedIn, require2FA, isNotBuyerOrBanned, renderCreateProduct);

router.post(
  "/new",
  [
    check("name").isLength({ min: 10 }).withMessage("Name must be at least 10 characters"),
    check("ship_to").isArray({ min: 1 }).withMessage("Please select at least one region to ship to"),
  ],
  isLoggedIn,
  require2FA,
  isNotBuyerOrBanned,
  upload.single("image"),
  createProduct
);

module.exports = router;
