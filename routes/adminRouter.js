const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

// Import middlewares
const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");
const isAdmin = require("../middleware/isAdmin");

const adminMiddlewares = [isLoggedIn, require2FA, isAdmin];

const {
  renderAdminDashboard,
  renderAllUsers,
  getPendingApplications,
  getAllApplications,
  renderCreateCategory,
  createCategory,
  renderCreateSubcategory,
  createSubcategory,
  renderEditCategory,
  editCategory,
  deleteCategory,
  renderEditSubcategory,
  editSubcategory,
  deleteSubcategory,
  renderManageCategories,
  getApplication,
  approveApplication,
  rejectApplication,
  renderBanUser,
  banUser,
  renderUnbanUser,
  unbanUser,
} = require("../controllers/adminController");

router.get("/dashboard", adminMiddlewares, renderAdminDashboard);
router.get("/dashboard/all-users", adminMiddlewares, renderAllUsers);

router.get("/dashboard/pending-applications", adminMiddlewares, getPendingApplications);
router.get("/dashboard/all-applications", adminMiddlewares, getAllApplications);

router.get("/dashboard/categories/create", adminMiddlewares, renderCreateCategory);
router.post("/dashboard/categories/create", adminMiddlewares, createCategory);
router.get("/dashboard/subcategories/create", adminMiddlewares, renderCreateSubcategory);
router.post("/dashboard/subcategories/create", adminMiddlewares, createSubcategory);

router.get("/dashboard/categories/edit/:categoryId", adminMiddlewares, renderEditCategory);
router.post("/dashboard/categories/edit/:categoryId", adminMiddlewares, editCategory);
router.get("/dashboard/categories/delete/:categoryId", adminMiddlewares, deleteCategory);
router.get("/dashboard/subcategories/edit/:subcategoryId", adminMiddlewares, renderEditSubcategory);
router.post("/dashboard/subcategories/edit/:subcategoryId", adminMiddlewares, editSubcategory);
router.get("/dashboard/subcategories/delete/:subcategoryId", adminMiddlewares, deleteSubcategory);
router.get("/dashboard/manage-categories", adminMiddlewares, renderManageCategories);

router.get("/application/:id", adminMiddlewares, getApplication);
router.post("/application/:id/approve", adminMiddlewares, approveApplication);
router.post(
  "/application/:id/reject",
  adminMiddlewares,
  [check("rejection_reason", "Rejection reason is required").not().isEmpty()],
  rejectApplication
);

router.get("/ban/:id", adminMiddlewares, renderBanUser);
router.post(
  "/ban/:id",
  adminMiddlewares,
  [
    check("banned_reason").notEmpty().withMessage("Banned reason is required"),
    check("banned_until").notEmpty().withMessage("Banned until is required"),
  ],
  banUser
);
router.get("/unban/:id", adminMiddlewares, renderUnbanUser);
router.post("/unban/:id", adminMiddlewares, unbanUser);

module.exports = router;
