const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

// Import middlewares
const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");
const isBuyer = require("../middleware/isBuyer");
const hasPGPKey = require("../middleware/hasPGPKey");

const { renderApplyForVendor, applyForVendor } = require("../controllers/buyerController");

router.get("/apply-for-vendor", isLoggedIn, require2FA, isBuyer, hasPGPKey, renderApplyForVendor);
router.post("/apply-for-vendor", isLoggedIn, require2FA, isBuyer, hasPGPKey, [
  check("reason", "Please provide a reason for wanting to become a vendor (min 10 characters)").isLength({
    min: 10,
  }),
  check("products", "Please provide the products you plan on selling (min 5 characters)").isLength({
    min: 5,
  }),
  check("countries", "Please provide the countries you will ship to").not().isEmpty(),
  check("other_markets", "Please provide information about other markets you vend on (if any)")
    .not()
    .isEmpty(),
  check("links", "Please provide links to your other market profiles (if any)").not().isEmpty(),
  check("reason", "The reason answer should contain letters").matches(/^(?=.*[A-Za-z]).+$/),
  check("products", "The products should answer contain letters").matches(/^(?=.*[A-Za-z]).+$/),
  check("countries", "The countries should answer contain letters").matches(/^(?=.*[A-Za-z]).+$/),
  check("other_markets", "The other markets answer should contain letters").matches(/^(?=.*[A-Za-z]).+$/),
  applyForVendor,
]);

module.exports = router;
