require("dotenv").config();
const bip39 = require("bip39");
const QRCode = require("qrcode");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const speakeasy = require("speakeasy");

const db = require("../models");
const User = db.User;
const Role = db.Role;

const { validationResult } = require("express-validator");

const getUserIdFromToken = require("../utils/getUserIdFromToken");

exports.renderLogin = (req, res) => {
  const token = req.cookies.token;
  if (token) {
    return res.redirect("/");
  }
  res.render("users/login", { flash: req.flash(), role: null });
};

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash(
      "error",
      errors.array().map((error) => error.msg)
    );
    return res.redirect("/users/login");
  }

  const user = await User.findOne({
    where: { username: req.body.username },
  });
  if (!user) {
    req.flash("error", "Invalid username or password");
    return res.redirect("/users/login");
  }

  // Check if the password is correct
  const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
  if (!passwordIsValid) {
    req.flash("error", "Invalid username or password");
    return res.redirect("/users/login");
  }

  // If the user hasn't set up 2FA yet, redirect them to the 2FA setup page
  if (!user.twofactor_enabled) {
    // Generate a JWT and set it in a cookie
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    res.cookie("token", token, {
      expires: new Date(Date.now() + 86400000),
      httpOnly: true, // Only accessible by the server
    });

    return res.redirect("/users/set-2fa");
  }

  // If the user has set up 2FA, check if they have entered the correct 2FA code
  const twofactor_secret = CryptoJS.AES.decrypt(user.twofactor_secret, process.env.MNEMONIC_KEY).toString(
    CryptoJS.enc.Utf8
  );
  const code = req.body.code;

  if (!code) {
    req.flash("error", "Please enter your 2FA code");
    return res.redirect("/users/login");
  }

  const verified = speakeasy.totp.verify({
    secret: twofactor_secret,
    encoding: "base32",
    token: code,
  });

  if (!verified) {
    req.flash("error", "Invalid 2FA code");
    return res.redirect("/users/login");
  }

  // If the username, password, and 2FA code are correct (if applicable), generate a JWT and send it back to the client
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  // Set the token in a cookie with an expiration date
  res.cookie("token", token, {
    expires: new Date(Date.now() + 86400000),
    httpOnly: true,
  });

  res.redirect("/");
};

exports.logout = (req, res) => {
  res.clearCookie("token");
  res.redirect("/users/login");
};

exports.renderResetPassword = (req, res) => {
  const token = req.cookies.token;
  if (token) {
    return res.redirect("/");
  }
  res.render("users/reset-password", { flash: req.flash(), role: null });
};

exports.resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash(
      "error",
      errors.array().map((error) => error.msg)
    );
    return res.redirect("/users/reset-password");
  }

  // Check if the user exists
  const user = await User.findOne({
    where: { username: req.body.username.toLowerCase() },
  });

  if (!user) {
    req.flash("error", "User not found");
    return res.redirect("/users/reset-password");
  }

  // Get the mnemonic key from the .env file
  const mnemonicKey = process.env.MNEMONIC_KEY;

  // Decrypt the mnemonic
  const decrypted = CryptoJS.AES.decrypt(user.mnemonic, mnemonicKey);
  const originalMnemonic = decrypted.toString(CryptoJS.enc.Utf8);

  // Check if the mnemonic is correct
  if (originalMnemonic !== req.body.mnemonic) {
    req.flash("error", "Mnemonic is incorrect");
    return res.redirect("/users/reset-password");
  }

  // Hash the new password
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  // Update the user's password
  User.update({ password: hashedPassword }, { where: { id: user.id } })
    .then(() => {
      req.flash("success", "Password reset successfully");
      res.redirect("/users/login");
    })
    .catch((error) => {
      res.status(500).send({ error: error });
    });
};

exports.renderRegister = (req, res) => {
  const token = req.cookies.token;
  if (token) {
    return res.redirect("/");
  }
  res.render("users/register", { flash: req.flash(), role: null });
};

exports.register = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Set flash messages and redirect the user back to the register page
    req.flash(
      "error",
      errors.array().map((error) => error.msg)
    );
    return res.redirect("/users/register");
  }

  // Hash the password
  const hashedPassword = bcrypt.hashSync(req.body.password, 10);

  // Check if the 'buyer' role exists
  let role = await Role.findOne({ where: { name: "buyer" } });
  if (!role) {
    // If the 'buyer' role does not exist, create it
    role = await Role.create({ name: "buyer" });
  }

  // Generate a mnemonic
  const mnemonic = bip39.generateMnemonic((strength = 256));
  const mnemonicKey = process.env.MNEMONIC_KEY;
  const encryptedMnemonic = CryptoJS.AES.encrypt(mnemonic, mnemonicKey);

  // Generate an UUID for the newly created user
  const uuid = require("uuid");
  const userId = uuid.v4();

  // Create a new user in the database
  User.create({
    id: userId,
    username: req.body.username.toLowerCase(),
    password: hashedPassword,
    phrase: req.body.phrase,
    mnemonic: encryptedMnemonic.toString(),
    roleId: role.id,
    mnemonic_shown: false,
  })
    .then((user) => {
      // Generate a JWT and send it back to the client
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "24h" });

      // Set the token in a cookie with an expiration date
      res.cookie("token", token, {
        expires: new Date(Date.now() + 86400000),
        httpOnly: true, // Only accessible by the server
      });

      res.redirect("/users/mnemonic");
    })
    .catch((error) => {
      // Check if the error is due to the username already existing
      if (error.name === "SequelizeUniqueConstraintError") {
        req.flash("error", "Username already exists");
        return res.redirect("/users/register");
      }
      res.status(500).send({ error: error });
    });
};

exports.renderMnemonic = async (req, res) => {
  const userId = getUserIdFromToken(req);

  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  if (user.mnemonic_shown) {
    return res.redirect("/");
  }

  // Get the mnemonic key from the .env file
  const mnemonicKey = process.env.MNEMONIC_KEY;

  // Decrypt the mnemonic
  const decrypted = CryptoJS.AES.decrypt(user.mnemonic, mnemonicKey);
  const originalMnemonic = decrypted.toString(CryptoJS.enc.Utf8);

  res.render("users/mnemonic", { mnemonic: originalMnemonic, role: role });
};

exports.mnemonic = async (req, res) => {
  const userId = getUserIdFromToken(req);

  const user = await User.findOne({ where: { id: userId } });
  user.mnemonic_shown = true;
  await user.save();

  res.redirect("/users/set-2fa");
};

exports.renderSet2FA = async (req, res) => {
  const userId = getUserIdFromToken(req);

  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  if (!user.mnemonic_shown) {
    return res.redirect("/users/mnemonic");
  }

  if (user.twofactor_enabled) {
    // If 2FA is already enabled, redirect the user to the home page
    return res.redirect("/");
  }

  // Generate a secret and QR code for the user
  const secret = speakeasy.generateSecret({
    length: 20,
    encoding: "base32",
  });

  QRCode.toDataURL(secret.otpauth_url, (err, src) => {
    if (err) {
      res.send("Something went wrong. Please refresh the page");
    }
    res.render("users/set-2fa", {
      qrCodeUrl: src,
      secret: secret.base32,
      error: req.flash("error"),
      role: role,
    });
  });
};

exports.set2FA = async (req, res) => {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findOne({ where: { id: decoded.id } });

  // If the user has already set up 2FA, redirect them to the home page
  if (user.twofactor_enabled) {
    return res.redirect("/");
  }

  const verified = speakeasy.totp.verify({
    secret: req.body.secret,
    encoding: "base32",
    token: req.body.code, // 2FA code entered by user
  });

  if (verified) {
    user.twofactor_enabled = true;
    // user.twofactor_secret = req.body.secret;
    const mnemonicKey = process.env.MNEMONIC_KEY; // should change the name here
    const encryptedSecret = CryptoJS.AES.encrypt(req.body.secret, mnemonicKey);
    user.twofactor_secret = encryptedSecret.toString();
    user.save();
    res.redirect("/");
  } else {
    req.flash("error", "Invalid 2FA code");
    res.redirect("/users/set-2fa");
  }
};

exports.renderSettings = async (req, res) => {
  const userId = getUserIdFromToken(req);

  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  res.render("users/settings/settings", {
    user: user,
    role: role,
    flash: req.flash(),
  });
};

exports.renderChangePassword = async (req, res) => {
  const userId = getUserIdFromToken(req);

  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });
  res.render("users/settings/change-password", { flash: req.flash(), role: role });
};

exports.changePassword = async (req, res) => {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findOne({ where: { id: decoded.id } });

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash(
      "error",
      errors.array().map((error) => error.msg)
    );
    return res.redirect("/users/settings/change-password");
  }

  if (!user) {
    req.flash("error", "User not found");
    return res.redirect("/users/settings/change-password");
  }

  // Check if the provided current password is correct
  const passwordMatch = bcrypt.compareSync(req.body.currentPassword, user.password);
  if (!passwordMatch) {
    req.flash("error", "Incorrect current password");
    return res.redirect("/users/settings/change-password");
  }

  // Check if the new password is the same as the old password
  if (bcrypt.compareSync(req.body.newPassword, user.password)) {
    req.flash("error", "New password cannot be the same as the old password");
    return res.redirect("/users/settings/change-password");
  }

  // Hash the new password
  const hashedPassword = bcrypt.hashSync(req.body.newPassword, 10);

  await user.update({ password: hashedPassword });

  req.flash("success", "Password changed successfully");
  res.redirect("/users/settings");
};

exports.renderChange2FA = async (req, res) => {
  const userId = getUserIdFromToken(req);

  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  res.render("users/settings/change-2fa", {
    user: user,
    role: role,
    flash: req.flash(),
  });
};

exports.change2FA = async (req, res) => {
  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findOne({ where: { id: decoded.id } });

  if (!user) {
    req.flash("error", "User not found");
    return res.redirect("/users/settings/change-2fa");
  }

  // Check if the provided 2FA code is correct
  const twofactor_secret = CryptoJS.AES.decrypt(user.twofactor_secret, process.env.MNEMONIC_KEY).toString(
    CryptoJS.enc.Utf8
  );
  const code = req.body.code;

  if (!code) {
    req.flash("error", "Please enter your current 2FA code");
    return res.redirect("/users/settings/change-2fa");
  }

  const verified = speakeasy.totp.verify({
    secret: twofactor_secret,
    encoding: "base32",
    token: code,
  });

  if (!verified) {
    req.flash("error", "Incorrect 2FA code");
    return res.redirect("/users/settings/change-2fa");
  }

  await user.update({
    twofactor_enabled: false,
    twofactor_secret: null,
  });
  user.save();
  res.redirect("/users/set-2fa");
};

exports.renderDeleteAccount = async (req, res) => {
  const userId = getUserIdFromToken(req);

  const user = await User.findOne({ where: { id: userId } });
  const role = await Role.findOne({ where: { id: user.roleId } });

  res.render("users/settings/delete-account", {
    user: user,
    role: role,
    flash: req.flash(),
  });
};

exports.deleteAccount = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash(
      "error",
      errors.array().map((error) => error.msg)
    );
    return res.redirect("/users/settings/delete-account");
  }

  const token = req.cookies.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findOne({ where: { id: decoded.id } });

  if (!user) {
    req.flash("error", "User not found");
    return res.redirect("/users/settings/delete-account");
  }

  // Check if the provided password is correct
  const passwordMatch = bcrypt.compareSync(req.body.password, user.password);
  if (!passwordMatch) {
    req.flash("error", "Incorrect password");
    return res.redirect("/users/settings/delete-account");
  }

  // Check if the provided mnemonic is correct
  const mnemonicMatch =
    CryptoJS.AES.decrypt(user.mnemonic, process.env.MNEMONIC_KEY).toString(CryptoJS.enc.Utf8) ===
    req.body.mnemonic;
  if (!mnemonicMatch) {
    req.flash("error", "Incorrect mnemonic");
    return res.redirect("/users/settings/delete-account");
  }

  await user.destroy();
  res.clearCookie("token");

  req.flash("success", "Account deleted successfully");
  res.redirect("/users/login");
};

exports.renderUserProfile = async (req, res) => {
  const userId = getUserIdFromToken(req);

  const user = await User.findOne({ where: { id: userId } });

  const userIdOfVisitedUser = req.params.id;
  const visitedUser = await User.findOne({ where: { id: userIdOfVisitedUser } });

  const role = await Role.findOne({ where: { id: user.roleId } });

  User.findOne({ where: { id: decoded.id } })
    .then((user) => {
      if (!user) {
        return res.status(404).send("User not found");
      }

      const title = visitedUser.username;
      res.render("users/profile", { user, role: role, title });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).send("Internal Server Error");
    });
};
