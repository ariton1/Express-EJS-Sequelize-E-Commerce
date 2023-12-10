const express = require("express");
const router = express.Router();

// Import middlewares
const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");

const { renderAddPGPKey, addPGPKey, deletePGPKey } = require("../controllers/pgpController");

router.get("/add-pgp-key", isLoggedIn, require2FA, renderAddPGPKey);
router.post("/add-pgp-key", isLoggedIn, require2FA, addPGPKey);
router.post("/delete-pgp-key", isLoggedIn, require2FA, deletePGPKey);

module.exports = router;
