const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Import middlewares
const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");
const isBuyer = require("../middleware/isBuyer");
const hasPGPKey = require("../middleware/hasPGPKey");

// Import the database models
const db = require("../models");
const User = db.User;
const Role = db.Role;

router.get("/apply-for-vendor", isLoggedIn, require2FA, isBuyer, hasPGPKey, (req, res) => {
    res.render("buyer/apply-for-vendor");
});

router.post("apply-for-vendor", isLoggedIn, require2FA, isBuyer, hasPGPKey, (req, res) => {

})

module.exports = router;