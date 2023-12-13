const jwt = require("jsonwebtoken");

const db = require("../models");
const User = db.User;
const Role = db.Role;
const Category = db.Category;
const Subcategory = db.Subcategory;
const VendorApplication = db.VendorApplication;
const { Op } = require("sequelize");

const { validationResult } = require("express-validator");

exports.renderAdminDashboard = async (req, res) => {
  try {
    // Get and Verify the JWT
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Fetch the user's profile data from the database using their id
    const user = await User.findOne({ where: { id: userId } });

    res.render("admin/dashboard", {
      user: user,
      flash: req.flash(),
    });
  } catch (error) {
    console.error("Error rendering admin dashboard:", error);
    res.status(500).send("Server Error");
  }
};

exports.renderAllUsers = async (req, res) => {
  try {
    let { search, sortBy, sortOrder } = req.query;
    if (req.query.sort) {
      [sortBy, sortOrder] = req.query.sort.split("|");
    }
    sortBy = sortBy || "createdAt";
    sortOrder = sortOrder || "DESC";

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
    console.error("Error fetching users:", err);
    req.flash("error", "Failed to fetch users.");
    res.redirect("/admin/dashboard/all-users");
  }
};

exports.getPendingApplications = async (req, res) => {
  try {
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
      flash: req.flash(),
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

exports.getAllApplications = async (req, res) => {
  try {
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
      flash: req.flash(),
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
};

exports.renderCreateCategory = (req, res) => {
  res.render("admin/create-category", {
    flash: req.flash(),
  });
};

exports.createCategory = async (req, res) => {
  try {
    // Extract category data from the request body
    const { name } = req.body;

    // Validate the data (maybe add more validation later)
    if (!name) {
      req.flash("error", "Category name is required.");
      return res.redirect("/categories/create");
    }

    await Category.create({
      name: name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    req.flash("success", "Category created successfully.");
    res.redirect("/admin/dashboard/manage-categories");
  } catch (error) {
    console.error("Error creating category:", error);
    req.flash("error", "An error occurred while creating the category.");
    res.redirect("/categories/create");
  }
};

exports.renderCreateSubcategory = async (req, res) => {
  const categories = await Category.findAll();

  res.render("admin/create-subcategory", {
    categories: categories,
    flash: req.flash(),
  });
};

exports.createSubcategory = async (req, res) => {
  try {
    const { name, category_id } = req.body;

    if (!name || !category_id) {
      req.flash("error", "Subcategory name and category are required.");
      return res.redirect("/subcategories/create");
    }

    await Subcategory.create({
      name: name,
      category_id: category_id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    req.flash("success", "Subcategory created successfully.");
    res.redirect("/admin/dashboard/manage-categories");
  } catch (error) {
    console.error("Error creating subcategory:", error);
    req.flash("error", "An error occurred while creating the subcategory.");
    res.redirect("/subcategories/create");
  }
};

exports.renderEditCategory = async (req, res) => {
  // Fetch the category from the database based on categoryId
  const categoryId = req.params.categoryId;
  const category = await Category.findByPk(categoryId);

  if (!category) {
    req.flash("error", "Category not found");
    return res.redirect("/admin/dashboard/manage-categories");
  }

  res.render("admin/edit-category", {
    title: "Edit Category",
    category: category,
    flash: req.flash(),
  });
};

exports.editCategory = async (req, res) => {
  const categoryId = req.params.categoryId;
  const { categoryName } = req.body;

  try {
    const category = await Category.findByPk(categoryId);

    if (!category) {
      req.flash("error", "Category not found");
      return res.redirect("/admin/dashboard/manage-categories");
    }

    category.name = categoryName;
    await category.save();

    req.flash("success", "Category updated successfully");
    res.redirect("/admin/dashboard/manage-categories");
  } catch (error) {
    console.error("Error updating category:", error);
    req.flash("error", "Error updating category");
    res.redirect("/admin/dashboard/manage-categories");
  }
};

exports.deleteCategory = async (req, res) => {
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
};

exports.renderEditSubcategory = async (req, res) => {
  // Fetch the subcategory from the database based on subcategoryId
  const subcategoryId = req.params.subcategoryId;
  const subcategory = await Subcategory.findByPk(subcategoryId);

  if (!subcategory) {
    req.flash("error", "Subcategory not found");
    return res.redirect("/admin/dashboard/manage-categories");
  }

  res.render("admin/edit-subcategory", {
    title: "Edit Subcategory",
    subcategory: subcategory,
    flash: req.flash(),
  });
};

exports.editSubcategory = async (req, res) => {
  const subcategoryId = req.params.subcategoryId;
  const { subcategoryName } = req.body;

  try {
    const subcategory = await Subcategory.findByPk(subcategoryId);

    if (!subcategory) {
      req.flash("error", "Subcategory not found");
      return res.redirect("/admin/dashboard/manage-categories");
    }

    subcategory.name = subcategoryName;
    await subcategory.save();

    req.flash("success", "Subcategory updated successfully");
    res.redirect("/admin/dashboard/manage-categories");
  } catch (error) {
    console.error("Error updating subcategory:", error);
    req.flash("error", "Error updating subcategory");
    res.redirect("/admin/dashboard/manage-categories");
  }
};

exports.deleteSubcategory = async (req, res) => {
  const subcategoryId = req.params.subcategoryId;
  const subcategory = await Subcategory.findByPk(subcategoryId);

  if (!subcategory) {
    req.flash("error", "Subcategory not found");
    return res.redirect("/admin/dashboard/manage-categories");
  }

  await subcategory.destroy();

  req.flash("success", "Subcategory deleted successfully");
  res.redirect("/admin/dashboard/manage-categories");
};

exports.renderManageCategories = async (req, res) => {
  const categories = await Category.findAll();
  const subcategories = await Subcategory.findAll();

  res.render("admin/manage-categories", {
    flash: req.flash(),
    categories: categories,
    subcategories: subcategories,
  });
};

exports.getApplication = async (req, res) => {
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
        flash: req.flash(),
        application,
      });
    })
    .catch((err) => {
      res.status(500).send("Server Error");
    });
};

exports.approveApplication = async (req, res) => {
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
};

exports.rejectApplication = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash(
      "error",
      errors.array().map((error) => error.msg)
    );
    return res.redirect(`/admin/application/${req.params.id}`);
  }

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
        res.send("Application not found");
      } else {
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
};

exports.renderBanUser = async (req, res) => {
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
};

exports.banUser = async (req, res) => {
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
};

exports.renderUnbanUser = async (req, res) => {
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
};

exports.unbanUser = async (req, res) => {
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
};
