const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const openpgp = require("openpgp");

// Import middlewares
const isLoggedIn = require("../middleware/isLoggedIn");
const require2FA = require("../middleware/require2FA");

// Import the database models
const db = require("../models");
const User = db.User;
const Role = db.Role;

// GET request to display the form to add PGP key
router.get("/add-pgp-key", isLoggedIn, require2FA, async (req, res) => {
    		// Get and Verify the JWT
		const token = req.cookies.token;
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const userId = decoded.id;
	
		// Fetch the user's profile data from the database using their id
		const user = await User.findOne({ where: { id: userId } });
	
		//Fetch the user's role
		const role = await Role.findOne({ where: { id: user.roleId } });

        res.render("users/settings/add-pgp-key", {
            user: user,
            role: role,
            flash: req.flash(),
        });
});

// POST request to handle form submission to add PGP key
router.post("/add-pgp-key", isLoggedIn, require2FA, async (req, res) => {
    // Get the PGP key from the form
    const pgpKey = req.body.pgp_key;
        try {
            const key = await openpgp.readKey({ armoredKey: pgpKey});
            const keyIsValid = key.keys && key.keys.length > 0;
            if (!keyIsValid) {
                req.flash("Invalid PGP key format.");
                res.redirect("/pgp/add-pgp-key");
                return;
          }
        } catch (error) {
            req.flash("error", "Invalid PGP key format. Please try again.");
            res.redirect("/pgp/add-pgp-key");
            return;
        }

        // Check if the key already exists in another user
        const existingUser = await User.findOne({ where: { pgp_key: pgpKey } });
        console.log('testtestetetsetsetestsetsets');
        if (existingUser) {
            req.flash("error", "This PGP key is already in use by another user. Please use a different key.");
            res.redirect("/pgp/add-pgp-key");
        } else {
            // Get and Verify the JWT
            const token = req.cookies.token;
            console.log(token);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userId = decoded.id;
    
            // Fetch the user's profile data from the database using their id
            const user = await User.findOne({ where: { id: userId } });
            user.pgp_key = pgpKey;
            await user.save();
        }
});

module.exports = router;
