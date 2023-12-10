const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

// Import middlewares
const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");
const isAdmin = require("../middleware/isAdmin");

// Import the database models
const db = require("../models");
const User = db.User;
const Role = db.Role;
const VendorApplication = db.VendorApplication;
const Category = db.Category;
const Subcategory = db.Subcategory;
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

// GET route to render the form for creating a new category
router.get("/dashboard/categories/create", isLoggedIn, require2FA, isAdmin, (req, res) => {
  res.render("admin/create-category", {
    flash: req.flash(),
  });
});

// POST route to handle the form submission and create a new category
router.post("/categories/create", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  try {
    // Extract category data from the request body
    const { name } = req.body;

    // Validate the data (you may add more validation)
    if (!name) {
      req.flash("error", "Category name is required.");
      return res.redirect("/categories/create");
    }

    // Create the category in the database
    await Category.create({
      name: name,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Add other fields if needed
    });

    req.flash("success", "Category created successfully.");
    res.redirect("/admin/dashboard/manage-categories"); // Redirect to the manage-categories page
  } catch (error) {
    console.error("Error creating category:", error);
    req.flash("error", "An error occurred while creating the category.");
    res.redirect("/categories/create");
  }
});

// GET route to render the form for creating a new subcategory
router.get("/dashboard/subcategories/create", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  // Fetch existing categories from the database (you may customize this based on your models)
  const categories = await Category.findAll();

  res.render("admin/create-subcategory", {
    categories: categories,
    flash: req.flash(),
  });
});

// POST route to handle the form submission and create a new subcategory
router.post("/subcategories/create", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  try {
    // Extract subcategory data from the request body
    const { name, category_id } = req.body;

    // Validate the data (you may add more validation)
    if (!name || !category_id) {
      req.flash("error", "Subcategory name and category are required.");
      return res.redirect("/subcategories/create");
    }

    // Create the subcategory in the database
    await Subcategory.create({
      name: name,
      category_id: category_id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    req.flash("success", "Subcategory created successfully.");
    res.redirect("/admin/dashboard/manage-categories"); // Redirect to the manage-categories page
  } catch (error) {
    console.error("Error creating subcategory:", error);
    req.flash("error", "An error occurred while creating the subcategory.");
    res.redirect("/subcategories/create");
  }
});

// Edit Category Route
router.get("/dashboard/categories/edit/:categoryId", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  // Fetch the category from the database based on categoryId
  const categoryId = req.params.categoryId;
  const category = await Category.findByPk(categoryId);

  if (!category) {
    req.flash("error", "Category not found");
    return res.redirect("/admin/dashboard/manage-categories");
  }

  // Render the page with the category data
  res.render("admin/edit-category", {
    title: "Edit Category",
    category: category,
    flash: req.flash(),
  });
});

// Handle POST requests for editing category
router.post("/dashboard/categories/edit/:categoryId", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  const categoryId = req.params.categoryId;
  const { categoryName } = req.body;

  try {
    // Find the category in the database
    const category = await Category.findByPk(categoryId);

    if (!category) {
      req.flash("error", "Category not found");
      return res.redirect("/admin/dashboard/manage-categories");
    }

    // Update the category name
    category.name = categoryName;

    // Save the changes to the database
    await category.save();

    req.flash("success", "Category updated successfully");
    res.redirect("/admin/dashboard/manage-categories");
  } catch (error) {
    console.error("Error updating category:", error);
    req.flash("error", "Error updating category");
    res.redirect("/admin/dashboard/manage-categories");
  }
});

// Delete Category Route
router.get("/dashboard/categories/delete/:categoryId", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  // Fetch the category from the database based on categoryId
  const categoryId = req.params.categoryId;
  const category = await Category.findByPk(categoryId);

  if (!category) {
    req.flash("error", "Category not found");
    return res.redirect("/admin/dashboard/manage-categories");
  }

  // Delete the category and its subcategories
  await category.destroy();

  req.flash("success", "Category and its subcategories deleted successfully");
  res.redirect("/admin/dashboard/manage-categories");
});

// Edit Subcategory Route
router.get(
  "/dashboard/subcategories/edit/:subcategoryId",
  isLoggedIn,
  require2FA,
  isAdmin,
  async (req, res) => {
    // Fetch the subcategory from the database based on subcategoryId
    const subcategoryId = req.params.subcategoryId;
    const subcategory = await Subcategory.findByPk(subcategoryId);

    if (!subcategory) {
      req.flash("error", "Subcategory not found");
      return res.redirect("/admin/dashboard/manage-categories");
    }

    // Render the page with the subcategory data
    res.render("admin/edit-subcategory", {
      title: "Edit Subcategory",
      subcategory: subcategory,
      flash: req.flash(),
    });
  }
);

// Handle POST requests for editing subcategory
router.post(
  "/dashboard/subcategories/edit/:subcategoryId",
  isLoggedIn,
  require2FA,
  isAdmin,
  async (req, res) => {
    const subcategoryId = req.params.subcategoryId;
    const { subcategoryName } = req.body;

    try {
      // Find the subcategory in the database
      const subcategory = await Subcategory.findByPk(subcategoryId);

      if (!subcategory) {
        req.flash("error", "Subcategory not found");
        return res.redirect("/admin/dashboard/manage-categories");
      }

      // Update the subcategory name
      subcategory.name = subcategoryName;

      // Save the changes to the database
      await subcategory.save();

      req.flash("success", "Subcategory updated successfully");
      res.redirect("/admin/dashboard/manage-categories");
    } catch (error) {
      console.error("Error updating subcategory:", error);
      req.flash("error", "Error updating subcategory");
      res.redirect("/admin/dashboard/manage-categories");
    }
  }
);

// Delete Subcategory Route
router.get(
  "/dashboard/subcategories/delete/:subcategoryId",
  isLoggedIn,
  require2FA,
  isAdmin,
  async (req, res) => {
    // Fetch the subcategory from the database based on subcategoryId
    const subcategoryId = req.params.subcategoryId;
    const subcategory = await Subcategory.findByPk(subcategoryId);

    if (!subcategory) {
      req.flash("error", "Subcategory not found");
      return res.redirect("/admin/dashboard/manage-categories");
    }

    // Delete the subcategory
    await subcategory.destroy();

    req.flash("success", "Subcategory deleted successfully");
    res.redirect("/admin/dashboard/manage-categories");
  }
);

router.get("/dashboard/manage-categories", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  // Get and Verify the JWT
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id;

  // Fetch the user's profile data from the database using their id
  const user = await User.findOne({ where: { id: userId } });

  //Fetch the user's role
  const role = await Role.findOne({ where: { id: user.roleId } });

  const categories = await Category.findAll();
  const subcategories = await Subcategory.findAll();

  res.render("admin/manage-categories", {
    user: user,
    role: role,
    flash: req.flash(),
    categories: categories,
    subcategories: subcategories,
  });
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

router.get("/ban/:id", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const loggedInUserId = decoded.id;
    const userId = req.params.id;

    if (userId === loggedInUserId) {
      req.flash("error", "You cannot ban yourself");
      return res.redirect("/admin/dashboard/all-users");
    }

    const user = await User.findByPk(userId);
    const role = await Role.findOne({ where: { id: user.roleId } });

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/admin/dashboard/all-users");
    }

    if (user.is_banned) {
      req.flash("error", "User is already banned");
      return res.redirect("/admin/dashboard/all-users");
    }

    res.render("admin/ban", { user, role, flash: req.flash() });
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred");
    res.redirect("/admin/dashboard/all-users");
  }
});

router.post(
  "/ban/:id",
  isLoggedIn,
  require2FA,
  isAdmin,
  [
    check("banned_reason").notEmpty().withMessage("Banned reason is required"),
    check("banned_until").notEmpty().withMessage("Banned until is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        req.flash("error", errors.array()[0].msg);
        return res.redirect(`/admin/ban/${req.params.id}`);
      }

      const userId = req.params.id;
      const user = await User.findByPk(userId);

      if (!user) {
        req.flash("error", "User not found");
        return res.redirect("/admin/dashboard/all-users");
      }

      if (user.is_banned) {
        req.flash("error", "User is already banned");
        return res.redirect("/admin/dashboard/all-users");
      }

      const { banned_reason, banned_until } = req.body;
      user.is_banned = true;
      user.banned_reason = banned_reason;
      user.banned_until = banned_until;
      await user.save();

      req.flash("success", "User has been banned successfully");
      res.redirect("/admin/dashboard/all-users");
    } catch (error) {
      console.error(error);
      req.flash("error", "An error occurred");
      res.redirect(`/admin/ban/${req.params.id}`);
    }
  }
);

router.get("/unban/:id", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    const role = await Role.findOne({ where: { id: user.roleId } });

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/admin/dashboard/all-users");
    }

    if (!user.is_banned) {
      req.flash("error", "User is not banned");
      return res.redirect("/admin/dashboard/all-users");
    }

    res.render("admin/unban", { user, role, flash: req.flash() });
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred");
    res.redirect("/admin/dashboard/all-users");
  }
});

router.post("/unban/:id", isLoggedIn, require2FA, isAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      req.flash("error", "User not found");
      return res.redirect("/admin/dashboard/all-users");
    }

    if (!user.is_banned) {
      req.flash("error", "User is not banned");
      return res.redirect("/admin/dashboard/all-users");
    }

    // Unban the user
    user.banned_reason = null;
    user.banned_until = null;
    user.is_banned = false;
    await user.save();

    req.flash("success", "User has been unbanned");
    res.redirect("/admin/dashboard/all-users");
  } catch (error) {
    console.error(error);
    req.flash("error", "An error occurred");
    res.redirect("/admin/dashboard/all-users");
  }
});

module.exports = router;
