const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { check, validationResult, body } = require("express-validator");

// Import middlewares
const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");
const isBuyer = require("../middleware/isBuyer");
const hasPGPKey = require("../middleware/hasPGPKey");

// Import the database models
const db = require("../models");
const User = db.User;
const VendorApplication = db.VendorApplication;
const Role = db.Role;

router.get("/apply-for-vendor", isLoggedIn, require2FA, isBuyer, hasPGPKey, async (req, res) => {
  // Get and Verify the JWT
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  // check if the user already has an application
  const application = await VendorApplication.findOne({ where: { user_id: userId, status: "pending" } });
  if (application) {
    if (application.status === "pending") {
      req.flash("error", "You have already submitted an application for review.");
      return res.redirect("/users/settings");
    }
  }

  // check if the user has reached the maximum number of applications
  const applicationCount = await VendorApplication.count({ where: { user_id: userId } });
  if (applicationCount >= 3) {
    req.flash("error", "You have reached the maximum number of applications allowed.");
    return res.redirect("/users/settings");
  }
  // Fetch the user's profile data from the database using their id
  const user = await User.findOne({ where: { id: userId } });

  // Fetch the user's role
  const role = await Role.findOne({ where: { id: user.roleId } });

  // Fetch all applications made by user
  const applications = await VendorApplication.findAll({ where: { user_id: userId } });

  res.render("buyer/apply-for-vendor", {
    user: user,
    role: role,
    application: application,
    flash: req.flash(),
    applications,
  });
});

router.post(
  "/apply-for-vendor",
  isLoggedIn,
  require2FA,
  isBuyer,
  hasPGPKey,
  [
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
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash(
        "error",
        errors.array().map((error) => error.msg)
      );
      return res.redirect("/buyer/apply-for-vendor");
    } else {
      // Get and Verify the JWT
      const token = req.cookies.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // check if the user already has an application
      const application = await VendorApplication.findOne({ where: { user_id: userId, status: "pending" } });
      if (application) {
        req.flash("error", "You have already submitted an application for review.");
        return res.redirect("/buyer/apply-for-vendor");
      }

      // check if the user has reached the maximum number of applications
      const applicationCount = await VendorApplication.count({ where: { user_id: userId } });
      if (applicationCount >= 3) {
        req.flash("error", "You have reached the maximum number of applications allowed.");
        return res.redirect("/users/settings");
      }
      // Generate an UUID for the newly created user
      const uuid = require("uuid");
      const vendor_application_id = uuid.v4();

      VendorApplication.create({
        id: vendor_application_id,
        user_id: userId,
        reason: req.body.reason,
        products: req.body.products,
        countries: req.body.countries,
        other_markets: req.body.other_markets,
        links: req.body.links,
        status: "pending",
      }).then(() => {
        req.flash("success", "Your application has been submitted successfully!");
        return res.redirect("/users/settings");
      });
    }
  }
);

module.exports = router;
