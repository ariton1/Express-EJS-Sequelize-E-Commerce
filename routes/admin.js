const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");

// Import middlewares
const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");
const isAdmin = require("../middleware/isAdmin");

// Import the database models
const db = require("../models");
const User = db.User;
const Role = db.Role;
const VendorApplication = db.VendorApplication;
const { Op } = require("sequelize");

// Render the admin dashboard
router.get("/dashboard", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  // Get and Verify the JWT
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  // Fetch the user's profile data from the database using their id
  const user = await User.findOne({ where: { id: userId } });

  //Fetch the user's role
  const role = await Role.findOne({ where: { id: user.roleId } });

  res.render("admin/dashboard", {
    user: user,
    role: role,
    flash: req.flash(),
  });
});

router.get("/dashboard/all-users", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  try {
    let { search, sortBy, sortOrder } = req.query;
    if (req.query.sort) {
      [sortBy, sortOrder] = req.query.sort.split("|");
    }
    sortBy = sortBy || "createdAt";
    sortOrder = sortOrder || "DESC";
    // console.log(req.query.sortBy);
    console.log(req.query.sortOrder);

    let where = {}; // Default search query

    // Check if a search parameter is passed in the query string
    if (search) {
      where = {
        username: { [Op.like]: `%${search}%` },
      };
    }

    let order = [["createdAt", "DESC"]]; // Default sort order

    // Check if a sort parameter is passed in the query string
    if (sortBy && sortOrder) {
      // Determine sort order (ASC or DESC)
      let sortOrderParam = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

      // Determine sort column based on the sortBy parameter
      switch (sortBy) {
        case "createdAt":
          order = [["createdAt", sortOrderParam]];
          break;
        case "updatedAt":
          order = [["updatedAt", sortOrderParam]];
          break;
        case "username":
          order = [["username", sortOrderParam]];
          break;
        default:
          order = [["createdAt", sortOrderParam]];
          break;
      }
    }

    console.log("orderrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr: ", order);

    // Fetch all users from the database with their associated role
    const users = await User.findAll({
      include: [{ model: Role, as: "role" }],
      where,
      order,
    });

    res.render("admin/all-users", {
      title: "All Users",
      flash: req.flash(),
      users,
      query: { search, sortBy, sortOrder },
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to fetch users.");
    res.redirect("/admin/dashboard/all-users");
  }
});

// GET request to display all pending vendor applications
router.get("/dashboard/pending-applications", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  // Get and Verify the JWT
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  // Fetch the user's profile data from the database using their id
  const user = await User.findOne({ where: { id: userId } });

  //Fetch the user's role
  const role = await Role.findOne({ where: { id: user.roleId } });

  try {
    // Fetch all pending vendor applications from the database
    const applications = await VendorApplication.findAll({
      include: [
        {
          model: User,
          attributes: ["username"],
        },
      ],
      where: { status: "pending" },
      order: [["createdAt", "ASC"]],
    });

    res.render("admin/pending-applications", {
      applications: applications,
      user: user,
      role: role,
      flash: req.flash(),
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

// GET request to display all vendor applications
router.get("/dashboard/all-applications", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  // Get and Verify the JWT
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  // Fetch the user's profile data from the database using their id
  const user = await User.findOne({ where: { id: userId } });

  //Fetch the user's role
  const role = await Role.findOne({ where: { id: user.roleId } });

  try {
    // Fetch all vendor applications from the database
    const applications = await VendorApplication.findAll({
      include: [
        {
          model: User,
          attributes: ["username"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.render("admin/all-applications", {
      applications: applications,
      user: user,
      role: role,
      flash: req.flash(),
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

router.get("/application/:id", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  // Get and Verify the JWT
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  // Fetch the user's profile data from the database using their id
  const user = await User.findOne({ where: { id: userId } });

  //Fetch the user's role
  const role = await Role.findOne({ where: { id: user.roleId } });

  // Find the application with the given ID
  VendorApplication.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: User,
        attributes: ["username", "id"],
      },
    ],
  })
    .then((application) => {
      res.render("admin/application", {
        user: user,
        role: role,
        flash: req.flash(),
        application,
      });
    })
    .catch((err) => {
      res.status(500).send("Server Error");
    });
});

router.post("/application/:id/approve", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  VendorApplication.findOne({
    where: { id: req.params.id },
    include: [
      {
        model: User,
        attributes: ["username", "id", "roleId"],
      },
    ],
  })
    .then((application) => {
      if (!application) {
        // Handle error
        res.send("Vendor Application not found");
      } else {
        application.status = "approved";
        application.User.roleId = 2;
        application.save();
        application.User.save();
        req.flash("success", "User approved successfully!");
        res.redirect("/admin/dashboard/pending-applications");
        return;
      }
    })
    .catch((err) => {
      res.send(err);
    });
});

router.post(
  "/application/:id/reject",
  isLoggedIn,
  require2FA,
  isAdmin,
  [check("rejection_reason", "Rejection reason is required").not().isEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash(
        "error",
        errors.array().map((error) => error.msg)
      );
      return res.redirect(`/admin/application/${req.params.id}`);
    }

    // Find the application with the given ID
    await VendorApplication.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: User,
          attributes: ["username", "id"],
        },
      ],
    })
      .then((application) => {
        if (!application) {
          // Handle error
          res.send("Application not found");
        } else {
          // Update the application status to "rejected"
          application.status = "rejected";
          // Assign the rejection reason to the application
          application.rejection_reason = req.body.rejection_reason;
          application.save();

          req.flash("error", "User rejected successfully!");
          res.redirect("/admin/dashboard/pending-applications");
          return;
        }
      })
      .catch((err) => {
        res.send(err);
      });
  }
);

module.exports = router;
