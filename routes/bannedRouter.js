const express = require("express");
const router = express.Router();

const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");

const { renderBannedHomepage } = require("../controllers/bannedController");

router.get("/", isLoggedIn, require2FA, renderBannedHomepage);

module.exports = router;
