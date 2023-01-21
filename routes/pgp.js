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
const PGPKey = db.PGPKey;

// GET request to display the form to add PGP key
router.get("/add-pgp-key", isLoggedIn, require2FA, async (req, res) => {
    // Get and Verify the JWT
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const user = await User.findByPk(
      userId, {
        include: [{
            model: PGPKey
        }]
      }
  );

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
            const keyIsValid = key.keyPacket.version > 0;

            if (!keyIsValid) {
                req.flash("Invalid PGP key format.");
                res.redirect("/pgp/add-pgp-key");
                return;
          } else {
            // Check if the key already exists 
            const existingKey = await PGPKey.findOne({ where: { key: pgpKey } });

            if (existingKey) {
                req.flash("error", "This PGP key is already in use by another user. Please use a different key.");
                res.redirect("/pgp/add-pgp-key");
            } else {
                // Get and Verify the JWT
                const token = req.cookies.token;
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const userId = decoded.id;

                // Find the user
                const user = await User.findByPk(userId);


                // Generate an UUID for the newly created user
                const uuid = require("uuid");
                const pgpKeyId = uuid.v4();

                // Create a new pgp key and associate it with the user
                const newPGPKey = await PGPKey.create({ id: pgpKeyId, key: pgpKey });

                // Associate the PGPKey with the user
                await user.setPGPKey(newPGPKey);
                
                req.flash("success", "PGP key added successfully.");
                res.redirect("/pgp/add-pgp-key");
          }
          }
        } catch (error) {
            console.log(error);
            req.flash("error", "Invalid PGP key format. Please try again.");
            res.redirect("/pgp/add-pgp-key");
            return;
        }
});

router.post("/delete-pgp-key", isLoggedIn, require2FA, async (req, res) => {
    try {
      // Get and Verify the JWT
      const token = req.cookies.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
  
      // Fetch the user's profile data from the database using their id
      const user = await User.findOne({ where: { id: userId }});
      const pgpKey = await PGPKey.findOne({ where: { user_id: userId } });
  
      // Delete the PGP key
      await pgpKey.destroy();
  
      req.flash("success", "PGP key deleted successfully. You can now add a new one.");
      res.redirect("/pgp/add-pgp-key");
    } catch (error) {
      req.flash("error", "Error deleting PGP key. Please try again.");
      res.redirect("/pgp/add-pgp-key");
      return;
    }
  });

module.exports = router;
