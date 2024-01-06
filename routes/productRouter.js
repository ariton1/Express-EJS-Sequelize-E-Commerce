const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");
const isNotBuyerOrBanned = require("../middleware/isNotBuyerOrBanned");
const hasRightToManipulateProduct = require("../middleware/hasRightToManipulateProduct");

const {
  renderCreateProduct,
  createProduct,
  renderMyProducts,
  renderProduct,
  renderEditProduct,
  editProduct,
  renderDeleteProduct,
  deleteProduct,
} = require("../controllers/productController");

router.get("/new", isLoggedIn, require2FA, isNotBuyerOrBanned, renderCreateProduct);

router.post(
  "/new",
  isLoggedIn,
  require2FA,
  isNotBuyerOrBanned,
  upload.single("image"),
  [
    check("name").isLength({ min: 10 }).withMessage("Name must be at least 10 characters"),
    check("ship_to").isLength({ min: 1 }).withMessage("Please select at least one region to ship to"),
  ],
  createProduct
);

router.get("/my-products", isLoggedIn, require2FA, isNotBuyerOrBanned, renderMyProducts);

router.get("/:productId", isLoggedIn, require2FA, renderProduct);
router.get("/:productId/edit", isLoggedIn, require2FA, hasRightToManipulateProduct, renderEditProduct);
router.post(
  "/:productId/edit",
  isLoggedIn,
  require2FA,
  hasRightToManipulateProduct,
  upload.single("image"),
  [
    check("name").isLength({ min: 10 }).withMessage("Name must be at least 10 characters"),
    check("ship_to").isLength({ min: 1 }).withMessage("Please select at least one region to ship to"),
  ],
  editProduct
);
router.get("/:productId/delete", isLoggedIn, require2FA, hasRightToManipulateProduct, renderDeleteProduct);
router.post("/:productId/delete", isLoggedIn, require2FA, hasRightToManipulateProduct, deleteProduct);

module.exports = router;
