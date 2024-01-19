const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");

const { renderUserList, renderChat } = require("../controllers/messageController");

router.get("/", isLoggedIn, require2FA, renderUserList);

router.get("/:receiverId", isLoggedIn, require2FA, renderChat);

module.exports = router;
