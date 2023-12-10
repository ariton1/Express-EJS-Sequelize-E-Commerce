const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
require("dotenv").config();

// Import middlewares
const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");

const {
  renderLogin,
  login,
  logout,
  renderResetPassword,
  resetPassword,
  renderRegister,
  register,
  renderMnemonic,
  mnemonic,
  renderSet2FA,
  set2FA,
  renderSettings,
  renderChangePassword,
  changePassword,
  renderChange2FA,
  change2FA,
  renderDeleteAccount,
  deleteAccount,
  renderUserProfile,
} = require("../controllers/userController");

router.get("/login", renderLogin);
router.post(
  "/login",
  [
    check("username", "Please enter a valid username").isAlphanumeric(),
    check("password", "Please enter a valid password").isLength({ min: 8 }),
  ],
  login
);

router.get("/logout", logout);

router.get("/reset-password", renderResetPassword);
router.post(
  "/reset-password",
  [
    check("username", "Username cannot be empty").not().isEmpty(),
    check("password", "Password cannot be empty").not().isEmpty(),
    check(
      "password",
      "Password must have at least 8 characters and contain at least 1 uppercase character, 1 lowercase character, 1 number, and 1 symbol"
    )
      .isLength({ min: 8, max: 32 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$/, "i"),
    check("confirmPassword", "Passwords do not match").custom(
      (value, { req }) => value === req.body.password
    ),
  ],
  resetPassword
);

router.get("/register", renderRegister);
router.post(
  "/register",
  [
    check("username", "Username must be alphanumeric and have at least 5 characters")
      .isAlphanumeric()
      .isLength({ min: 5, max: 32 }),
    check(
      "password",
      "Password must have at least 8 characters and contain at least 1 uppercase character, 1 lowercase character, 1 number, and 1 symbol"
    )
      .isLength({ min: 8, max: 32 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).+$/, "i"),
    check("confirmPassword", "Passwords do not match").custom(
      (value, { req }) => value === req.body.password
    ),
    check("phrase", "Phrase must have at least 5 characters").isLength({
      min: 5,
      max: 32,
    }),
  ],
  register
);

router.get("/mnemonic", isLoggedIn, renderMnemonic);
router.post("/mnemonic", isLoggedIn, mnemonic);

router.get("/set-2fa", isLoggedIn, renderSet2FA);
router.post("/set-2fa", isLoggedIn, set2FA);

router.get("/settings", isLoggedIn, require2FA, renderSettings);
router.get("/settings/change-password", isLoggedIn, require2FA, renderChangePassword);

router.post(
  "/settings/change-password",
  isLoggedIn,
  require2FA,
  [
    check("currentPassword", "Please provide your current password").notEmpty(),
    check(
      "newPassword",
      "Password must have at least 8 characters and contain at least 1 uppercase character, 1 lowercase character, 1 number, and 1 symbol"
    )
      .isLength({ min: 8, max: 32 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,32}$/, "i"),
    check("confirmPassword", "Passwords do not match").custom(
      (value, { req }) => value === req.body.newPassword
    ),
  ],
  changePassword
);

router.get("/settings/change-2fa", isLoggedIn, require2FA, renderChange2FA);
router.post("/settings/change-2fa", isLoggedIn, require2FA, change2FA);

router.get("/settings/delete-account", isLoggedIn, require2FA, renderDeleteAccount);
router.post(
  "/settings/delete-account",
  isLoggedIn,
  require2FA,
  [
    check("password", "Please enter your current password").notEmpty(),
    check("confirmPassword", "Passwords do not match")
      .custom((value, { req }) => value === req.body.password)
      .notEmpty(),
    check("mnemonic", "Please enter your mnemonic").notEmpty(),
  ],
  deleteAccount
);

router.get("/user/:id", isLoggedIn, require2FA, renderUserProfile);

module.exports = router;
