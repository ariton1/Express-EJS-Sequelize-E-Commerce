const { validationResult } = require("express-validator");
const getUserIdFromToken = require("../utils/getUserIdFromToken");

const db = require("../models");
const User = db.User;
const Role = db.Role;
const VendorApplication = db.VendorApplication;

exports.renderApplyForVendor = async (req, res) => {
  const userId = getUserIdFromToken(req);

  // check if the user already has an application
  const application = await VendorApplication.findOne({ where: { user_id: userId, status: "pending" } });
  if (application) {
    if (application.status === "pending") {
      req.flash("error", "You have already submitted an application for review.");
      return res.redirect("/users/settings");
    }
  }

  const applicationCount = await VendorApplication.count({ where: { user_id: userId } });
  if (applicationCount >= 3) {
    req.flash("error", "You have reached the maximum number of applications allowed.");
    return res.redirect("/users/settings");
  }
  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  const applications = await VendorApplication.findAll({ where: { user_id: userId } });

  res.render("buyer/apply-for-vendor", {
    user: user,
    role: role,
    application: application,
    flash: req.flash(),
    applications,
  });
};

exports.applyForVendor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash(
      "error",
      errors.array().map((error) => error.msg)
    );
    return res.redirect("/buyer/apply-for-vendor");
  } else {
    const userId = getUserIdFromToken(req);

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
};
