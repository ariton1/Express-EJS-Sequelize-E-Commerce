const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

// Import middlewares
const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");
const isAdmin = require("../middleware/isAdmin");

// Import the database models
const db = require("../models");
const User = db.User;
const Role = db.Role;

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

module.exports = router;